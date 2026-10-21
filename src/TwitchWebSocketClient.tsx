import { useCallback, useEffect, useRef, useState } from 'react';
import { useWebSocket } from './utils/useWebSocket';
import { TWITCH_WEBSOCKET_EVENTSUB_URL } from './constants';
import { isEventSubReconnectMessage, isEventSubWelcomeMessage, isSubscriptionEvent } from './handlers/twitch/event-sub/schemas';
import { subscribeToChat } from './handlers/twitch/event-sub/subscribers/subscribeToChat';
import { twitchEventSubHandler } from './handlers/twitch/twitchEventSubHandler';
import { useMount } from './hooks/useMount';
import { store } from './store/store';
import { EventsubEvent } from './types/twitchEvents';
import { logger } from './utils/logger';

const MAXIMUM_DEDUPLICATION_IDS = 50;

export const TwitchWebSocketClient = () => {
  const broadcasterId = store((s) => s.broadcasterId);
  const userId = store((s) => s.userId);

  // Keep the URL dynamic so we can follow Twitch's session_reconnect flow.
  const [socketUrl, setSocketUrl] = useState<string>(TWITCH_WEBSOCKET_EVENTSUB_URL);
  // Track Twitch-provided keepalive timeout to detect silent disconnects.
  const keepaliveSecondsRef = useRef<number>(10);
  const inactivityTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const followingReconnectRef = useRef<boolean>(false);
  // Track if the main socket is currently using a Twitch-provided reconnect_url
  const isUsingReconnectUrlRef = useRef<boolean>(false);
  // Temporary socket used only during session_reconnect handover
  const temporarySocketRef = useRef<WebSocket | null>(null);
  // Keep the most recent reconnect_url so the temporary socket handler can promote it
  const reconnectUrlRef = useRef<string | null>(null);
  // Deduplicate EventSub messages by metadata.message_id (small LRU)
  const processedMessageIdsRef = useRef<string[]>([]);
  const baseUrlRef = useRef<string>(TWITCH_WEBSOCKET_EVENTSUB_URL);
  // Ensure we only connect if we have the necessary IDs
  const shouldConnect = Boolean(broadcasterId && userId);

  useMount(() => {
    // Report to chat the current app version
    const appVersion = import.meta.env.APP_VERSION || 'unknown';
    store.getState().addChatMessage({
      broadcaster_user_id: broadcasterId || '',
      broadcaster_user_login: '',
      broadcaster_user_name: '',
      chatter_user_id: '',
      chatter_user_login: '',
      chatter_user_name: 'System',
      message_id: crypto.randomUUID(),
      message_type: 'text',
      message: {
        text: ``,
        fragments: [
          {
            text: `Chat client version ${appVersion}`,
            type: 'text',
          },
        ],
      },
      badges: [],
      color: '#FF0000',
      eventType: 'channel.chat.message',
    });
  });

  const { lastMessage, getWebSocket } = useWebSocket<string>(
    socketUrl,
    {
      // Reconnect on close and errors; the hook will use our backoff settings.
      shouldReconnect: (closeEvent) => {
        // If we were on a reconnect_url and it closed, ensure future attempts go to base URL
        if (isUsingReconnectUrlRef.current) {
          logger.info(
            `Reconnect socket closed (code ${closeEvent?.code} reason: ${closeEvent?.reason || ''}). Falling back to base URL for future reconnects.`,
          );
          isUsingReconnectUrlRef.current = false;
          // Use a microtask to avoid setState during React render phases from the lib callback
          void Promise.resolve().then(() => setSocketUrl(baseUrlRef.current));
        } else {
          logger.info(`Socket closed (code ${closeEvent?.code} reason: ${closeEvent?.reason || ''}). Scheduling reconnect.`);
        }
        return true;
      },
      retryOnError: true,
      reconnectAttempts: 50,
      // Exponential backoff with cap at 10s: 1s, 2s, 4s, 8s, 10s...
      reconnectInterval: (attemptNumber) => Math.min(Math.pow(2, attemptNumber) * 1000, 10000),
      // Don't share so we can close the socket explicitly if needed
      share: false,
      onError: (event) => {
        logger.warn(`WebSocket error: ${JSON.stringify(event)}`);
      },
      onOpen: () => {
        logger.info(`WebSocket opened to ${socketUrl}`);
      },
      onClose: (event) => {
        logger.info(`WebSocket closed (code ${event.code} reason: ${event.reason || ''})`);
      },
    },
    shouldConnect,
  );

  // Helper to restart an inactivity watchdog tied to Twitch's keepalive window.
  const resetInactivityWatchdog = useCallback(() => {
    if (inactivityTimerRef.current) {
      clearTimeout(inactivityTimerRef.current);
      inactivityTimerRef.current = null;
    }
    const bufferMs = 2000; // small grace period
    const timeoutMs = (keepaliveSecondsRef.current || 10) * 1000 + bufferMs;
    inactivityTimerRef.current = setTimeout(() => {
      try {
        // If we have not received any messages within the keepalive window,
        // force a reconnect by closing the socket; the hook will reopen via reconnect logic.
        const ws = getWebSocket();
        // Optional chaining in case proxy limits close; share is false so this should work
        ws?.close();
      } catch {
        logger.warn('Failed to close WebSocket during inactivity timeout');
      }
    }, timeoutMs);
  }, [getWebSocket]);

  const hasSeenMessageId = useCallback((id: string): boolean => {
    return processedMessageIdsRef.current.includes(id);
  }, []);

  const rememberMessageId = useCallback((id: string): void => {
    const processedMessageIds = processedMessageIdsRef.current;
    if (processedMessageIds.includes(id)) {
      return;
    }
    processedMessageIds.push(id);
    if (processedMessageIds.length > MAXIMUM_DEDUPLICATION_IDS) {
      processedMessageIds.shift();
    }
  }, []);

  // Close and cleanup the temporary reconnect socket
  const closeTemporarySocket = useCallback(() => {
    try {
      const temporarySocket = temporarySocketRef.current;
      if (temporarySocket) {
        temporarySocket.onopen = null;
        temporarySocket.onmessage = null;
        temporarySocket.onerror = null;
        temporarySocket.onclose = null;
        if (temporarySocket.readyState === WebSocket.OPEN || temporarySocket.readyState === WebSocket.CONNECTING) {
          temporarySocket.close();
        }
      }
    } catch (e) {
      logger.warn(`Error closing temporary reconnect socket: ${JSON.stringify(e)}`);
    } finally {
      temporarySocketRef.current = null;
    }
  }, []);

  // Bridge notifications coming in via the temporary socket to our handlers
  const handleTempSocketMessage = useCallback(
    (dataStr: string) => {
      try {
        resetInactivityWatchdog();
        const jsonData = JSON.parse(dataStr);
        const messageId: string | undefined = jsonData?.metadata?.message_id;

        if (!messageId || hasSeenMessageId(messageId)) {
          return;
        }
        rememberMessageId(messageId);

        switch (jsonData?.metadata?.message_type) {
          case 'session_welcome': {
            if (isEventSubWelcomeMessage(jsonData)) {
              const keepalive = jsonData.payload.session.keepalive_timeout_seconds;
              if (typeof keepalive === 'number' && keepalive >= 10) {
                keepaliveSecondsRef.current = keepalive;
              }
              logger.info('Temporary reconnect socket received session_welcome, switching primary connection');
              // Switch the primary socket to the reconnect_url by closing it; the hook will reconnect to current socketUrl
              // But first, ensure we point the hook at the reconnect_url
              isUsingReconnectUrlRef.current = true;
              followingReconnectRef.current = true;
              // Point main hook at the reconnect URL and then close it to promote
              const reconnectUrl = reconnectUrlRef.current;
              if (reconnectUrl) {
                void Promise.resolve().then(() => setSocketUrl(reconnectUrl));
              }
              // Close the primary socket to trigger the hook's reconnect to reconnect_url
              try {
                getWebSocket()?.close();
              } catch (e) {
                logger.warn(`Failed to close primary socket during handover: ${JSON.stringify(e)}`);
              }
              // We can now close the temporary socket; the hook-managed connection will take over
              closeTemporarySocket();
            }
            break;
          }
          case 'notification': {
            if (isSubscriptionEvent(jsonData.payload)) {
              const transformedData = {
                ...jsonData.payload.event,
                eventType: jsonData.payload.subscription.type,
              } as EventsubEvent;
              void twitchEventSubHandler(transformedData);
            }
            break;
          }
          case 'revocation': {
            logger.warn(`EventSub subscription revoked (temporary socket): ${JSON.stringify(jsonData.payload?.subscription)}`);
            break;
          }
          default:
            break;
        }
      } catch (e) {
        logger.warn(`Failed to handle temporary reconnect message: ${JSON.stringify(e)}`);
      }
    },
    [closeTemporarySocket, getWebSocket, hasSeenMessageId, rememberMessageId, resetInactivityWatchdog],
  );

  useEffect(() => {
    const data = lastMessage?.data;

    if (!data) {
      // No data received; don't spam logs to avoid noise
      return;
    }

    // Any message counts as activity for the watchdog
    resetInactivityWatchdog();

    const jsonData = JSON.parse(data);
    const messageId: string | undefined = jsonData?.metadata?.message_id;

    if (!messageId || hasSeenMessageId(messageId)) {
      return;
    }
    rememberMessageId(messageId);

    switch (jsonData.metadata.message_type) {
      case 'session_welcome': {
        if (isEventSubWelcomeMessage(jsonData)) {
          const sessionId = jsonData.payload.session.id;
          const keepalive = jsonData.payload.session.keepalive_timeout_seconds;
          if (typeof keepalive === 'number' && keepalive >= 10) {
            keepaliveSecondsRef.current = keepalive;
          }

          // If we had a temporary socket, we can safely close it now
          closeTemporarySocket();

          // If this welcome is part of Twitch-directed reconnect flow, do not resubscribe
          if (followingReconnectRef.current) {
            followingReconnectRef.current = false;
          } else if (sessionId && broadcasterId && userId) {
            void subscribeToChat(broadcasterId, userId, sessionId);
          }
        }
        break;
      }

      case 'notification':
        if (isSubscriptionEvent(jsonData.payload)) {
          // Transform the data first so that we can have a discriminated union type
          const transformedData = {
            ...jsonData.payload.event,
            eventType: jsonData.payload.subscription.type,
          } as EventsubEvent;

          void twitchEventSubHandler(transformedData);
        }
        break;

      case 'session_reconnect': {
        if (isEventSubReconnectMessage(jsonData)) {
          const reconnectUrl = jsonData.payload.session.reconnect_url;
          if (reconnectUrl) {
            logger.info('Following Twitch session_reconnect using temporary handover socket');

            // Ensure any existing temporary socket is closed
            closeTemporarySocket();
            reconnectUrlRef.current = reconnectUrl;

            // Spin up a temporary socket to the reconnect_url to minimize loss.
            try {
              const temporarySocket = new WebSocket(reconnectUrl);
              temporarySocketRef.current = temporarySocket;

              temporarySocket.onopen = () => {
                logger.info('Temporary reconnect WebSocket opened');
              };
              temporarySocket.onmessage = (event) => {
                const dataStr = typeof event.data === 'string' ? event.data : '';
                if (dataStr) {
                  handleTempSocketMessage(dataStr);
                }
              };
              temporarySocket.onerror = (event) => {
                logger.warn(`Temporary reconnect WebSocket error: ${JSON.stringify(event)}`);
              };
              temporarySocket.onclose = (event) => {
                logger.info(`Temporary reconnect WebSocket closed (code ${event.code} reason: ${event.reason || ''})`);
              };
            } catch (error) {
              logger.warn(`Failed to create temporary reconnect WebSocket: ${JSON.stringify(error)}`);
              // Fall back: close primary to trigger hook reconnect on base
              try {
                getWebSocket()?.close();
              } catch (error) {
                logger.warn(`Fallback close after temporary socket failure also failed: ${JSON.stringify(error)}`);
              }
            }
          } else {
            logger.warn('session_reconnect without reconnect_url; closing socket to trigger base reconnect');
            try {
              getWebSocket()?.close();
            } catch (error) {
              logger.warn(`Fallback close without reconnect_url failed: ${JSON.stringify(error)}`);
            }
          }
        }
        break;
      }

      case 'revocation':
        logger.warn(`EventSub subscription revoked: ${JSON.stringify(jsonData.payload?.subscription)}`);
        break;
      default:
        break;
    }
  }, [
    broadcasterId,
    lastMessage,
    userId,
    getWebSocket,
    resetInactivityWatchdog,
    closeTemporarySocket,
    handleTempSocketMessage,
    hasSeenMessageId,
    rememberMessageId,
  ]);

  // Clear the inactivity timer and temporary socket on unmount
  useEffect(() => {
    return () => {
      if (inactivityTimerRef.current) {
        clearTimeout(inactivityTimerRef.current);
        inactivityTimerRef.current = null;
      }
      closeTemporarySocket();
    };
  }, [closeTemporarySocket]);

  return null; // This component does not render anything
};

import { TWITCH_HELIX_URL } from '../../../../constants';
import { persistedStore, store } from '../../../../store/store';
import { EventSubCondition, EventsubSubscriptionType } from '../../../../types/twitchEvents';
import { logger } from '../../../../utils/logger';

export const eventSubscribe = async (sessionId: string, type: EventsubSubscriptionType, condition: EventSubCondition, version = '1') => {
  try {
    const url = `${TWITCH_HELIX_URL}eventsub/subscriptions`;
    const accessToken = persistedStore.getState().accessToken;
    const clientId = store.getState().clientId;

    const body = JSON.stringify({
      type,
      version,
      condition,
      transport: {
        method: 'websocket',
        session_id: sessionId,
      },
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Client-Id': clientId,
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body,
    });

    if (response.status === 401) {
      logger.warn(`Twitch rejected the access token while subscribing to ${type}.`);
      store.getState().setTokenStatus('expired');
    }
  } catch (error) {
    logger.error(`Failed to subscribe to EventSub event ${type}: ${JSON.stringify(error)}`);
  }
};

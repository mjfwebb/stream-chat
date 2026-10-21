import { store } from '../../../../store/store';
import { logger } from '../../../../utils/logger';
import { eventSubscribe } from './eventSubscribe';

export const subscribeToChat = async (broadcasterId: string, userId: string, sessionId: string) => {
  try {
    await eventSubscribe(sessionId, 'channel.chat.message', {
      broadcaster_user_id: broadcasterId,
      user_id: userId,
    });
    await eventSubscribe(sessionId, 'channel.chat.message_delete', {
      broadcaster_user_id: broadcasterId,
      user_id: userId,
    });

    // Subs, raids and announcements. Only needed when the URL asks for banners.
    if (store.getState().noticeKinds.length > 0) {
      await eventSubscribe(sessionId, 'channel.chat.notification', {
        broadcaster_user_id: broadcasterId,
        user_id: userId,
      });
    }
  } catch (error) {
    logger.error(`Failed to subscribe to chat events: ${JSON.stringify(error)}`);
  }
};

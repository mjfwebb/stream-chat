import { store } from '../../store/store';
import { EventsubEvent } from '../../types/twitchEvents';
import { logger } from '../../utils/logger';
import { noticeToChatMessage } from '../../utils/notices';
import { fetchUserInformation } from './helix/fetchUserInformation';

export async function twitchEventSubHandler(data: EventsubEvent) {
  switch (data.eventType) {
    case 'channel.chat.message': {
      const currentUserInfo = store.getState().userInformation[data.chatter_user_id];

      if (!currentUserInfo) {
        const userInfo = await fetchUserInformation(data.chatter_user_login);
        if (userInfo === null) {
          logger.warn(`User information not found for user ID: ${data.chatter_user_login}`);
        } else {
          store.getState().addUserInformation(userInfo);
        }
      }
      store.getState().addChatMessage(data);
      break;
    }
    case 'channel.chat.message_delete': {
      store.getState().deleteChatMessage(data);
      logger.info(`Deleted chat message from ${data.target_user_name}: ${data.message_id}`);
      break;
    }

    case 'channel.chat.notification': {
      const notice = noticeToChatMessage(data, store.getState().noticeKinds);
      if (notice) {
        store.getState().addChatMessage(notice);
      }
      break;
    }

    default:
      break;
  }
}

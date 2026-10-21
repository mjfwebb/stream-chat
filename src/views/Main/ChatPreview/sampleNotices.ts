import type { ChannelChatNotificationEvent } from '../../../types/twitchEvents';

const base: ChannelChatNotificationEvent = {
  eventType: 'channel.chat.notification',
  broadcaster_user_id: '0',
  broadcaster_user_name: 'Athano',
  broadcaster_user_login: 'athano',
  chatter_user_id: '0',
  chatter_user_name: 'Alice',
  chatter_user_login: 'alice',
  chatter_is_anonymous: false,
  color: '#ff5733',
  badges: [],
  system_message: '',
  message_id: 'sample-notice',
  message: { text: '', fragments: [] },
  notice_type: 'sub',
};

// Notifications as Twitch sends them, for the preview. The overlay turns them into banners with noticeToChatMessage.
export const SAMPLE_NOTICES: ChannelChatNotificationEvent[] = [
  {
    ...base,
    message_id: 'sample-resub',
    notice_type: 'resub',
    system_message: 'Charlie subscribed at Tier 1. They’ve subscribed for 12 months!',
    message: { text: 'love this channel', fragments: [{ type: 'text', text: 'love this channel' }] },
  },
  {
    ...base,
    message_id: 'sample-gift',
    notice_type: 'community_sub_gift',
    system_message: 'Diana is gifting 5 Tier 1 Subs to Athano’s community!',
  },
  {
    ...base,
    message_id: 'sample-raid',
    notice_type: 'raid',
    system_message: '42 raiders from Bob have joined!',
  },
  {
    ...base,
    message_id: 'sample-announcement',
    notice_type: 'announcement',
    message: { text: 'Giveaway starts at 8pm', fragments: [{ type: 'text', text: 'Giveaway starts at 8pm' }] },
    announcement: { color: 'GREEN' },
  },
];

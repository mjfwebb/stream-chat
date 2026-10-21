import type { ChannelChatMessageEvent, ChannelChatNotificationEvent, ChatMessageFragment, NoticeKind } from '../types/twitchEvents';

export const NOTICE_KINDS: readonly NoticeKind[] = ['subs', 'gifts', 'raids', 'announcements'];

/** Reads the comma separated value from the URL. Unknown kinds are dropped. */
export const parseNoticeKinds = (value: string | null | undefined): NoticeKind[] => {
  const wanted = (value ?? '').split(',').map((part) => part.trim());
  return NOTICE_KINDS.filter((kind) => wanted.includes(kind));
};

const KIND_FOR_NOTICE_TYPE: Partial<Record<ChannelChatNotificationEvent['notice_type'], NoticeKind>> = {
  sub: 'subs',
  resub: 'subs',
  prime_paid_upgrade: 'subs',
  sub_gift: 'gifts',
  community_sub_gift: 'gifts',
  gift_paid_upgrade: 'gifts',
  pay_it_forward: 'gifts',
  raid: 'raids',
  announcement: 'announcements',
};

const LABELS: Record<NoticeKind, string> = { subs: 'SUB', gifts: 'GIFT', raids: 'RAID', announcements: 'ANNOUNCEMENT' };

const COLORS: Record<NoticeKind, string> = { subs: '#a970ff', gifts: '#ff6ba6', raids: '#ff8800', announcements: '#a970ff' };

// The color names that Twitch uses for announcements. PRIMARY follows the channel color, so it uses the default.
const ANNOUNCEMENT_COLORS: Record<string, string> = { BLUE: '#00a3ff', GREEN: '#00c853', ORANGE: '#ff8800', PURPLE: '#a970ff' };

/**
 * Turns a Twitch notification into a chat entry that the overlay can show, or null when it should not show.
 * Twitch writes the sentence for each notice in system_message, so the overlay shows that text.
 */
export const noticeToChatMessage = (event: ChannelChatNotificationEvent, enabledKinds: readonly NoticeKind[]): ChannelChatMessageEvent | null => {
  const kind = KIND_FOR_NOTICE_TYPE[event.notice_type];
  if (!kind || !enabledKinds.includes(kind)) {
    return null;
  }

  // A community gift sends one notice that says how many subs are gifted, then one notice for each gifted sub.
  // Show the first one only, or a gift of 50 subs would fill the overlay.
  if (event.notice_type === 'sub_gift' && event.sub_gift?.community_gift_id) {
    return null;
  }

  const systemText = event.system_message?.trim() ?? '';
  const userFragments: ChatMessageFragment[] = event.message?.text ? event.message.fragments : [];
  const fragments: ChatMessageFragment[] = [
    ...(systemText ? [{ type: 'text' as const, text: userFragments.length ? `${systemText} ` : systemText }] : []),
    ...userFragments,
  ];
  if (fragments.length === 0) {
    return null;
  }

  const color =
    kind === 'announcements' ? (ANNOUNCEMENT_COLORS[event.announcement?.color?.toUpperCase() ?? ''] ?? COLORS.announcements) : COLORS[kind];

  return {
    eventType: 'channel.chat.message',
    broadcaster_user_id: event.broadcaster_user_id,
    broadcaster_user_login: event.broadcaster_user_login,
    broadcaster_user_name: event.broadcaster_user_name,
    chatter_user_id: event.chatter_user_id,
    chatter_user_login: event.chatter_user_login,
    chatter_user_name: event.chatter_user_name,
    message_id: event.message_id,
    message_type: 'text',
    message: { text: fragments.map((fragment) => fragment.text).join(''), fragments },
    badges: [],
    color: event.color,
    notice: { kind, label: LABELS[kind], color },
  };
};

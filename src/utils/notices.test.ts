import { describe, expect, it } from 'vitest';
import type { ChannelChatNotificationEvent, NoticeKind } from '../types/twitchEvents';
import { noticeToChatMessage, NOTICE_KINDS, parseNoticeKinds } from './notices';

const ALL: readonly NoticeKind[] = NOTICE_KINDS;

const makeNotice = (overrides: Partial<ChannelChatNotificationEvent>): ChannelChatNotificationEvent => ({
  eventType: 'channel.chat.notification',
  broadcaster_user_id: '1',
  broadcaster_user_name: 'Streamer',
  broadcaster_user_login: 'streamer',
  chatter_user_id: '2',
  chatter_user_name: 'Alice',
  chatter_user_login: 'alice',
  chatter_is_anonymous: false,
  color: '#ff5733',
  badges: [],
  system_message: '',
  message_id: 'notice-1',
  message: { text: '', fragments: [] },
  notice_type: 'sub',
  ...overrides,
});

describe('parseNoticeKinds', () => {
  it('reads known kinds in a fixed order and drops the rest', () => {
    expect(parseNoticeKinds('raids, nonsense,subs')).toEqual(['subs', 'raids']);
  });

  it('returns nothing for a missing value', () => {
    expect(parseNoticeKinds(null)).toEqual([]);
    expect(parseNoticeKinds('')).toEqual([]);
  });
});

describe('noticeToChatMessage', () => {
  it('shows the sentence that Twitch wrote for a sub', () => {
    const event = makeNotice({ notice_type: 'sub', system_message: 'Alice subscribed at Tier 1.' });
    const message = noticeToChatMessage(event, ALL)!;
    expect(message.message.text).toBe('Alice subscribed at Tier 1.');
    expect(message.notice).toEqual({ kind: 'subs', label: 'SUB', color: '#a970ff' });
    expect(message.message_id).toBe('notice-1');
  });

  it('keeps the message that comes with a resub, including its fragments', () => {
    const event = makeNotice({
      notice_type: 'resub',
      system_message: 'Alice subscribed for 12 months.',
      message: { text: 'love this channel Kappa', fragments: [{ type: 'text', text: 'love this channel Kappa' }] },
    });
    const message = noticeToChatMessage(event, ALL)!;
    expect(message.message.text).toBe('Alice subscribed for 12 months. love this channel Kappa');
    expect(message.message.fragments).toHaveLength(2);
    expect(message.notice?.kind).toBe('subs');
  });

  it('shows a community gift but not the single notices that come with it', () => {
    const community = makeNotice({ notice_type: 'community_sub_gift', system_message: 'Alice is gifting 5 Tier 1 subs.' });
    const single = makeNotice({
      notice_type: 'sub_gift',
      system_message: 'Alice gifted a Tier 1 sub to Bob.',
      sub_gift: {
        duration_months: 1,
        cumulative_total: 5,
        recipient_user_id: '3',
        recipient_user_name: 'Bob',
        recipient_user_login: 'bob',
        sub_tier: '1000',
        community_gift_id: 'gift-1',
      },
    });
    expect(noticeToChatMessage(community, ALL)?.notice?.kind).toBe('gifts');
    expect(noticeToChatMessage(single, ALL)).toBeNull();
  });

  it('shows a gift sub that is not part of a community gift', () => {
    const event = makeNotice({
      notice_type: 'sub_gift',
      system_message: 'Alice gifted a Tier 1 sub to Bob.',
      sub_gift: {
        duration_months: 1,
        cumulative_total: 1,
        recipient_user_id: '3',
        recipient_user_name: 'Bob',
        recipient_user_login: 'bob',
        sub_tier: '1000',
        community_gift_id: null as unknown as string,
      },
    });
    expect(noticeToChatMessage(event, ALL)?.notice?.kind).toBe('gifts');
  });

  it('shows a raid', () => {
    const event = makeNotice({
      notice_type: 'raid',
      system_message: '20 raiders from Bob have joined!',
      raid: { user_id: '3', user_name: 'Bob', user_login: 'bob', viewer_count: 20, profile_image_url: '' },
    });
    const message = noticeToChatMessage(event, ALL)!;
    expect(message.notice).toEqual({ kind: 'raids', label: 'RAID', color: '#ff8800' });
  });

  it('uses the announcement text and color', () => {
    const event = makeNotice({
      notice_type: 'announcement',
      system_message: '',
      message: { text: 'Giveaway at 8pm', fragments: [{ type: 'text', text: 'Giveaway at 8pm' }] },
      announcement: { color: 'GREEN' },
    });
    const message = noticeToChatMessage(event, ALL)!;
    expect(message.message.text).toBe('Giveaway at 8pm');
    expect(message.notice).toEqual({ kind: 'announcements', label: 'ANNOUNCEMENT', color: '#00c853' });
  });

  it('falls back to the default color for the primary announcement color', () => {
    const event = makeNotice({
      notice_type: 'announcement',
      message: { text: 'Hi', fragments: [{ type: 'text', text: 'Hi' }] },
      announcement: { color: 'PRIMARY' },
    });
    expect(noticeToChatMessage(event, ALL)?.notice?.color).toBe('#a970ff');
  });

  it('skips a kind that is switched off', () => {
    const event = makeNotice({ notice_type: 'raid', system_message: '20 raiders from Bob have joined!' });
    expect(noticeToChatMessage(event, ['subs', 'gifts'])).toBeNull();
    expect(noticeToChatMessage(event, [])).toBeNull();
  });

  it('skips notice types that the overlay does not show', () => {
    expect(noticeToChatMessage(makeNotice({ notice_type: 'unraid', system_message: 'The raid was canceled.' }), ALL)).toBeNull();
    expect(noticeToChatMessage(makeNotice({ notice_type: 'charity_donation', system_message: 'Alice donated.' }), ALL)).toBeNull();
  });

  it('skips a notice that has no text at all', () => {
    expect(noticeToChatMessage(makeNotice({ notice_type: 'sub', system_message: '  ' }), ALL)).toBeNull();
  });
});

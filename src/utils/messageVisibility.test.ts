import { describe, expect, it } from 'vitest';
import type { ChannelChatMessageEvent } from '../types/twitchEvents';
import { buildFilterRegex } from './filters';
import { isMessageVisible, parseRoles, type VisibilitySettings } from './messageVisibility';

const makeMessage = (name: string, text: string, badgeSets: string[] = []): ChannelChatMessageEvent => ({
  broadcaster_user_id: '1',
  broadcaster_user_login: 'streamer',
  broadcaster_user_name: 'Streamer',
  chatter_user_id: '2',
  chatter_user_login: name.toLowerCase(),
  chatter_user_name: name,
  message_id: name + text,
  message_type: 'text',
  message: { text, fragments: [{ type: 'text', text }] },
  badges: badgeSets.map((set_id) => ({ set_id, id: '1', info: '' })),
  color: '#ffffff',
  eventType: 'channel.chat.message',
});

const showAll: VisibilitySettings = { usernameFilterRegex: null, messageFilterRegex: null, onlyRoles: [] };

describe('parseRoles', () => {
  it('reads known roles in a fixed order', () => {
    expect(parseRoles('moderator,subscriber')).toEqual(['subscriber', 'moderator']);
  });

  it('drops unknown roles and blanks', () => {
    expect(parseRoles('subscriber, nonsense,,')).toEqual(['subscriber']);
  });

  it('returns nothing for a missing value', () => {
    expect(parseRoles(null)).toEqual([]);
    expect(parseRoles('')).toEqual([]);
  });
});

describe('isMessageVisible', () => {
  it('shows everything with no filters and no roles', () => {
    expect(isMessageVisible(makeMessage('Alice', 'hi'), showAll)).toBe(true);
  });

  it('hides a username that a filter rule matches', () => {
    const usernameFilterRegex = buildFilterRegex({ rules: [{ matchType: 'exact', pattern: 'Nightbot', caseSensitive: false }] });
    const settings = { ...showAll, usernameFilterRegex };
    expect(isMessageVisible(makeMessage('Nightbot', 'hi'), settings)).toBe(false);
    expect(isMessageVisible(makeMessage('Alice', 'hi'), settings)).toBe(true);
  });

  it('hides a message that a filter rule matches', () => {
    const messageFilterRegex = buildFilterRegex({ rules: [{ matchType: 'wildcard', pattern: '!*', caseSensitive: false }] });
    const settings = { ...showAll, messageFilterRegex };
    expect(isMessageVisible(makeMessage('Alice', '!hype'), settings)).toBe(false);
    expect(isMessageVisible(makeMessage('Alice', 'hype'), settings)).toBe(true);
  });

  it('shows only the chosen roles', () => {
    const settings = { ...showAll, onlyRoles: ['moderator', 'vip'] as const };
    expect(isMessageVisible(makeMessage('Mod', 'hi', ['moderator']), settings)).toBe(true);
    expect(isMessageVisible(makeMessage('Vip', 'hi', ['vip']), settings)).toBe(true);
    expect(isMessageVisible(makeMessage('Sub', 'hi', ['subscriber']), settings)).toBe(false);
    expect(isMessageVisible(makeMessage('Nobody', 'hi'), settings)).toBe(false);
  });

  it('counts a founder badge as a subscriber', () => {
    const settings = { ...showAll, onlyRoles: ['subscriber'] as const };
    expect(isMessageVisible(makeMessage('Founder', 'hi', ['founder']), settings)).toBe(true);
  });

  it('applies the role and the filters together', () => {
    const messageFilterRegex = buildFilterRegex({ rules: [{ matchType: 'wildcard', pattern: '!*', caseSensitive: false }] });
    const settings = { ...showAll, messageFilterRegex, onlyRoles: ['moderator'] as const };
    expect(isMessageVisible(makeMessage('Mod', '!command', ['moderator']), settings)).toBe(false);
    expect(isMessageVisible(makeMessage('Mod', 'hello', ['moderator']), settings)).toBe(true);
  });
});

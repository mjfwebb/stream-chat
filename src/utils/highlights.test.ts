import { describe, expect, it } from 'vitest';
import type { ChannelChatMessageEvent } from '../types/twitchEvents';
import { decodeFiltersFromUrl, encodeFiltersToUrl } from './filters';
import { compileHighlightRules, getHighlight, highlightSource, type HighlightConfig, type HighlightSettings } from './highlights';

const makeMessage = (overrides: Partial<ChannelChatMessageEvent> & { text?: string } = {}): ChannelChatMessageEvent => {
  const { text = 'hello', ...rest } = overrides;
  return {
    broadcaster_user_id: '1',
    broadcaster_user_login: 'athano',
    broadcaster_user_name: 'Athano',
    chatter_user_id: '2',
    chatter_user_login: 'chatter',
    chatter_user_name: 'Chatter',
    message_id: 'id',
    message_type: 'text',
    message: { text, fragments: [{ type: 'text', text }] },
    badges: [],
    color: '#ffffff',
    eventType: 'channel.chat.message',
    ...rest,
  };
};

const noSettings: HighlightSettings = {
  highlightPoints: false,
  highlightMentions: false,
  highlightFirstMessages: false,
  highlightMentionsColor: '#a970ff',
  highlightFirstColor: '#00c853',
  highlightPointsColor: '',
  highlightRules: [],
};

describe('compileHighlightRules', () => {
  const config: HighlightConfig = {
    rules: [
      { matchType: 'contains', pattern: 'giveaway', caseSensitive: false, color: '#ff0000' },
      { matchType: 'wildcard', pattern: '!so *', caseSensitive: false, color: '#00ff00' },
      { matchType: 'exact', pattern: '', caseSensitive: false, color: '#0000ff' },
    ],
  };

  it('ignores rules without a pattern', () => {
    expect(compileHighlightRules(config)).toHaveLength(2);
  });

  it('keeps a gradient color and replaces a color that is not valid', () => {
    const rules = compileHighlightRules({
      rules: [
        { matchType: 'contains', pattern: 'one', caseSensitive: false, color: '#ff0000,#0000ff' },
        { matchType: 'contains', pattern: 'two', caseSensitive: false, color: 'not a color' },
      ],
    });
    expect(rules[0].color).toBe('#ff0000,#0000ff');
    expect(rules[1].color).toBe('#a970ff');
  });

  it('matches like a filter rule does', () => {
    const [giveaway, shoutout] = compileHighlightRules(config);
    expect(giveaway.notMatching.test('Join the GIVEAWAY now')).toBe(false);
    expect(giveaway.notMatching.test('hello')).toBe(true);
    expect(shoutout.notMatching.test('!so athano')).toBe(false);
    expect(shoutout.notMatching.test('so athano')).toBe(true);
  });
});

describe('getHighlight', () => {
  it('returns nothing when no highlight is switched on', () => {
    expect(getHighlight(makeMessage({ message_type: 'channel_points_highlighted' }), noSettings)).toBeNull();
  });

  it('uses the spotlight style for a channel point highlight', () => {
    const settings = { ...noSettings, highlightPoints: true };
    expect(getHighlight(makeMessage({ message_type: 'channel_points_highlighted' }), settings)).toEqual({ type: 'spotlight' });
  });

  it('uses the color of the first matching rule', () => {
    const highlightRules = compileHighlightRules({
      rules: [
        { matchType: 'contains', pattern: 'first', caseSensitive: false, color: '#111111' },
        { matchType: 'contains', pattern: 'first', caseSensitive: false, color: '#222222' },
      ],
    });
    expect(getHighlight(makeMessage({ text: 'the first one' }), { ...noSettings, highlightRules })).toEqual({
      type: 'color',
      color: '#111111',
      source: 'rule',
    });
  });

  it('highlights a mention of the channel owner, ignoring case', () => {
    const message = makeMessage({
      message: {
        text: '@ATHANO hi',
        fragments: [{ type: 'mention', text: '@ATHANO', mention: { user_id: '1', user_name: 'Athano', user_login: 'athano' } }],
      },
    });
    expect(getHighlight(message, { ...noSettings, highlightMentions: true })).toEqual({ type: 'color', color: '#a970ff', source: 'mention' });
  });

  it('does not highlight a mention of someone else', () => {
    const message = makeMessage({
      message: {
        text: '@bob hi',
        fragments: [{ type: 'mention', text: '@bob', mention: { user_id: '3', user_name: 'Bob', user_login: 'bob' } }],
      },
    });
    expect(getHighlight(message, { ...noSettings, highlightMentions: true })).toBeNull();
  });

  it('highlights a first message when switched on', () => {
    const message = makeMessage({ message_type: 'user_intro' });
    expect(getHighlight(message, noSettings)).toBeNull();
    expect(getHighlight(message, { ...noSettings, highlightFirstMessages: true })).toEqual({ type: 'color', color: '#00c853', source: 'first' });
  });

  it('uses a different color for each kind', () => {
    const settings = {
      ...noSettings,
      highlightPoints: true,
      highlightMentions: true,
      highlightFirstMessages: true,
      highlightMentionsColor: '#111111',
      highlightFirstColor: '#222222',
      highlightPointsColor: '#333333',
    };
    const mention = makeMessage({
      message: {
        text: '@athano hi',
        fragments: [{ type: 'mention', text: '@athano', mention: { user_id: '1', user_name: 'Athano', user_login: 'athano' } }],
      },
    });
    expect(getHighlight(mention, settings)).toEqual({ type: 'color', color: '#111111', source: 'mention' });
    expect(getHighlight(makeMessage({ message_type: 'user_intro' }), settings)).toEqual({ type: 'color', color: '#222222', source: 'first' });
    expect(getHighlight(makeMessage({ message_type: 'channel_points_highlighted' }), settings)).toEqual({
      type: 'color',
      color: '#333333',
      source: 'points',
    });
  });

  it('keeps Twitch’s purple style for channel point highlights until a color is chosen', () => {
    const settings = { ...noSettings, highlightPoints: true };
    expect(getHighlight(makeMessage({ message_type: 'channel_points_highlighted' }), settings)).toEqual({ type: 'spotlight' });
    expect(getHighlight(makeMessage({ message_type: 'channel_points_highlighted' }), { ...settings, highlightPointsColor: '#ff0000' })).toEqual({
      type: 'color',
      color: '#ff0000',
      source: 'points',
    });
  });

  it('names the reason for every highlight', () => {
    expect(highlightSource({ type: 'spotlight' })).toBe('points');
    expect(highlightSource({ type: 'color', color: '#111111', source: 'mention' })).toBe('mention');
  });

  it('prefers a channel point highlight over a matching rule', () => {
    const highlightRules = compileHighlightRules({ rules: [{ matchType: 'contains', pattern: 'hello', caseSensitive: false, color: '#111111' }] });
    const settings = { ...noSettings, highlightPoints: true, highlightRules };
    expect(getHighlight(makeMessage({ message_type: 'channel_points_highlighted' }), settings)).toEqual({ type: 'spotlight' });
  });
});

describe('highlight rules in the URL', () => {
  it('keeps the color of each rule', () => {
    const config: HighlightConfig = { rules: [{ matchType: 'contains', pattern: 'hi', caseSensitive: false, color: '#abcdef' }] };
    expect(decodeFiltersFromUrl<HighlightConfig['rules'][number]>(encodeFiltersToUrl(config))).toEqual(config);
  });
});

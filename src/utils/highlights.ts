import type { ChannelChatMessageEvent } from '../types/twitchEvents';
import { DEFAULT_CHAT_SETTINGS_VALUES } from '../constants';
import { isColorValue } from './colorValue';
import { buildFilterRegex, type UserFilterConfig, type UserFilterRule } from './filters';

// A highlight rule matches message text like a filter rule does, and also says which color to use.
export type HighlightRule = UserFilterRule & { color: string };
export type HighlightConfig = UserFilterConfig<HighlightRule>;

export const EMPTY_HIGHLIGHT_CONFIG: HighlightConfig = { rules: [] };

export type CompiledHighlightRule = { notMatching: RegExp; color: string };

// Why a message is highlighted. The overlay turns it into a class, such as chat-message--highlight-mention.
export type HighlightSource = 'points' | 'mention' | 'first' | 'rule' | 'notice';

// How a highlighted message looks: Twitch's own purple style for channel point highlights, or a color.
export type Highlight = { type: 'spotlight' } | { type: 'color'; color: string; source: HighlightSource };

/** The reason for a highlight. The Twitch style is always for a channel point highlight. */
export const highlightSource = (highlight: Highlight): HighlightSource => (highlight.type === 'spotlight' ? 'points' : highlight.source);

export interface HighlightSettings {
  highlightPoints: boolean;
  highlightMentions: boolean;
  highlightFirstMessages: boolean;
  highlightMentionsColor: string;
  highlightFirstColor: string;
  // Empty means Twitch's own purple gradient. A color makes a channel point highlight a plain colored banner.
  highlightPointsColor: string;
  highlightRules: CompiledHighlightRule[];
}

/**
 * Prepares rules once, so each message needs only a regex test.
 * A filter regex for one rule matches when the rule does NOT match, so a rule matches when its regex fails.
 */
export const compileHighlightRules = (config: HighlightConfig): CompiledHighlightRule[] =>
  config.rules.flatMap((rule) => {
    const notMatching = buildFilterRegex({ rules: [rule] });
    // A rule comes from JSON in the URL, so its color may not be one the overlay can use
    const color = isColorValue(rule.color) ? rule.color : DEFAULT_CHAT_SETTINGS_VALUES.highlightMentionsColor;
    return notMatching ? [{ notMatching, color }] : [];
  });

const mentionsChannelOwner = (message: ChannelChatMessageEvent): boolean => {
  const owner = message.broadcaster_user_login.toLowerCase();
  return message.message.fragments.some((fragment) => fragment.type === 'mention' && fragment.mention?.user_login.toLowerCase() === owner);
};

/** Decides whether a message is highlighted. Channel point highlights win, then rules (first match), then mentions, then first messages. */
export const getHighlight = (message: ChannelChatMessageEvent, settings: HighlightSettings): Highlight | null => {
  if (settings.highlightPoints && message.message_type === 'channel_points_highlighted') {
    return settings.highlightPointsColor ? { type: 'color', color: settings.highlightPointsColor, source: 'points' } : { type: 'spotlight' };
  }

  const matchingRule = settings.highlightRules.find((rule) => !rule.notMatching.test(message.message.text));
  if (matchingRule) {
    return { type: 'color', color: matchingRule.color, source: 'rule' };
  }

  if (settings.highlightMentions && mentionsChannelOwner(message)) {
    return { type: 'color', color: settings.highlightMentionsColor, source: 'mention' };
  }

  if (settings.highlightFirstMessages && message.message_type === 'user_intro') {
    return { type: 'color', color: settings.highlightFirstColor, source: 'first' };
  }

  return null;
};

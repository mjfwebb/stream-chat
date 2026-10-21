import type { ChannelChatMessageEvent } from '../types/twitchEvents';
import { buildFilterRegex, type UserFilterConfig, type UserFilterRule } from './filters';

// A highlight rule matches message text like a filter rule does, and also says which color to use.
export type HighlightRule = UserFilterRule & { color: string };
export type HighlightConfig = UserFilterConfig<HighlightRule>;

export const EMPTY_HIGHLIGHT_CONFIG: HighlightConfig = { rules: [] };

export type CompiledHighlightRule = { notMatching: RegExp; color: string };

// How a highlighted message looks: Twitch's own purple style for channel point highlights, or a color.
export type Highlight = { type: 'spotlight' } | { type: 'color'; color: string };

export interface HighlightSettings {
  highlightPoints: boolean;
  highlightMentions: boolean;
  highlightFirstMessages: boolean;
  highlightColor: string;
  highlightRules: CompiledHighlightRule[];
}

/**
 * Prepares rules once, so each message needs only a regex test.
 * A filter regex for one rule matches when the rule does NOT match, so a rule matches when its regex fails.
 */
export const compileHighlightRules = (config: HighlightConfig): CompiledHighlightRule[] =>
  config.rules.flatMap((rule) => {
    const notMatching = buildFilterRegex({ rules: [rule] });
    return notMatching ? [{ notMatching, color: rule.color }] : [];
  });

const mentionsChannelOwner = (message: ChannelChatMessageEvent): boolean => {
  const owner = message.broadcaster_user_login.toLowerCase();
  return message.message.fragments.some((fragment) => fragment.type === 'mention' && fragment.mention?.user_login.toLowerCase() === owner);
};

/** Decides whether a message is highlighted. Channel point highlights win, then rules (first match), then mentions, then first messages. */
export const getHighlight = (message: ChannelChatMessageEvent, settings: HighlightSettings): Highlight | null => {
  if (settings.highlightPoints && message.message_type === 'channel_points_highlighted') {
    return { type: 'spotlight' };
  }

  const matchingRule = settings.highlightRules.find((rule) => !rule.notMatching.test(message.message.text));
  if (matchingRule) {
    return { type: 'color', color: matchingRule.color };
  }

  if (settings.highlightMentions && mentionsChannelOwner(message)) {
    return { type: 'color', color: settings.highlightColor };
  }

  if (settings.highlightFirstMessages && message.message_type === 'user_intro') {
    return { type: 'color', color: settings.highlightColor };
  }

  return null;
};

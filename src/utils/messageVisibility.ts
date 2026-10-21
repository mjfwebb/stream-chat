import type { ChannelChatMessageEvent } from '../types/twitchEvents';

// The roles the "only show messages from" setting can pick. A message needs one of the chosen roles to show.
export const ROLES = ['subscriber', 'vip', 'moderator', 'broadcaster'] as const;
export type Role = (typeof ROLES)[number];

// Twitch badge sets that count as each role. Founders are subscribers too.
const ROLE_BADGE_SETS: Record<Role, readonly string[]> = {
  subscriber: ['subscriber', 'founder'],
  vip: ['vip'],
  moderator: ['moderator'],
  broadcaster: ['broadcaster'],
};

/** Reads the comma separated value from the URL. Unknown roles are dropped. */
export const parseRoles = (value: string | null | undefined): Role[] => {
  const wanted = (value ?? '').split(',').map((part) => part.trim());
  return ROLES.filter((role) => wanted.includes(role));
};

export interface VisibilitySettings {
  usernameFilterRegex: RegExp | null;
  messageFilterRegex: RegExp | null;
  onlyRoles: readonly Role[];
}

/** The roles that a message has, from its badges, in a fixed order. */
export const rolesOf = (message: ChannelChatMessageEvent): Role[] =>
  ROLES.filter((role) => message.badges.some((badge) => ROLE_BADGE_SETS[role].includes(badge.set_id)));

const hasRole = (message: ChannelChatMessageEvent, roles: readonly Role[]): boolean => {
  const own = rolesOf(message);
  return roles.some((role) => own.includes(role));
};

/**
 * Decides whether the overlay shows a message. The filter regexes match messages that are allowed,
 * so a message that fails a regex is hidden. With no roles chosen, every role shows.
 */
export const isMessageVisible = (message: ChannelChatMessageEvent, settings: VisibilitySettings): boolean => {
  // A banner for a channel event already passed the show-notices setting, and has no chatter to filter.
  if (message.notice) {
    return true;
  }

  if (settings.onlyRoles.length > 0 && !hasRole(message, settings.onlyRoles)) {
    return false;
  }

  const userOk = settings.usernameFilterRegex ? settings.usernameFilterRegex.test(message.chatter_user_name) : true;
  const messageOk = settings.messageFilterRegex ? settings.messageFilterRegex.test(message.message.text) : true;

  return userOk && messageOk;
};

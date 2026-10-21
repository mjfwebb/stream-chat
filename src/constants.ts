export const TWITCH_CHAT_IRC_WS_URL = 'ws://irc-ws.chat.twitch.tv:80';
export const TWITCH_HELIX_URL = 'https://api.twitch.tv/helix/';
export const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/';
export const TWITCH_WEBSOCKET_EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws';
export const TWITCH_INSIGHTS_URL = 'https://api.twitchinsights.net/v1/';
export const SEVEN_TV_WEBSOCKET_URL = 'wss://events.7tv.io/v3';
export const BETTER_TTV_WEBSOCKET_URL = 'wss://sockets.betterttv.net/ws';

export const CUSTOMIZING_GUIDE_URL = 'https://github.com/mjfwebb/stream-chat/blob/main/CUSTOMIZING.md';

export const SECOND_MS = 1000;
export const MINUTE_MS = 60000;
export const HOUR_MS = 3600000;
// Twitch asks apps to validate their token every hour.
export const TOKEN_VALIDATION_INTERVAL_MS = HOUR_MS;
export const MAX_TWITCH_MESSAGE_LENGTH = 500;

const PRESET_CHAT_SETTINGS_VALUES = {
  dropShadowSettingsPresetSmall: '1px 1px 2px #000000ff',
  dropShadowSettingsPresetMedium: '2px 2px 4px #000000ff',
  dropShadowSettingsPresetLarge: '2px 2px 6px #000000ff',
  textStrokeSettingsPresetThin: '1px black',
  textStrokeSettingsPresetMedium: '2px black',
  textStrokeSettingsPresetThick: '3px black',
  fontSizeValueSmall: 0.75,
  fontSizeValueMedium: 1,
  fontSizeValueLarge: 1.25,
  fontSizeUnit: 'em',
};

export const DEFAULT_CHAT_SETTINGS_VALUES = {
  heightValue: 100,
  heightUnit: 'vh',
  widthValue: 500,
  widthUnit: 'px',
  secondsBeforeExit: 10,
  backgroundColor: 'transparent',
  foregroundColor: '#ffffff',
  dropShadowSettings: PRESET_CHAT_SETTINGS_VALUES.dropShadowSettingsPresetSmall,
  textStrokeSettings: PRESET_CHAT_SETTINGS_VALUES.textStrokeSettingsPresetThin,
  fontSizeValue: PRESET_CHAT_SETTINGS_VALUES.fontSizeValueMedium,
  fontSizeUnit: PRESET_CHAT_SETTINGS_VALUES.fontSizeUnit,
  fontFamily: 'sans-serif',
  chatMessagePaddingValue: 5,
  chatMessagePaddingUnit: 'px',
  animatedExit: false,
  dropShadowEnabled: false,
  showAvatars: true,
  showBorders: false,
  showColonAfterDisplayName: false,
  textStrokeEnabled: false,
  showNameAlias: true,
  animatedEntry: true,
  showGifs: true,
  sevenTVEmotes: true,
  betterTTVEmotes: true,
  frankerFaceZEmotes: true,
  maxMessages: 100,
  avatarSize: 36,
  badgeSize: 19,
  emoteSize: 36,
  lineHeight: 32,
  usernameColor: 'corrected' as UsernameColorMode,
  messageBackgroundColor: 'transparent',
  messageBackgroundOpacity: 80,
  messageRadius: 3,
  chatAnchor: 'bottom' as ChatAnchor,
  highlightPoints: true,
  highlightMentions: false,
  highlightFirstMessages: false,
  highlightMentionsColor: '#a970ff',
  highlightFirstColor: '#00c853',
  // Empty means Twitch's own purple gradient for channel point highlights
  highlightPointsColor: '',
  // How strong the color behind a highlight or a banner is, from 0 to 100
  highlightStrength: 25,
  highlightRules: '',
  showReplies: false,
  showNotices: '',
  noticeColorSubs: '#a970ff',
  noticeColorGifts: '#ff6ba6',
  noticeColorRaids: '#ff8800',
  showNoticeLabels: true,
  onlyRoles: '',
  usernameFilters: '',
  messageFilters: '',
};

export const chatSearchParamsMap = {
  animatedEntry: 'animated-entry',
  backgroundColor: 'background-color',
  height: 'height',
  width: 'width',
  animatedExit: 'animated-exit',
  secondsBeforeExit: 'seconds-before-exit',
  dropShadowEnabled: 'drop-shadow',
  dropShadowSettings: 'drop-shadow-settings',
  foregroundColor: 'foreground-color',
  showAvatars: 'show-avatars',
  showBorders: 'show-borders',
  showColonAfterDisplayName: 'show-colon-after-display-name',
  textStrokeEnabled: 'text-stroke-enabled',
  textStrokeSettings: 'text-stroke',
  fontSize: 'font-size',
  fontFamily: 'font-family',
  chatMessagePadding: 'chat-message-padding',
  showNameAlias: 'show-name-alias',
  showGifs: 'show-gifs',
  sevenTVEmotes: '7tv-emotes',
  betterTTVEmotes: 'bttv-emotes',
  frankerFaceZEmotes: 'ffz-emotes',
  maxMessages: 'max-messages',
  avatarSize: 'avatar-size',
  badgeSize: 'badge-size',
  emoteSize: 'emote-size',
  lineHeight: 'line-height',
  usernameColor: 'username-color',
  messageBackgroundColor: 'message-background-color',
  messageBackgroundOpacity: 'message-background-opacity',
  messageRadius: 'message-radius',
  chatAnchor: 'chat-anchor',
  highlightPoints: 'highlight-points',
  highlightMentions: 'highlight-mentions',
  highlightFirstMessages: 'highlight-first-messages',
  highlightMentionsColor: 'highlight-mentions-color',
  highlightFirstColor: 'highlight-first-color',
  highlightPointsColor: 'highlight-points-color',
  highlightStrength: 'highlight-strength',
  highlightRules: 'highlight-rules',
  showReplies: 'show-replies',
  showNotices: 'show-notices',
  noticeColorSubs: 'notice-color-subs',
  noticeColorGifts: 'notice-color-gifts',
  noticeColorRaids: 'notice-color-raids',
  showNoticeLabels: 'notice-labels',
  onlyRoles: 'only-roles',
  usernameFilters: 'username-filters',
  messageFilters: 'message-filters',
};

// Before there was one color for mentions and first messages, it was set with highlight-color.
// URLs that use it keep working: it is the fallback for both colors.
export const LEGACY_HIGHLIGHT_COLOR_PARAM = 'highlight-color';

// Settings that hold one color or a two color gradient. See utils/colorValue.ts.
export const COLOR_VALUE_SETTINGS = [
  'highlightMentionsColor',
  'highlightFirstColor',
  'highlightPointsColor',
  'noticeColorSubs',
  'noticeColorGifts',
  'noticeColorRaids',
] as const;

// Settings that only accept a fixed set of values. The first value is the default.
export const SETTING_OPTIONS = {
  usernameColor: ['corrected', 'twitch', 'text'],
  chatAnchor: ['bottom', 'top'],
} as const;

export type UsernameColorMode = (typeof SETTING_OPTIONS.usernameColor)[number];
export type ChatAnchor = (typeof SETTING_OPTIONS.chatAnchor)[number];

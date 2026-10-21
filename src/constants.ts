export const TWITCH_CHAT_IRC_WS_URL = 'ws://irc-ws.chat.twitch.tv:80';
export const TWITCH_HELIX_URL = 'https://api.twitch.tv/helix/';
export const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/';
export const TWITCH_WEBSOCKET_EVENTSUB_URL = 'wss://eventsub.wss.twitch.tv/ws';
export const TWITCH_INSIGHTS_URL = 'https://api.twitchinsights.net/v1/';
export const SEVEN_TV_WEBSOCKET_URL = 'wss://events.7tv.io/v3';
export const BETTER_TTV_WEBSOCKET_URL = 'wss://sockets.betterttv.net/ws';

export const SECOND_MS = 1000;
export const MINUTE_MS = 60000;
export const HOUR_MS = 3600000;
// Twitch asks apps to validate their token every hour.
export const TOKEN_VALIDATION_INTERVAL_MS = HOUR_MS;
export const MAX_TWITCH_MESSAGE_LENGTH = 500;
export const CHAT_MESSAGES_TO_RETAIN = 20;

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
  usernameFilters: 'username-filters',
  messageFilters: 'message-filters',
};

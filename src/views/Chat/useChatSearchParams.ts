import { chatSearchParamsMap, DEFAULT_CHAT_SETTINGS_VALUES, SETTING_OPTIONS } from '../../constants';
import { buildFilterRegex, decodeFiltersFromUrl } from '../../utils/filters';

// A number from the URL, or the default when it is missing or not a number.
const numberParam = (searchParams: URLSearchParams, name: string, defaultValue: number): number => {
  const raw = searchParams.get(name);
  const value = raw === null || raw === '' ? NaN : Number(raw);
  return Number.isFinite(value) ? value : defaultValue;
};

// A value from the URL that must be one of the allowed options, or the default.
const optionParam = <T extends string>(searchParams: URLSearchParams, name: string, options: readonly T[], defaultValue: T): T => {
  const raw = searchParams.get(name);
  return options.find((option) => option === raw) ?? defaultValue;
};

export const useChatSearchParams = () => {
  const searchParams = new URLSearchParams(window.location.search);
  const params = chatSearchParamsMap;
  const defaults = DEFAULT_CHAT_SETTINGS_VALUES;

  // Sizes in px for the parts of a chat entry. Chat.less reads them as CSS variables.
  const avatarSize = numberParam(searchParams, params.avatarSize, defaults.avatarSize);
  const badgeSize = numberParam(searchParams, params.badgeSize, defaults.badgeSize);
  const emoteSize = numberParam(searchParams, params.emoteSize, defaults.emoteSize);
  const lineHeight = numberParam(searchParams, params.lineHeight, defaults.lineHeight);

  // Where the username color comes from: 'corrected' (Twitch color adjusted for contrast), 'twitch' or 'text'.
  const usernameColor = optionParam(searchParams, params.usernameColor, SETTING_OPTIONS.usernameColor, 'corrected');

  // Background behind each message, its opacity (0 to 100) and its corner radius in px.
  const messageBackgroundColor = searchParams.get(params.messageBackgroundColor) || defaults.messageBackgroundColor;
  const messageBackgroundOpacity = numberParam(searchParams, params.messageBackgroundOpacity, defaults.messageBackgroundOpacity);
  const messageRadius = numberParam(searchParams, params.messageRadius, defaults.messageRadius);

  // Where new messages appear: 'bottom' (default) or 'top'.
  const chatAnchor = optionParam(searchParams, params.chatAnchor, SETTING_OPTIONS.chatAnchor, 'bottom');

  // Controls whether chat entries animate in. Defaults to true.
  const animatedEntry = searchParams.get(chatSearchParamsMap.animatedEntry) === 'false' ? false : DEFAULT_CHAT_SETTINGS_VALUES.animatedEntry;

  // Background color of the chat container. Defaults to 'transparent'.
  const backgroundColor = searchParams.get(chatSearchParamsMap.backgroundColor) || DEFAULT_CHAT_SETTINGS_VALUES.backgroundColor;

  // Height of the chat container with unit (e.g., '100vh'). Defaults to '100vh'.
  const height =
    searchParams.get(chatSearchParamsMap.height) || `${DEFAULT_CHAT_SETTINGS_VALUES.heightValue}${DEFAULT_CHAT_SETTINGS_VALUES.heightUnit}`;

  // Width of the chat container with unit (e.g., '500px'). Defaults to '500px'.
  const width = searchParams.get(chatSearchParamsMap.width) || `${DEFAULT_CHAT_SETTINGS_VALUES.widthValue}${DEFAULT_CHAT_SETTINGS_VALUES.widthUnit}`;

  // Controls whether chat entries animate out after a delay. Defaults to false.
  const animatedExit = searchParams.get(chatSearchParamsMap.animatedExit) === 'true' ? true : DEFAULT_CHAT_SETTINGS_VALUES.animatedExit;

  // Number of seconds before a chat message exits (when animatedExit is true). Defaults to 10.
  const secondsBeforeExit =
    searchParams.get(chatSearchParamsMap.secondsBeforeExit) !== null
      ? Number(searchParams.get(chatSearchParamsMap.secondsBeforeExit))
      : DEFAULT_CHAT_SETTINGS_VALUES.secondsBeforeExit;

  // Controls whether drop shadow is applied to chat message text. Defaults to false.
  const dropShadowEnabled =
    searchParams.get(chatSearchParamsMap.dropShadowEnabled) === 'true' ? true : DEFAULT_CHAT_SETTINGS_VALUES.dropShadowEnabled;

  // CSS drop shadow settings (e.g., '1px 1px 2px #000000ff'). Defaults to '1px 1px 2px #000000ff'.
  const dropShadowSettings = searchParams.get(chatSearchParamsMap.dropShadowSettings) || DEFAULT_CHAT_SETTINGS_VALUES.dropShadowSettings;

  // Text color for chat messages. Defaults to '#ffffff'.
  const foregroundColor = searchParams.get(chatSearchParamsMap.foregroundColor) || DEFAULT_CHAT_SETTINGS_VALUES.foregroundColor;

  // Controls whether user avatars are displayed. Defaults to true.
  const showAvatars = searchParams.get(chatSearchParamsMap.showAvatars) === 'false' ? false : DEFAULT_CHAT_SETTINGS_VALUES.showAvatars;

  // Controls whether chat message borders are displayed. Defaults to false.
  const showBorders = searchParams.get(chatSearchParamsMap.showBorders) === 'true' ? true : DEFAULT_CHAT_SETTINGS_VALUES.showBorders;

  // Controls whether a colon is shown after display names. Defaults to false.
  const showColonAfterDisplayName =
    searchParams.get(chatSearchParamsMap.showColonAfterDisplayName) === 'true' ? true : DEFAULT_CHAT_SETTINGS_VALUES.showColonAfterDisplayName;

  // Controls whether text stroke is applied to chat text. Defaults to false.
  const textStrokeEnabled =
    searchParams.get(chatSearchParamsMap.textStrokeEnabled) === 'true' ? true : DEFAULT_CHAT_SETTINGS_VALUES.textStrokeEnabled;

  // CSS text stroke settings (e.g., '1px black'). Defaults to '1px black'.
  const textStrokeSettings = searchParams.get(chatSearchParamsMap.textStrokeSettings) || DEFAULT_CHAT_SETTINGS_VALUES.textStrokeSettings;

  // Font size with unit (e.g., '1em'). Defaults to '1em'.
  const fontSize =
    searchParams.get(chatSearchParamsMap.fontSize) || `${DEFAULT_CHAT_SETTINGS_VALUES.fontSizeValue}${DEFAULT_CHAT_SETTINGS_VALUES.fontSizeUnit}`;

  // Font family for chat text. Defaults to 'Sans-Serif'.
  const fontFamily = searchParams.get(chatSearchParamsMap.fontFamily) || DEFAULT_CHAT_SETTINGS_VALUES.fontFamily;

  // Padding around chat messages with unit (e.g., '5px'). Defaults to '5px'.
  const chatMessagePadding =
    searchParams.get(chatSearchParamsMap.chatMessagePadding) ||
    `${DEFAULT_CHAT_SETTINGS_VALUES.chatMessagePaddingValue}${DEFAULT_CHAT_SETTINGS_VALUES.chatMessagePaddingUnit}`;

  // Controls whether to show name alias when display name differs from login. Defaults to true.
  const showNameAlias = searchParams.get(chatSearchParamsMap.showNameAlias) === 'false' ? false : DEFAULT_CHAT_SETTINGS_VALUES.showNameAlias;

  // Controls whether gifs are rendered in chat messages. Defaults to true.
  const showGifs = searchParams.get(chatSearchParamsMap.showGifs) === 'false' ? false : DEFAULT_CHAT_SETTINGS_VALUES.showGifs;

  // Username filter (base64url encoded JSON). Empty means no filtering.
  const filtersParam = searchParams.get(chatSearchParamsMap.usernameFilters) || DEFAULT_CHAT_SETTINGS_VALUES.usernameFilters;
  const _filterCfg = decodeFiltersFromUrl(filtersParam);
  const usernameFilterRegex = buildFilterRegex(_filterCfg);

  // Message filter (base64url encoded JSON). Empty means no filtering.
  const messageFiltersParam = searchParams.get(chatSearchParamsMap.messageFilters) || DEFAULT_CHAT_SETTINGS_VALUES.messageFilters;
  const _messageFilterCfg = decodeFiltersFromUrl(messageFiltersParam);
  const messageFilterRegex = buildFilterRegex(_messageFilterCfg);

  return {
    avatarSize,
    badgeSize,
    emoteSize,
    lineHeight,
    usernameColor,
    messageBackgroundColor,
    messageBackgroundOpacity,
    messageRadius,
    chatAnchor,
    animatedEntry,
    animatedExit,
    backgroundColor,
    chatMessagePadding,
    dropShadowEnabled,
    dropShadowSettings,
    fontFamily,
    fontSize,
    foregroundColor,
    height,
    secondsBeforeExit,
    showAvatars,
    showBorders,
    showColonAfterDisplayName,
    showNameAlias,
    showGifs,
    textStrokeEnabled,
    textStrokeSettings,
    width,
    usernameFilterRegex,
    messageFilterRegex,
  };
};

/** The settings that every chat entry needs, taken from the URL settings. */
export const chatEntryStyleProps = (settings: ReturnType<typeof useChatSearchParams>) => ({
  backgroundColor: settings.backgroundColor,
  showAvatars: settings.showAvatars,
  showBorders: settings.showBorders,
  dropShadowEnabled: settings.dropShadowEnabled,
  dropShadowSettings: settings.dropShadowSettings,
  showColonAfterDisplayName: settings.showColonAfterDisplayName,
  textStrokeEnabled: settings.textStrokeEnabled,
  textStrokeSettings: settings.textStrokeSettings,
  chatMessagePadding: settings.chatMessagePadding,
  showNameAlias: settings.showNameAlias,
  showGifs: settings.showGifs,
  usernameColor: settings.usernameColor,
});

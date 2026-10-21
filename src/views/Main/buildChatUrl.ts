import { chatSearchParamsMap, DEFAULT_CHAT_SETTINGS_VALUES } from '../../constants';

export const multiPartSettingsMapForSaving = {
  fontSizeValue: {
    compositeKeys: ['fontSizeValue', 'fontSizeUnit'] as const,
    param: 'font-size',
  },
  fontSizeUnit: {
    compositeKeys: ['fontSizeValue', 'fontSizeUnit'] as const,
    param: 'font-size',
  },
  widthValue: {
    compositeKeys: ['widthValue', 'widthUnit'] as const,
    param: 'width',
  },
  widthUnit: {
    compositeKeys: ['widthValue', 'widthUnit'] as const,
    param: 'width',
  },
  heightValue: {
    compositeKeys: ['heightValue', 'heightUnit'] as const,
    param: 'height',
  },
  heightUnit: {
    compositeKeys: ['heightValue', 'heightUnit'] as const,
    param: 'height',
  },
  chatMessagePaddingValue: {
    compositeKeys: ['chatMessagePaddingValue', 'chatMessagePaddingUnit'] as const,
    param: 'chat-message-padding',
  },
  chatMessagePaddingUnit: {
    compositeKeys: ['chatMessagePaddingValue', 'chatMessagePaddingUnit'] as const,
    param: 'chat-message-padding',
  },
} as const;

export type OverlayParameters = typeof DEFAULT_CHAT_SETTINGS_VALUES;

export function buildUpdatedChatUrl(chatUrl: string, overlayParameters: OverlayParameters): string {
  const url = new URL(chatUrl);
  Object.entries(overlayParameters).forEach(([key, value]) => {
    if (!(key in DEFAULT_CHAT_SETTINGS_VALUES)) {
      return;
    }
    const defaultValue = DEFAULT_CHAT_SETTINGS_VALUES[key as keyof OverlayParameters];
    const param = chatSearchParamsMap[key as keyof typeof chatSearchParamsMap];

    if (Object.keys(multiPartSettingsMapForSaving).includes(key)) {
      const multiPartKey = key as keyof typeof multiPartSettingsMapForSaving;
      const multiPartParam = multiPartSettingsMapForSaving[multiPartKey].param;
      const compositeKeys = multiPartSettingsMapForSaving[multiPartKey].compositeKeys;
      const compositeValue = `${overlayParameters[compositeKeys[0]]}${overlayParameters[compositeKeys[1]]}`;
      const compositeDefault = `${DEFAULT_CHAT_SETTINGS_VALUES[compositeKeys[0]]}${DEFAULT_CHAT_SETTINGS_VALUES[compositeKeys[1]]}`;
      if (compositeValue !== compositeDefault) {
        url.searchParams.set(multiPartParam, compositeValue);
      } else {
        url.searchParams.delete(multiPartParam);
      }
      return;
    }

    if (String(value) !== String(defaultValue)) {
      url.searchParams.set(param, String(value));
    } else {
      url.searchParams.delete(param);
    }
  });
  return url.toString();
}

/** Counts the parameters whose value differs between two overlay URLs, ignoring parameter order and encoding. */
export function countChangedParams(urlA: string, urlB: string): number {
  const a = new URL(urlA).searchParams;
  const b = new URL(urlB).searchParams;
  const keys = new Set([...a.keys(), ...b.keys()]);
  let changed = 0;
  keys.forEach((key) => {
    if (a.get(key) !== b.get(key)) {
      changed++;
    }
  });
  return changed;
}

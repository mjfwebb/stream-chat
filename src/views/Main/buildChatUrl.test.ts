import { describe, expect, it } from 'vitest';

import { DEFAULT_CHAT_SETTINGS_VALUES } from '../../constants';
import { buildUpdatedChatUrl } from './buildChatUrl';

const BASE_URL = 'https://example.com/chat?access_token=xxx';

describe('buildUpdatedChatUrl - font-size', () => {
  it('includes font-size when fontSizeValue is changed from default', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, fontSizeValue: 1.5 };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('font-size')).toBe('1.5em');
  });

  it('includes font-size when fontSizeUnit is changed from default', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, fontSizeUnit: 'px' };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('font-size')).toBe('1px');
  });

  it('includes font-size when both fontSizeValue and fontSizeUnit are changed', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, fontSizeValue: 1.5, fontSizeUnit: 'px' };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('font-size')).toBe('1.5px');
  });

  it('omits font-size when both fontSizeValue and fontSizeUnit are at defaults', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('font-size')).toBeNull();
  });

  it('removes font-size from URL when settings are reset to defaults', () => {
    const urlWithFontSize = `${BASE_URL}&font-size=1.5em`;
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES };
    const result = new URL(buildUpdatedChatUrl(urlWithFontSize, params));
    expect(result.searchParams.get('font-size')).toBeNull();
  });

  it('updates font-size in URL when value changes', () => {
    const urlWithFontSize = `${BASE_URL}&font-size=2em`;
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, fontSizeValue: 1.5 };
    const result = new URL(buildUpdatedChatUrl(urlWithFontSize, params));
    expect(result.searchParams.get('font-size')).toBe('1.5em');
  });
});

describe('buildUpdatedChatUrl - other multipart settings', () => {
  it('includes width when widthValue is changed from default', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, widthValue: 800 };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('width')).toBe('800px');
  });

  it('removes width from URL when settings are reset to defaults', () => {
    const urlWithWidth = `${BASE_URL}&width=800px`;
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES };
    const result = new URL(buildUpdatedChatUrl(urlWithWidth, params));
    expect(result.searchParams.get('width')).toBeNull();
  });
});

describe('buildUpdatedChatUrl - spurious keys from handleLoadUrl', () => {
  it('does not delete font-size when overlayParameters has a spurious fontSize key', () => {
    // handleLoadUrl can add fontSize: undefined to overlayParameters when the URL has no font-size param.
    // This guard ensures that spurious key does not delete the correctly-set font-size param.
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, fontSizeValue: 1.5, fontSize: undefined } as unknown as typeof DEFAULT_CHAT_SETTINGS_VALUES;
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('font-size')).toBe('1.5em');
  });

  it('does not delete width when overlayParameters has a spurious width key', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, widthValue: 800, width: undefined } as unknown as typeof DEFAULT_CHAT_SETTINGS_VALUES;
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('width')).toBe('800px');
  });
});

describe('buildUpdatedChatUrl - non-multipart settings', () => {
  it('includes background-color when changed from default', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, backgroundColor: '#000000' };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('background-color')).toBe('#000000');
  });

  it('omits background-color when at default', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('background-color')).toBeNull();
  });
});

describe('buildUpdatedChatUrl - emote services and message limit', () => {
  it('omits the emote switches and the limit at their defaults', () => {
    const result = new URL(buildUpdatedChatUrl(BASE_URL, { ...DEFAULT_CHAT_SETTINGS_VALUES }));
    expect(result.searchParams.get('7tv-emotes')).toBeNull();
    expect(result.searchParams.get('bttv-emotes')).toBeNull();
    expect(result.searchParams.get('ffz-emotes')).toBeNull();
    expect(result.searchParams.get('max-messages')).toBeNull();
  });

  it('writes a switched-off emote service', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, sevenTVEmotes: false };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('7tv-emotes')).toBe('false');
  });

  it('writes a changed message limit', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, maxMessages: 50 };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('max-messages')).toBe('50');
  });
});

describe('buildUpdatedChatUrl - appearance', () => {
  it('omits every appearance setting at its default', () => {
    const result = new URL(buildUpdatedChatUrl(BASE_URL, { ...DEFAULT_CHAT_SETTINGS_VALUES }));
    for (const param of [
      'avatar-size',
      'badge-size',
      'emote-size',
      'line-height',
      'username-color',
      'message-background-color',
      'message-background-opacity',
      'message-radius',
      'chat-anchor',
    ]) {
      expect(result.searchParams.get(param)).toBeNull();
    }
  });

  it('writes changed appearance settings', () => {
    const params = {
      ...DEFAULT_CHAT_SETTINGS_VALUES,
      avatarSize: 48,
      usernameColor: 'twitch' as const,
      messageBackgroundColor: '#000000',
      chatAnchor: 'top' as const,
    };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('avatar-size')).toBe('48');
    expect(result.searchParams.get('username-color')).toBe('twitch');
    expect(result.searchParams.get('message-background-color')).toBe('#000000');
    expect(result.searchParams.get('chat-anchor')).toBe('top');
  });
});

describe('buildUpdatedChatUrl - highlights', () => {
  it('omits every highlight setting at its default', () => {
    const result = new URL(buildUpdatedChatUrl(BASE_URL, { ...DEFAULT_CHAT_SETTINGS_VALUES }));
    for (const param of ['highlight-points', 'highlight-mentions', 'highlight-first-messages', 'highlight-color', 'highlight-rules']) {
      expect(result.searchParams.get(param)).toBeNull();
    }
  });

  it('writes changed highlight settings', () => {
    const params = {
      ...DEFAULT_CHAT_SETTINGS_VALUES,
      highlightPoints: false,
      highlightMentions: true,
      highlightColor: '#ff8800',
      highlightRules: 'abc',
    };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('highlight-points')).toBe('false');
    expect(result.searchParams.get('highlight-mentions')).toBe('true');
    expect(result.searchParams.get('highlight-color')).toBe('#ff8800');
    expect(result.searchParams.get('highlight-rules')).toBe('abc');
  });
});

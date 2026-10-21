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
    for (const param of [
      'highlight-points',
      'highlight-mentions',
      'highlight-first-messages',
      'highlight-mentions-color',
      'highlight-first-color',
      'highlight-points-color',
      'highlight-rules',
    ]) {
      expect(result.searchParams.get(param)).toBeNull();
    }
  });

  it('writes changed highlight settings', () => {
    const params = {
      ...DEFAULT_CHAT_SETTINGS_VALUES,
      highlightPoints: false,
      highlightMentions: true,
      highlightMentionsColor: '#ff8800',
      highlightFirstColor: '#00a3ff',
      highlightPointsColor: '#ff0066',
      highlightRules: 'abc',
    };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('highlight-points')).toBe('false');
    expect(result.searchParams.get('highlight-mentions')).toBe('true');
    expect(result.searchParams.get('highlight-mentions-color')).toBe('#ff8800');
    expect(result.searchParams.get('highlight-first-color')).toBe('#00a3ff');
    expect(result.searchParams.get('highlight-points-color')).toBe('#ff0066');
    expect(result.searchParams.get('highlight-rules')).toBe('abc');
    // The old single color is never written again
    expect(result.searchParams.get('highlight-color')).toBeNull();
  });
});

describe('buildUpdatedChatUrl - replies and roles', () => {
  it('omits both at their defaults', () => {
    const result = new URL(buildUpdatedChatUrl(BASE_URL, { ...DEFAULT_CHAT_SETTINGS_VALUES }));
    expect(result.searchParams.get('show-replies')).toBeNull();
    expect(result.searchParams.get('only-roles')).toBeNull();
  });

  it('writes a switched-on reply line and a chosen role list', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, showReplies: true, onlyRoles: 'vip,moderator' };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('show-replies')).toBe('true');
    expect(result.searchParams.get('only-roles')).toBe('vip,moderator');
  });
});

describe('buildUpdatedChatUrl - event banners', () => {
  it('omits show-notices when no banner is on', () => {
    const result = new URL(buildUpdatedChatUrl(BASE_URL, { ...DEFAULT_CHAT_SETTINGS_VALUES }));
    expect(result.searchParams.get('show-notices')).toBeNull();
  });

  it('writes the chosen banner kinds', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, showNotices: 'subs,raids' };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('show-notices')).toBe('subs,raids');
  });
});

describe('buildUpdatedChatUrl - banner style', () => {
  it('omits the banner colors and labels at their defaults', () => {
    const result = new URL(buildUpdatedChatUrl(BASE_URL, { ...DEFAULT_CHAT_SETTINGS_VALUES }));
    for (const param of ['notice-color-subs', 'notice-color-gifts', 'notice-color-raids', 'notice-labels']) {
      expect(result.searchParams.get(param)).toBeNull();
    }
  });

  it('writes changed banner colors and a hidden label', () => {
    const params = { ...DEFAULT_CHAT_SETTINGS_VALUES, noticeColorSubs: '#00a3ff', showNoticeLabels: false };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('notice-color-subs')).toBe('#00a3ff');
    expect(result.searchParams.get('notice-labels')).toBe('false');
  });
});

describe('buildUpdatedChatUrl - gradients and strength', () => {
  it('omits the strength at its default', () => {
    const result = new URL(buildUpdatedChatUrl(BASE_URL, { ...DEFAULT_CHAT_SETTINGS_VALUES }));
    expect(result.searchParams.get('highlight-strength')).toBeNull();
  });

  it('writes a gradient as two colors separated by a comma, and a changed strength', () => {
    const params = {
      ...DEFAULT_CHAT_SETTINGS_VALUES,
      highlightMentionsColor: '#ff8800,#0037b0',
      noticeColorRaids: '#ff0066,#ffcc00',
      highlightStrength: 60,
    };
    const result = new URL(buildUpdatedChatUrl(BASE_URL, params));
    expect(result.searchParams.get('highlight-mentions-color')).toBe('#ff8800,#0037b0');
    expect(result.searchParams.get('notice-color-raids')).toBe('#ff0066,#ffcc00');
    expect(result.searchParams.get('highlight-strength')).toBe('60');
  });
});

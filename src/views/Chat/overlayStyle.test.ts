import { describe, expect, it } from 'vitest';
import { overlayCssVariables, withOpacity } from './overlayStyle';

describe('withOpacity', () => {
  it('turns a hex color into rgba', () => {
    expect(withOpacity('#ff8000', 50)).toBe('rgba(255, 128, 0, 0.5)');
  });

  it('keeps transparent as it is', () => {
    expect(withOpacity('transparent', 50)).toBe('transparent');
  });

  it('keeps colors that are not 6-digit hex', () => {
    expect(withOpacity('red', 50)).toBe('red');
  });

  it('keeps the opacity between 0 and 100', () => {
    expect(withOpacity('#000000', 150)).toBe('rgba(0, 0, 0, 1)');
    expect(withOpacity('#000000', -5)).toBe('rgba(0, 0, 0, 0)');
  });
});

describe('overlayCssVariables', () => {
  it('maps every setting to a CSS variable', () => {
    const variables = overlayCssVariables({
      avatarSize: 48,
      badgeSize: 20,
      emoteSize: 40,
      lineHeight: 36,
      messageBackgroundColor: '#000000',
      messageBackgroundOpacity: 25,
      messageRadius: 8,
    });
    expect(variables).toEqual({
      '--avatar-size': '48px',
      '--badge-size': '20px',
      '--emote-size': '40px',
      '--line-height': '36px',
      '--message-background': 'rgba(0, 0, 0, 0.25)',
      '--message-radius': '8px',
    });
  });
});

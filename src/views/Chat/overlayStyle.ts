import type { CSSProperties } from 'react';

/** Turns a color and an opacity from 0 to 100 into a CSS color. Colors that are not 6-digit hex are returned as they are. */
export const withOpacity = (color: string, opacityPercent: number): string => {
  const match = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(color);
  if (!match) {
    return color;
  }
  const [r, g, b] = match.slice(1).map((channel) => parseInt(channel, 16));
  const alpha = Math.min(Math.max(opacityPercent, 0), 100) / 100;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

interface OverlayStyleSettings {
  avatarSize: number;
  badgeSize: number;
  emoteSize: number;
  lineHeight: number;
  messageBackgroundColor: string;
  messageBackgroundOpacity: number;
  messageRadius: number;
}

/** CSS variables that Chat.less reads. Set them on an element that wraps the chat entries. */
export const overlayCssVariables = (settings: OverlayStyleSettings): CSSProperties =>
  ({
    '--avatar-size': `${settings.avatarSize}px`,
    '--badge-size': `${settings.badgeSize}px`,
    '--emote-size': `${settings.emoteSize}px`,
    '--line-height': `${settings.lineHeight}px`,
    '--message-background': withOpacity(settings.messageBackgroundColor, settings.messageBackgroundOpacity),
    '--message-radius': `${settings.messageRadius}px`,
  }) as CSSProperties;

import Color from 'color';
import { withOpacity } from '../views/Chat/overlayStyle';

// A color setting is one 6-digit hex color, such as #ff8800, or two of them separated by a comma, such as #ff8800,#0037b0.
// Two colors make a gradient that blends from left to right.
const HEX = /^#[0-9a-f]{6}$/i;

export interface ColorValue {
  from: string;
  to?: string;
}

/** Reads a color setting. Returns null when it is not one color or two colors. */
export const parseColorValue = (value: string | null | undefined): ColorValue | null => {
  const parts = (value ?? '').split(',').map((part) => part.trim());
  if (parts.length === 1 && HEX.test(parts[0])) {
    return { from: parts[0] };
  }
  if (parts.length === 2 && HEX.test(parts[0]) && HEX.test(parts[1])) {
    return { from: parts[0], to: parts[1] };
  }
  return null;
};

export const isColorValue = (value: string | null | undefined): boolean => parseColorValue(value) !== null;

export const formatColorValue = ({ from, to }: ColorValue): string => (to ? `${from},${to}` : from);

/** A second color that goes with the first, for when someone adds a gradient. It turns the hue, so the two are easy to tell apart. */
export const suggestSecondColor = (from: string): string => Color(from).rotate(50).hex().toLowerCase();

/** The first color. Use it where only one color fits, such as the color of a word. */
export const firstColor = (value: string): string => parseColorValue(value)?.from ?? value;

/** The color of each side border. A gradient starts with the first color on the left and ends with the second on the right. */
export const sideColors = (value: string): { left: string; right: string } => {
  const parsed = parseColorValue(value);
  return { left: parsed?.from ?? value, right: parsed?.to ?? parsed?.from ?? value };
};

/** A CSS background for the layer behind a highlight. The strength runs from 0 to 100. */
export const colorValueBackground = (value: string, strengthPercent: number): string => {
  const parsed = parseColorValue(value);
  if (!parsed) {
    return value;
  }
  if (!parsed.to) {
    return withOpacity(parsed.from, strengthPercent);
  }
  return `linear-gradient(90deg, ${withOpacity(parsed.from, strengthPercent)}, ${withOpacity(parsed.to, strengthPercent)})`;
};

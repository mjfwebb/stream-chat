import { describe, expect, it } from 'vitest';
import { colorValueBackground, firstColor, formatColorValue, isColorValue, parseColorValue, sideColors, suggestSecondColor } from './colorValue';

describe('parseColorValue', () => {
  it('reads one color', () => {
    expect(parseColorValue('#ff8800')).toEqual({ from: '#ff8800' });
  });

  it('reads two colors as a gradient and ignores spaces', () => {
    expect(parseColorValue('#ff8800, #0037B0')).toEqual({ from: '#ff8800', to: '#0037B0' });
  });

  it('rejects anything else', () => {
    for (const value of ['', 'red', '#fff', '#ff8800,', '#ff8800,#fff', '#ff8800,#0037b0,#000000', 'transparent', 'rgb(0,0,0)']) {
      expect(parseColorValue(value)).toBeNull();
    }
    expect(parseColorValue(null)).toBeNull();
    expect(parseColorValue(undefined)).toBeNull();
  });
});

describe('isColorValue and formatColorValue', () => {
  it('agree with each other', () => {
    expect(isColorValue('#ff8800,#0037b0')).toBe(true);
    expect(isColorValue('nope')).toBe(false);
    expect(formatColorValue({ from: '#ff8800' })).toBe('#ff8800');
    expect(formatColorValue({ from: '#ff8800', to: '#0037b0' })).toBe('#ff8800,#0037b0');
  });
});

describe('firstColor and sideColors', () => {
  it('uses the first color of a gradient', () => {
    expect(firstColor('#ff8800,#0037b0')).toBe('#ff8800');
    expect(firstColor('#ff8800')).toBe('#ff8800');
  });

  it('puts the first color on the left and the second on the right', () => {
    expect(sideColors('#ff8800,#0037b0')).toEqual({ left: '#ff8800', right: '#0037b0' });
  });

  it('uses the same color on both sides for one color', () => {
    expect(sideColors('#ff8800')).toEqual({ left: '#ff8800', right: '#ff8800' });
  });
});

describe('suggestSecondColor', () => {
  it('returns a valid color that differs from the first', () => {
    const second = suggestSecondColor('#ff8800');
    expect(isColorValue(second)).toBe(true);
    expect(second).not.toBe('#ff8800');
  });

  it('works for black and white, where turning the hue changes nothing', () => {
    expect(isColorValue(suggestSecondColor('#000000'))).toBe(true);
    expect(isColorValue(suggestSecondColor('#ffffff'))).toBe(true);
  });
});

describe('colorValueBackground', () => {
  it('makes a plain tint from one color', () => {
    expect(colorValueBackground('#ff8800', 25)).toBe('rgba(255, 136, 0, 0.25)');
  });

  it('makes a left to right gradient from two colors, with the same strength on both', () => {
    expect(colorValueBackground('#ff8800,#0037b0', 40)).toBe('linear-gradient(90deg, rgba(255, 136, 0, 0.4), rgba(0, 55, 176, 0.4))');
  });

  it('is fully solid at 100', () => {
    expect(colorValueBackground('#ff8800', 100)).toBe('rgba(255, 136, 0, 1)');
  });
});

import React, { useEffect, useMemo, useRef, useState } from 'react';

import { styled } from 'styled-components';

import { ColorField } from '../TextShadowPicker/fields/ColorField';
import { TextShadowInput } from '../TextShadowPicker/inputs/TextShadowInput';

type StrokeWidthKeyword = 'thin' | 'medium' | 'thick';

const Wrapper = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 8px;
  background: #2a2a2a;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  color: #bec6cf;
  font-size: 14px;
  width: 100%;
  box-sizing: border-box;
`;

const Row = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const Segmented = styled.div`
  display: inline-flex;
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 6px;

  button {
    background: transparent;
    color: #c7cbd1;
    padding: 6px 10px;
    border: none;
    cursor: pointer;
  }

  button[aria-pressed='true'] {
    background: #3a3a3a;
  }
`;

const Label = styled.label`
  width: 110px;
  color: #c7cbd1;
`;

const Preview = styled.div`
  background: #1f1f1f;
  border: 1px solid #3a3a3a;
  border-radius: 6px;
  padding: 8px 10px;
  font-size: 22px;
`;

const lengthRegex = /^(?<num>\d*\.?\d+)(?<unit>px|em|rem)$/i;

const extractStroke = (value?: string): { width: string; color: string } => {
  if (!value) return { width: '1px', color: '#000000ff' };
  const parts = value.trim();

  // Try to find a width token (keyword or length)
  let width: string | null = null;
  let color: string | null = null;

  // Prefer matching keywords first
  const kwMatch = parts.match(/\b(thin|medium|thick)\b/i);
  if (kwMatch) {
    width = kwMatch[1].toLowerCase();
    color = parts.replace(kwMatch[0], '').trim();
  } else {
    const lenMatch = parts.match(/\b\d*\.?\d+(?:px|em|rem)\b/i);
    if (lenMatch) {
      width = lenMatch[0];
      color = parts.replace(lenMatch[0], '').trim();
    }
  }

  // If nothing left for color, default to black
  if (!color || color.length === 0) color = '#000000ff';
  if (!width) width = '1px';

  // Normalize color to hex when possible using canvas trick
  const normalizedColor = normalizeColorToHex(color) ?? color;

  return { width, color: normalizedColor };
};

const normalizeColorToHex = (input: string): string | null => {
  try {
    // Canvas returns standardized color strings for valid CSS colors
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    if (!ctx) return null;
    ctx.fillStyle = '#000';
    ctx.fillStyle = input;
    const standardized = ctx.fillStyle as string;
    // standardized may be like '#rrggbb' or 'rgba(r,g,b,a)'
    if (/^#([0-9a-f]{6})$/i.test(standardized)) {
      return standardized + 'ff';
    }
    const rgba = standardized.match(/rgba?\((?<r>\d+),\s*(?<g>\d+),\s*(?<b>\d+)(?:,\s*(?<a>\d*\.?\d+))?\)/i);
    if (rgba && rgba.groups) {
      const r = Number(rgba.groups.r);
      const g = Number(rgba.groups.g);
      const b = Number(rgba.groups.b);
      const a = rgba.groups.a != null ? Math.round(Number(rgba.groups.a) * 255) : 255;
      const hex = `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}${a
        .toString(16)
        .padStart(2, '0')}`;
      return hex;
    }
    return null;
  } catch {
    return null;
  }
};

const buildStroke = ({ width, color }: { width: string; color: string }) => `${width} ${color}`;

export interface TextStrokeEditorProps {
  value?: string; // e.g., "1px #000000ff" or "thin #ff00ff"
  onChange: (value: string) => void;
  className?: string;
}

export const TextStrokeEditor: React.FC<TextStrokeEditorProps> = ({ value, onChange, className }) => {
  const initial = useMemo(() => extractStroke(value), [value]);
  const [width, setWidth] = useState<string>(initial.width);
  const [color, setColor] = useState<string>(initial.color);
  const suppressNextEmitRef = useRef(false);

  // Keep local state in sync if parent value changes externally
  useEffect(() => {
    const next = extractStroke(value);
    const widthChanged = next.width !== width;
    const colorChanged = next.color !== color;
    if (widthChanged || colorChanged) {
      suppressNextEmitRef.current = true;
      if (widthChanged) {
        setWidth(next.width);
      }
      if (colorChanged) {
        setColor(next.color);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  useEffect(() => {
    // Skip emitting if this change originated from a prop sync
    if (suppressNextEmitRef.current) {
      suppressNextEmitRef.current = false;
      return;
    }
    const built = buildStroke({ width, color });
    if (built !== (value ?? '')) {
      onChange(built);
    }
  }, [width, color, onChange, value]);

  const currentMode: 'keyword' | 'custom' = /^(thin|medium|thick)$/i.test(width) ? 'keyword' : 'custom';
  const keyword: StrokeWidthKeyword | null = currentMode === 'keyword' ? (width.toLowerCase() as StrokeWidthKeyword) : null;

  const handleSegment = (w: StrokeWidthKeyword | 'custom') => {
    if (w === 'custom') {
      // if switching to custom from keyword, map common keyword to px defaults
      if (keyword === 'thin') {
        setWidth('1px');
      } else if (keyword === 'medium') {
        setWidth('2px');
      } else if (keyword === 'thick') {
        setWidth('3px');
      } else {
        setWidth('1px');
      }
      return;
    }
    setWidth(w);
  };

  const onCustomWidthChange = (val: string) => {
    // Accept only non-negative lengths with px|em|rem
    const m = val.match(lengthRegex);
    if (m) setWidth(m[0]);
    else setWidth(val); // allow typing, TextShadowInput will guard on blur
  };

  const previewStyle = {
    WebkitTextStroke: buildStroke({ width, color }),
    color: '#ffffff',
    WebkitTextFillColor: '#ffffff',
  } as React.CSSProperties;

  return (
    <Wrapper className={className}>
      <Row>
        <Label>Stroke width</Label>
        <Segmented role="group" aria-label="Stroke width preset">
          <button type="button" aria-pressed={keyword === 'thin'} onClick={() => handleSegment('thin')}>
            thin
          </button>
          <button type="button" aria-pressed={keyword === 'medium'} onClick={() => handleSegment('medium')}>
            medium
          </button>
          <button type="button" aria-pressed={keyword === 'thick'} onClick={() => handleSegment('thick')}>
            thick
          </button>
          <button type="button" aria-pressed={currentMode === 'custom'} onClick={() => handleSegment('custom')}>
            custom
          </button>
        </Segmented>
      </Row>

      {currentMode === 'custom' && (
        <Row>
          <Label>Custom width</Label>
          <TextShadowInput value={width} onChange={onCustomWidthChange} />
          <small style={{ color: '#8b949e' }}>(px, em, rem)</small>
        </Row>
      )}

      <Row>
        <ColorField value={color} onChange={setColor} />
      </Row>

      <Preview>
        <span style={previewStyle}>Sample text stroke preview</span>
      </Preview>
    </Wrapper>
  );
};

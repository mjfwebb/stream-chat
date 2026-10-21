import { useEffect, useState } from 'react';
import { Button } from '../Button/Button';

import './ColorPicker.less';

interface ColorPickerProps {
  id: string;
  onChange: (color: string) => void;
  value: string;
  placeholder: string;
  setToDefault: () => void;
  canSetToTransparent?: boolean;
}

const hexRegex = /^#[0-9a-f]{6}$/i;

export const ColorPicker = ({ id, onChange, value, placeholder, setToDefault, canSetToTransparent = false }: ColorPickerProps) => {
  const isTransparent = value === 'transparent';
  const [text, setText] = useState(value);

  // Follow changes that come from outside, such as loading a URL or resetting.
  useEffect(() => setText(value), [value]);

  const handleText = (next: string) => {
    setText(next);
    const trimmed = next.trim();
    if (hexRegex.test(trimmed) || (canSetToTransparent && trimmed === 'transparent')) {
      onChange(trimmed);
    }
  };

  return (
    <div className="color-picker">
      {isTransparent ? (
        <span className="color-picker-checker" aria-hidden="true" />
      ) : (
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Pick a color" />
      )}
      <input
        id={isTransparent ? id : undefined}
        type="text"
        className="color-picker-text"
        value={text}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => handleText(e.target.value)}
        onBlur={() => setText(value)}
        aria-label="Color value"
      />
      {canSetToTransparent && (
        <Button type="secondary" onClick={() => onChange(isTransparent ? '#1b1b2f' : 'transparent')}>
          {isTransparent ? 'Pick a color' : 'Transparent'}
        </Button>
      )}
      <Button type="ghost" onClick={setToDefault} aria-label="Reset color to default">
        Default
      </Button>
    </div>
  );
};

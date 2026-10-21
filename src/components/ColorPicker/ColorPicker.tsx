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
  // For a setting where an empty value means a built-in look, such as "Twitch style". The placeholder is the color that "Pick a color" starts with.
  emptyLabel?: string;
}

const hexRegex = /^#[0-9a-f]{6}$/i;

export const ColorPicker = ({ id, onChange, value, placeholder, setToDefault, canSetToTransparent = false, emptyLabel }: ColorPickerProps) => {
  const isTransparent = value === 'transparent';
  const isEmpty = emptyLabel !== undefined && value === '';
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
      {isEmpty ? (
        <span className="color-picker-twitch" aria-hidden="true" />
      ) : isTransparent ? (
        <span className="color-picker-checker" aria-hidden="true" />
      ) : (
        <input id={id} type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Pick a color" />
      )}
      <input
        id={isTransparent || isEmpty ? id : undefined}
        type="text"
        className="color-picker-text"
        value={isEmpty ? emptyLabel : text}
        readOnly={isEmpty}
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => handleText(e.target.value)}
        onBlur={() => setText(value)}
        aria-label="Color value"
      />
      {isEmpty && (
        <Button type="secondary" onClick={() => onChange(placeholder)}>
          Pick a color
        </Button>
      )}
      {canSetToTransparent && (
        <Button type="secondary" onClick={() => onChange(isTransparent ? '#1b1b2f' : 'transparent')}>
          {isTransparent ? 'Pick a color' : 'Transparent'}
        </Button>
      )}
      {!isEmpty && (
        <Button type="ghost" onClick={setToDefault} aria-label="Reset color to default">
          {emptyLabel ?? 'Default'}
        </Button>
      )}
    </div>
  );
};

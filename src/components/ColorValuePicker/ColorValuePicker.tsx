import { useEffect, useState } from 'react';
import { formatColorValue, parseColorValue, suggestSecondColor } from '../../utils/colorValue';
import { Button } from '../Button/Button';

import '../ColorPicker/ColorPicker.less';
import './ColorValuePicker.less';

const hexRegex = /^#[0-9a-f]{6}$/i;

// A color swatch and a box for the hex value. The box can hold a half typed value without changing the setting.
const HexField = ({ id, value, label, onChange }: { id?: string; value: string; label: string; onChange: (color: string) => void }) => {
  const [text, setText] = useState(value);

  // Follow changes that come from outside, such as loading a URL or resetting.
  useEffect(() => setText(value), [value]);

  return (
    <>
      <input type="color" value={value} onChange={(e) => onChange(e.target.value)} aria-label={`Pick ${label}`} />
      <input
        id={id}
        type="text"
        className="color-picker-text"
        value={text}
        spellCheck={false}
        autoComplete="off"
        onChange={(e) => {
          setText(e.target.value);
          if (hexRegex.test(e.target.value.trim())) {
            onChange(e.target.value.trim());
          }
        }}
        onBlur={() => setText(value)}
        aria-label={label}
      />
    </>
  );
};

interface ColorValuePickerProps {
  id: string;
  // One hex color, or two separated by a comma for a gradient. See utils/colorValue.ts.
  value: string;
  onChange: (value: string) => void;
  // The color that a new value starts with
  placeholder: string;
  setToDefault: () => void;
  // For a setting where an empty value means a built-in look, such as "Twitch style"
  emptyLabel?: string;
}

/** Picks one color or a gradient of two. */
export const ColorValuePicker = ({ id, value, onChange, placeholder, setToDefault, emptyLabel }: ColorValuePickerProps) => {
  if (emptyLabel !== undefined && value === '') {
    return (
      <div className="color-picker">
        <span className="color-picker-twitch" aria-hidden="true" />
        <input id={id} type="text" className="color-picker-text" value={emptyLabel} readOnly aria-label="Colour value" />
        <Button type="secondary" onClick={() => onChange(placeholder)}>
          Pick a colour
        </Button>
      </div>
    );
  }

  const parsed = parseColorValue(value);
  const from = parsed?.from ?? placeholder;
  const to = parsed?.to;

  return (
    <div className="color-value">
      <div className="color-picker">
        <HexField id={id} value={from} label={to ? 'First colour' : 'Colour'} onChange={(color) => onChange(formatColorValue({ from: color, to }))} />
        {to ? (
          <Button type="secondary" onClick={() => onChange(from)}>
            One colour
          </Button>
        ) : (
          <Button type="secondary" onClick={() => onChange(formatColorValue({ from, to: suggestSecondColor(from) }))}>
            Add gradient
          </Button>
        )}
        <Button type="ghost" onClick={setToDefault} aria-label="Reset colour to default">
          {emptyLabel ?? 'Default'}
        </Button>
      </div>
      {to && (
        <div className="color-picker color-value-second">
          <HexField value={to} label="Second colour" onChange={(color) => onChange(formatColorValue({ from, to: color }))} />
          <span className="color-value-preview" style={{ background: `linear-gradient(90deg, ${from}, ${to})` }} aria-hidden="true" />
        </div>
      )}
    </div>
  );
};

/** A small version for a row of settings: a swatch, and a button that adds or removes the second color. */
export const ColorValueCompact = ({ value, onChange, label }: { value: string; onChange: (value: string) => void; label: string }) => {
  const parsed = parseColorValue(value);
  const from = parsed?.from ?? '#a970ff';
  const to = parsed?.to;

  return (
    <span className="color-compact">
      <input type="color" value={from} onChange={(e) => onChange(formatColorValue({ from: e.target.value, to }))} aria-label={label} />
      {to ? (
        <>
          <input
            type="color"
            value={to}
            onChange={(e) => onChange(formatColorValue({ from, to: e.target.value }))}
            aria-label={`${label}, second colour`}
          />
          <button
            type="button"
            className="color-compact-button"
            onClick={() => onChange(from)}
            aria-label="Remove the second colour"
            title="Remove the second colour"
          >
            ×
          </button>
        </>
      ) : (
        <button
          type="button"
          className="color-compact-button"
          onClick={() => onChange(formatColorValue({ from, to: suggestSecondColor(from) }))}
          aria-label="Add a second colour for a gradient"
          title="Add a second colour for a gradient"
        >
          +
        </button>
      )}
    </span>
  );
};

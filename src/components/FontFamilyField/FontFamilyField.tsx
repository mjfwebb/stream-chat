import { useState } from 'react';

import './FontFamilyField.less';

const CUSTOM = '__custom__';

// Fonts that exist on most Windows and Mac computers. OBS can only use fonts installed on its own computer.
const FONT_GROUPS: { label: string; fonts: string[] }[] = [
  { label: 'Generic', fonts: ['sans-serif', 'serif', 'monospace'] },
  { label: 'Sans serif', fonts: ['Arial', 'Verdana', 'Tahoma', 'Trebuchet MS', 'Segoe UI'] },
  { label: 'Serif', fonts: ['Georgia', 'Times New Roman'] },
  { label: 'Monospace', fonts: ['Consolas', 'Courier New'] },
  { label: 'Display', fonts: ['Impact', 'Comic Sans MS'] },
];

const KNOWN_FONTS = new Set(FONT_GROUPS.flatMap((group) => group.fonts));

interface FontFamilyFieldProps {
  id: string;
  value: string;
  onChange: (value: string) => void;
}

export const FontFamilyField = ({ id, value, onChange }: FontFamilyFieldProps) => {
  const [customChosen, setCustomChosen] = useState(false);
  const isCustom = customChosen || !KNOWN_FONTS.has(value);

  return (
    <div className="font-family-field">
      <select
        id={id}
        value={isCustom ? CUSTOM : value}
        onChange={(e) => {
          if (e.target.value === CUSTOM) {
            setCustomChosen(true);
            return;
          }
          setCustomChosen(false);
          onChange(e.target.value);
        }}
      >
        {FONT_GROUPS.map((group) => (
          <optgroup key={group.label} label={group.label}>
            {group.fonts.map((font) => (
              <option key={font} value={font} style={{ fontFamily: font }}>
                {font}
              </option>
            ))}
          </optgroup>
        ))}
        <option value={CUSTOM}>Other font…</option>
      </select>
      {isCustom && (
        <input
          type="text"
          placeholder="Font name, for example Arial, sans-serif"
          aria-label="Font name"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete="off"
        />
      )}
    </div>
  );
};

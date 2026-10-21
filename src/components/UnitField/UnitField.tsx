import { Button } from '../Button/Button';

import './UnitField.less';

interface UnitFieldProps {
  id: string;
  label: string;
  value: number;
  unit: string;
  units: string[];
  min: number;
  max: number;
  onValueChange: (value: number) => void;
  onUnitChange: (unit: string) => void;
  onReset: () => void;
}

export const UnitField = ({ id, label, value, unit, units, min, max, onValueChange, onUnitChange, onReset }: UnitFieldProps) => {
  const handleNumber = (raw: string) => {
    const next = Number(raw);
    if (raw !== '' && !isNaN(next)) {
      onValueChange(next);
    }
  };

  return (
    <div className="unit-field">
      <input
        type="range"
        min={min}
        max={max}
        step="any"
        value={Math.min(Math.max(value, min), max)}
        onChange={(e) => handleNumber(e.target.value)}
        aria-label={`${label} slider`}
      />
      <input id={id} type="number" value={value} onChange={(e) => handleNumber(e.target.value)} autoComplete="off" aria-label={label} />
      <select value={unit} onChange={(e) => onUnitChange(e.target.value)} aria-label={`${label} unit`}>
        {units.map((u) => (
          <option key={u} value={u}>
            {u}
          </option>
        ))}
      </select>
      <Button type="ghost" onClick={onReset} aria-label={`Reset ${label} to default`}>
        Default
      </Button>
    </div>
  );
};

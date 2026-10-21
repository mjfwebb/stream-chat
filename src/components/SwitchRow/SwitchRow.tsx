import './SwitchRow.less';

interface SwitchRowProps {
  id: string;
  title: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}

export const SwitchRow = ({ id, title, description, checked, onChange }: SwitchRowProps) => {
  return (
    <label className="switch-row" htmlFor={id}>
      <span className="switch-row-text">
        <b>{title}</b>
        {description && <small>{description}</small>}
      </span>
      <input id={id} className="switch-row-switch" type="checkbox" role="switch" checked={checked} onChange={(e) => onChange(e.target.checked)} />
    </label>
  );
};

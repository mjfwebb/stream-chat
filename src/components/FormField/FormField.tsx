import './FormField.less';

interface FormFieldProps {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}

export const FormField = ({ id, label, hint, children }: FormFieldProps) => {
  return (
    <div className="form-field">
      <label htmlFor={id}>{label}</label>
      {children}
      {hint && <p className="hint">{hint}</p>}
    </div>
  );
};

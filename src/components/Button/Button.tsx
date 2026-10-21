import './Button.less';

interface ButtonProps {
  className?: string;
  onClick?: () => void;
  children: React.ReactNode;
  type: 'primary' | 'secondary' | 'ghost' | 'danger' | 'twitch';
  disabled?: boolean;
  'aria-label'?: string;
}

export const Button = (props: ButtonProps) => {
  return (
    <button
      type="button"
      className={['button', `button-${props.type}`, props.className].filter(Boolean).join(' ')}
      onClick={props.onClick}
      disabled={props.disabled}
      aria-label={props['aria-label']}
    >
      {props.children}
    </button>
  );
};

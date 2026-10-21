import { useEffect } from 'react';
import { Button } from '../Button/Button';

const backdropStyle: React.CSSProperties = {
  position: 'fixed',
  inset: 0,
  background: 'rgba(0,0,0,0.5)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  zIndex: 1000,
};

const modalStyle: React.CSSProperties = {
  background: 'var(--surface)',
  border: '1px solid var(--line)',
  color: 'var(--fg)',
  padding: '1rem',
  borderRadius: 8,
  minWidth: 320,
  maxWidth: '90vw',
  boxShadow: '0 10px 30px rgba(0,0,0,0.6)',
};

const actionsStyle: React.CSSProperties = {
  display: 'flex',
  gap: '0.5rem',
  justifyContent: 'flex-end',
  marginTop: '1rem',
};

export const ConfirmModal = ({
  open,
  title = 'Are you sure?',
  message = 'This action cannot be undone.',
  confirmText = 'Confirm',
  cancelText = 'Cancel',
  onConfirm,
  onCancel,
}: {
  open: boolean;
  title?: string;
  message?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}) => {
  useEffect(() => {
    if (!open) {
      return;
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onCancel();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onCancel]);

  if (!open) {
    return null;
  }

  return (
    <div style={backdropStyle} role="dialog" aria-modal="true" aria-labelledby="confirm-modal-title">
      <div style={modalStyle}>
        <h3 id="confirm-modal-title" style={{ marginTop: 0 }}>
          {title}
        </h3>
        <p>{message}</p>
        <div style={actionsStyle}>
          <Button type="secondary" onClick={onCancel} aria-label={cancelText}>
            {cancelText}
          </Button>
          <Button type="primary" onClick={onConfirm} aria-label={confirmText}>
            {confirmText}
          </Button>
        </div>
      </div>
    </div>
  );
};

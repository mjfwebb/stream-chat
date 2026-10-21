import { useEffect, useState } from 'react';
import { Button } from '../Button/Button';

export const CopyButton = ({ text, label = 'Copy URL', type = 'secondary' }: { text: string; label?: string; type?: 'primary' | 'secondary' }) => {
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (!success) {
      return;
    }
    const timer = setTimeout(() => setSuccess(false), 2000);
    return () => clearTimeout(timer);
  }, [success]);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(
      () => setSuccess(true),
      () => setSuccess(false),
    );
  };

  return (
    <Button onClick={handleCopy} type={type}>
      {success ? 'Copied' : label}
    </Button>
  );
};

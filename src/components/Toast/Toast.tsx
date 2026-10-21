import { AnimatePresence, motion } from 'motion/react';
import { useEffect, useRef, useState } from 'react';

import './Toast.less';

export const Toast = ({ message }: { message: string }) => {
  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<number | null>(null);

  // Show toast when message changes
  useEffect(() => {
    if (message) {
      setToastMessage(message);
      setToastVisible(true);

      // Clear any existing timer
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }

      // Hide toast after 3 seconds
      toastTimerRef.current = window.setTimeout(() => {
        setToastVisible(false);
      }, 3000);
    }
  }, [message]);

  // Cleanup toast timer on unmount
  useEffect(() => {
    return () => {
      if (toastTimerRef.current) {
        window.clearTimeout(toastTimerRef.current);
      }
    };
  }, []);

  return (
    <div className="toast-wrapper" aria-live="polite" aria-atomic="true">
      <AnimatePresence>
        {toastVisible && (
          <motion.div
            className="toast"
            role="status"
            initial={{ opacity: 0, y: 16, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 8, scale: 0.98 }}
            transition={{ type: 'spring', stiffness: 500, damping: 35, mass: 0.8 }}
          >
            <div className="toast-content">
              <span className="toast-title">Done</span>
              <span className="toast-message">{toastMessage}</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

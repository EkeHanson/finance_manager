// ...existing code...
import React, { useEffect } from 'react';
import './MessageModal.css';

const MessageModal = ({ message, type = 'success', onClose }) => {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose && onClose();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [message, onClose]);

  if (!message) return null;

  return (
    <div
      className={`message-modal ${type}`}
      role="status"
      aria-live="polite"
      onClick={onClose ? onClose : undefined}
    >
      <div className="message-content">{message}</div>
    </div>
  );
};

export default MessageModal;
// ...existing code...
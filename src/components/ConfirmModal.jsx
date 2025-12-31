// ConfirmModal.jsx
import React from 'react';

const ConfirmModal = ({ message, onConfirm, onCancel }) => {
  if (!message) return null;

  return (
    <div className="confirm-modal-backdrop">
      <div className="confirm-modal">
        <div className="confirm-message">{message}</div>
        <div className="confirm-actions">
          <button className="confirm-btn" onClick={onConfirm}>Yes</button>
          <button className="cancel-btn" onClick={onCancel}>No</button>
        </div>
      </div>
    </div>
  );
};

export default ConfirmModal;
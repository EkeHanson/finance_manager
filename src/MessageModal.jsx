// src/MessageModal.js
import React from 'react';

const MessageModal = ({ message, type, onClose }) => {
  if (!message) return null;
  return (
    <div style={{
      position: 'fixed', top: '20px', right: '20px', zIndex: 1000,
      background: type === 'success' ? '#28a745' : '#e63a27',
      color: '#fff', padding: '1rem', borderRadius: '5px'
    }}>
      {message}
      <button onClick={onClose} style={{ marginLeft: '1rem', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>X</button>
    </div>
  );
};

export default MessageModal;
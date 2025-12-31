import React, { useState } from 'react';
import './InvestmentTable.css';

const WithdrawalActionModal = ({ investor, withdrawal, onClose, onSubmit }) => {
  const [action, setAction] = useState('Approve');
  const [reason, setReason] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = () => {
    if (action === 'Reject' && !reason.trim()) {
      setError('Reason is required for rejection');
      return;
    }
    onSubmit(investor.id, withdrawal.withdrawalIndex, action, reason.trim() || null);
  };

  return (
    <div className="modal-overlay" style={{
      position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh',
      background: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center'
    }}>
      <div style={{
        background: '#fff', borderRadius: 10, padding: 24, minWidth: 350, maxWidth: '95vw', maxHeight: '95vh', overflowY: 'auto', position: 'relative'
      }}>
        <button
          style={{
            position: 'absolute', top: 10, right: 10, background: 'transparent', border: 'none', fontSize: 22, cursor: 'pointer'
          }}
          onClick={onClose}
          aria-label="Close"
        >
          <span className="material-icons">close</span>
        </button>
        <h2 style={{ fontFamily: 'Georgia, serif', color: '#003087', marginBottom: '1rem' }}>
          {action} Withdrawal
        </h2>
        <p style={{ fontFamily: 'Georgia, serif', marginBottom: '1rem' }}>
          {action} withdrawal of ₦{investor.withdrawals[withdrawal.withdrawalIndex].amount.toLocaleString()} for {investor.name}?
        </p>
        <div className="filter-group">
          <label htmlFor="action-select" style={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}>
            Action:
          </label>
          <select
            id="action-select"
            value={action}
            onChange={e => setAction(e.target.value)}
            style={{ marginBottom: '1rem' }}
          >
            <option value="Approve">Approve</option>
            <option value="Reject">Reject</option>
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="reason-input" style={{ fontFamily: 'Georgia, serif', fontWeight: 600 }}>
            Reason {action === 'Reject' ? '(Required)' : '(Optional)'}:
          </label>
          <textarea
            id="reason-input"
            value={reason}
            onChange={e => setReason(e.target.value)}
            placeholder="Enter reason..."
            style={{
              width: '100%',
              minHeight: '100px',
              padding: '0.5rem',
              fontFamily: 'Georgia, serif',
              border: '2px solid #8B0000',
              borderRadius: '5px',
              resize: 'vertical'
            }}
          />
        </div>
        {error && (
          <p style={{ color: '#e63a27', fontFamily: 'Georgia, serif', marginTop: '0.5rem' }}>
            {error}
          </p>
        )}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', justifyContent: 'flex-end' }}>
          <button
            className="modal-btn"
            onClick={onClose}
            style={{ background: '#888', color: '#fff' }}
          >
            Cancel
          </button>
          <button
            className="modal-btn"
            onClick={handleSubmit}
            style={{ background: action === 'Approve' ? '#388e3c' : '#e63a27', color: '#fff' }}
          >
            {action}
          </button>
        </div>
      </div>
    </div>
  );
};

export default WithdrawalActionModal;
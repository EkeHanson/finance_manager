import React, { useState } from 'react';
import './TransactionModal.css';

const TransactionModal = ({ investors, selectedInvestor, onClose, onSubmit }) => {
  const [transaction, setTransaction] = useState({
    investorId: selectedInvestor ? selectedInvestor.id : '',
    type: '',
    amount: '',
  });
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validate = () => {
    const newErrors = {};
    if (!transaction.investorId) newErrors.investorId = 'Investor is required';
    if (!transaction.type) newErrors.type = 'Transaction type is required';
    if (!transaction.amount || transaction.amount <= 0) newErrors.amount = 'Valid amount is required';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setTransaction(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setIsSubmitting(true);

    try {
      // Replace with actual API endpoint
      const response = await fetch('https://rodrimine.com/api/transactions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(transaction),
      });
      if (response.ok) {
        onSubmit(transaction);
      } else {
        alert('Error recording transaction. Please try again.');
      }
    } catch (error) {
      alert('Network error. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="modal-overlay" role="dialog" aria-labelledby="transaction-modal-title">
      <div className="modal-content">
        <h2 id="transaction-modal-title">Record Transaction</h2>
        <button className="modal-close" onClick={onClose} aria-label="Close modal">
          <span className="material-icons">close</span>
        </button>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="investorId">Investor *</label>
            <select
              id="investorId"
              name="investorId"
              value={transaction.investorId}
              onChange={handleChange}
              required
              disabled={!!selectedInvestor}
            >
              <option value="">Select Investor</option>
              {investors.map(investor => (
                <option key={investor.id} value={investor.id}>
                  {investor.name} (ID: {investor.id})
                </option>
              ))}
            </select>
            {errors.investorId && <span className="error">{errors.investorId}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="type">Transaction Type *</label>
            <select id="type" name="type" value={transaction.type} onChange={handleChange} required>
              <option value="">Select</option>
              <option value="Deposit">Deposit</option>
              <option value="Withdrawal">Withdrawal</option>
              <option value="ROI Payout">ROI Payout</option>
            </select>
            {errors.type && <span className="error">{errors.type}</span>}
          </div>
          <div className="form-group">
            <label htmlFor="amount">Amount (₦) *</label>
            <input
              type="number"
              id="amount"
              name="amount"
              value={transaction.amount}
              onChange={handleChange}
              required
              placeholder="Enter amount"
            />
            {errors.amount && <span className="error">{errors.amount}</span>}
          </div>
          <div className="modal-actions">
            <button type="submit" className="submit-btn" disabled={isSubmitting}>
              {isSubmitting ? 'Submitting...' : 'Record Transaction'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
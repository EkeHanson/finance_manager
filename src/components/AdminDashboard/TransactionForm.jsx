// src/components/AdminDashboard/TransactionForm.jsx
import React, { useState, useEffect } from 'react';
import useInvestmentApi from '../../services/InvestmentApiService';
import './TransactionForm.css';

const TransactionForm = ({ investors, onSuccess }) => {
  const { createPolicy, createWithdrawal, addTopUp, getPolicies } = useInvestmentApi();
  
  const [transactionType, setTransactionType] = useState('deposit');
  const [selectedInvestor, setSelectedInvestor] = useState('');
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [investorPolicies, setInvestorPolicies] = useState([]);
  const [amount, setAmount] = useState('');
  const [withdrawalType, setWithdrawalType] = useState('roi_only');
  const [roiFrequency, setRoiFrequency] = useState('monthly');
  const [disbursementBank, setDisbursementBank] = useState('');
  const [accountName, setAccountName] = useState('');
  const [accountNumber, setAccountNumber] = useState('');
  const [notes, setNotes] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  // Load policies when investor is selected
  useEffect(() => {
    const loadPolicies = async () => {
      if (!selectedInvestor) {
        setInvestorPolicies([]);
        setSelectedPolicy('');
        return;
      }

      try {
        const investor = investors.find(inv => inv.id === parseInt(selectedInvestor));
        if (investor?.policies) {
          setInvestorPolicies(investor.policies);
        } else {
          // Fetch from API
          const policiesData = await getPolicies({ user: selectedInvestor });
          setInvestorPolicies(policiesData.results || []);
        }
      } catch (error) {
        console.error('Error loading policies:', error);
        setInvestorPolicies([]);
      }
    };

    loadPolicies();
  }, [selectedInvestor, investors, getPolicies]);

  // Auto-fill bank details when investor is selected
  useEffect(() => {
    if (selectedInvestor) {
      const investor = investors.find(inv => inv.id === parseInt(selectedInvestor));
      if (investor) {
        setDisbursementBank(investor.disbursementBank || '');
        setAccountName(investor.accountName || investor.name || '');
        setAccountNumber(investor.accountNumber || '');
      }
    }
  }, [selectedInvestor, investors]);

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      let result;

      switch (transactionType) {
        case 'deposit':
          // Create new investment policy
          result = await createPolicy({
            user: parseInt(selectedInvestor),
            principal_amount: amount,
            roi_frequency: roiFrequency,
            min_withdrawal_months: 4,
            allow_partial_withdrawals: true,
            auto_rollover: false,
          });
          
          if (result.success) {
            showMessage('Investment policy created successfully!', 'success');
            resetForm();
            if (onSuccess) onSuccess();
          } else {
            showMessage(result.error || 'Failed to create investment', 'error');
          }
          break;

        case 'topup':
          // Add top-up to existing policy
          if (!selectedPolicy) {
            showMessage('Please select a policy', 'error');
            break;
          }
          
          result = await addTopUp(selectedPolicy, amount);
          
          if (result.success) {
            showMessage(`Top-up of ₦${parseFloat(amount).toLocaleString()} added successfully!`, 'success');
            resetForm();
            if (onSuccess) onSuccess();
          } else {
            showMessage(result.error || 'Failed to add top-up', 'error');
          }
          break;

        case 'withdrawal':
          // Create withdrawal request
          if (!selectedPolicy) {
            showMessage('Please select a policy', 'error');
            break;
          }

          result = await createWithdrawal({
            policy: parseInt(selectedPolicy),
            withdrawal_type: withdrawalType,
            amount_requested: amount,
            disbursement_bank: disbursementBank,
            account_name: accountName,
            account_number: accountNumber,
          });
          
          if (result.success) {
            showMessage('Withdrawal request submitted successfully!', 'success');
            resetForm();
            if (onSuccess) onSuccess();
          } else {
            const errorMsg = typeof result.error === 'string' 
              ? result.error 
              : result.error?.detail || JSON.stringify(result.error);
            showMessage(errorMsg, 'error');
          }
          break;

        default:
          showMessage('Unknown transaction type', 'error');
      }
    } catch (error) {
      console.error('Transaction error:', error);
      showMessage('An error occurred. Please try again.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedInvestor('');
    setSelectedPolicy('');
    setAmount('');
    setNotes('');
    setInvestorPolicies([]);
  };

  const getTransactionLabel = () => {
    switch (transactionType) {
      case 'deposit': return 'New Investment';
      case 'topup': return 'Add Top-up';
      case 'withdrawal': return 'Withdrawal Request';
      default: return 'Transaction';
    }
  };

  return (
    <div className="transaction-form-container">
      {message.text && (
        <div className={`transaction-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="transaction-form">
        <h3>{getTransactionLabel()}</h3>

        {/* Transaction Type */}
        <div className="form-group">
          <label htmlFor="transaction-type">Transaction Type:</label>
          <select
            id="transaction-type"
            value={transactionType}
            onChange={(e) => {
              setTransactionType(e.target.value);
              resetForm();
            }}
            required
          >
            <option value="deposit">New Investment (Deposit)</option>
            <option value="topup">Top-up Existing Policy</option>
            <option value="withdrawal">Withdrawal Request</option>
          </select>
        </div>

        {/* Select Investor */}
        <div className="form-group">
          <label htmlFor="investor">Select Investor:</label>
          <select
            id="investor"
            value={selectedInvestor}
            onChange={(e) => setSelectedInvestor(e.target.value)}
            required
          >
            <option value="">-- Select Investor --</option>
            {investors.map((investor) => (
              <option key={investor.id} value={investor.id}>
                {investor.name} ({investor.email})
              </option>
            ))}
          </select>
        </div>

        {/* Select Policy (for top-up and withdrawal) */}
        {(transactionType === 'topup' || transactionType === 'withdrawal') && (
          <div className="form-group">
            <label htmlFor="policy">Select Policy:</label>
            <select
              id="policy"
              value={selectedPolicy}
              onChange={(e) => setSelectedPolicy(e.target.value)}
              required
            >
              <option value="">-- Select Policy --</option>
              {investorPolicies.map((policy) => (
                <option key={policy.id} value={policy.id}>
                  {policy.policy_number} - Balance: ₦{parseFloat(policy.total_balance || 0).toLocaleString()}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* ROI Frequency (for deposit only) */}
        {transactionType === 'deposit' && (
          <div className="form-group">
            <label htmlFor="roi-frequency">ROI Frequency:</label>
            <select
              id="roi-frequency"
              value={roiFrequency}
              onChange={(e) => setRoiFrequency(e.target.value)}
              required
            >
              <option value="monthly">Monthly</option>
              <option value="on_demand">On Demand</option>
            </select>
          </div>
        )}

        {/* Withdrawal Type (for withdrawal only) */}
        {transactionType === 'withdrawal' && (
          <div className="form-group">
            <label htmlFor="withdrawal-type">Withdrawal Type:</label>
            <select
              id="withdrawal-type"
              value={withdrawalType}
              onChange={(e) => setWithdrawalType(e.target.value)}
              required
            >
              <option value="roi_only">ROI Only</option>
              <option value="principal_only">Principal Only (After 4 months)</option>
              <option value="composite">Composite (Principal + ROI)</option>
            </select>
            <small className="form-help">
              Principal withdrawals are only allowed after 4 months
            </small>
          </div>
        )}

        {/* Amount */}
        <div className="form-group">
          <label htmlFor="amount">
            Amount (₦):
          </label>
          <input
            id="amount"
            type="number"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="Enter amount"
            min="0"
            step="0.01"
            required
          />
        </div>

        {/* Bank Details (for withdrawal only) */}
        {transactionType === 'withdrawal' && (
          <>
            <div className="form-group">
              <label htmlFor="bank">Disbursement Bank:</label>
              <input
                id="bank"
                type="text"
                value={disbursementBank}
                onChange={(e) => setDisbursementBank(e.target.value)}
                placeholder="Bank name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="account-name">Account Name:</label>
              <input
                id="account-name"
                type="text"
                value={accountName}
                onChange={(e) => setAccountName(e.target.value)}
                placeholder="Account holder name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="account-number">Account Number:</label>
              <input
                id="account-number"
                type="text"
                value={accountNumber}
                onChange={(e) => setAccountNumber(e.target.value)}
                placeholder="Account number"
                required
              />
            </div>
          </>
        )}

        {/* Notes */}
        <div className="form-group">
          <label htmlFor="notes">Notes (Optional):</label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Add any additional notes..."
            rows="3"
          />
        </div>

        {/* Submit Button */}
        <div className="form-actions">
          <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Processing...' : `Submit ${getTransactionLabel()}`}
          </button>
          <button type="button" className="reset-btn" onClick={resetForm} disabled={loading}>
            Reset Form
          </button>
        </div>
      </form>
    </div>
  );
};

export default TransactionForm;
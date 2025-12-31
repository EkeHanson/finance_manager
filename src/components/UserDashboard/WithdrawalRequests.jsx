import React, { useState, useEffect } from 'react';
import './WithdrawalRequests.css';
import useInvestmentApi from '../../services/InvestmentApiService';
import { useAuth } from '../../contexts/AuthContext';

const WithdrawalRequests = () => {
  const { user } = useAuth();
  const {
    getPolicies,
    getWithdrawals,
    createWithdrawal,
    getLedger,
    generateStatement,
  } = useInvestmentApi();

  const [policies, setPolicies] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [ledgerEntries, setLedgerEntries] = useState([]);
  const [form, setForm] = useState({ policyNumber: '', type: 'roi_only', amount: '' });
  const [period, setPeriod] = useState('3_months');
  const [message, setMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        const policiesData = await getPolicies();
        if (policiesData && policiesData.results) {
          setPolicies(policiesData.results);
        }

        const withdrawalsData = await getWithdrawals();
        if (withdrawalsData && withdrawalsData.results) {
          setWithdrawals(withdrawalsData.results);
        }

        const ledgerData = await getLedger();
        if (ledgerData && ledgerData.results) {
          setLedgerEntries(ledgerData.results);
        }

      } catch (err) {
        console.error('Error fetching withdrawal data:', err);
        setError('Failed to load withdrawal data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getPolicies, getWithdrawals, getLedger]);

  // Set tenant colors as CSS variables
  useEffect(() => {
    if (user?.tenant_primary_color) {
      document.documentElement.style.setProperty('--tenant-primary', user.tenant_primary_color);
    }
    if (user?.tenant_secondary_color) {
      document.documentElement.style.setProperty('--tenant-secondary', user.tenant_secondary_color);
    }
  }, [user]);

  const isPrincipalLocked = (policy) => {
    if (!policy || !policy.start_date) return false;
    const today = new Date();
    const policyDate = new Date(policy.start_date);
    const lockInEnd = new Date(policyDate);
    lockInEnd.setMonth(lockInEnd.getMonth() + (policy.min_withdrawal_months || 4));
    return today < lockInEnd;
  };

  const handleWithdrawalSubmit = async (e) => {
    e.preventDefault();
    const { policyNumber, type, amount } = form;
    const numericAmount = parseFloat(amount);

    if (!policyNumber || isNaN(numericAmount) || numericAmount <= 0) {
      setMessage('Please select a policy and enter a valid amount');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const policy = policies.find(p => p.id === parseInt(policyNumber));
    if (!policy) {
      setMessage('Invalid policy selected');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (type === 'principal_only' && isPrincipalLocked(policy)) {
      setMessage(`Principal is locked for ${policy.min_withdrawal_months || 4} months from policy start date`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const availableBalance =
      type === 'roi_only' ? (policy.roi_balance || 0) :
      type === 'principal_only' ? (policy.principal_amount || 0) :
      ((policy.roi_balance || 0) + (policy.principal_amount || 0));

    if (numericAmount > availableBalance) {
      setMessage(`Amount exceeds available balance of ₦${availableBalance.toLocaleString()}`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const withdrawalData = {
        policy: policy.id,
        withdrawal_type: type,
        amount_requested: numericAmount.toString(),
        disbursement_bank: user?.bank_name || '',
        account_name: user?.account_name || '',
        account_number: user?.account_number || '',
      };

      const result = await createWithdrawal(withdrawalData);

      if (result.success) {
        setMessage('Withdrawal request submitted successfully');
        setForm({ policyNumber: '', type: 'roi_only', amount: '' });
        const withdrawalsData = await getWithdrawals();
        if (withdrawalsData && withdrawalsData.results) {
          setWithdrawals(withdrawalsData.results);
        }
      } else {
        setMessage(result.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setMessage('Failed to submit withdrawal request. Please try again.');
    }

    setTimeout(() => setMessage(''), 5000);
  };

  const handleDownload = async () => {
    try {
      const statementData = {
        policy_id: 1,
        duration: period,
      };

      const result = await generateStatement(statementData);
      if (result.success) {
        setMessage('Statement generated successfully');
      } else {
        setMessage(result.error || 'Failed to generate statement');
      }
    } catch (error) {
      console.error('Error generating statement:', error);
      setMessage('Failed to generate statement. Please try again.');
    }
    setTimeout(() => setMessage(''), 3000);
  };

  const handlePreview = () => {
    setShowPreview(true);
  };

  const closePreview = () => {
    setShowPreview(false);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading withdrawal data...
      </div>
    );
  }

  if (error) {
    return (
      <div className="error">
        <p>{error}</p>
        <button onClick={() => window.location.reload()}>Retry</button>
      </div>
    );
  }

  return (
    <section className="withdrawal-requests light">
      <div className="header-section">
        <div className="user-greeting">
          <h3>👋 Welcome back, {user?.first_name}!</h3>
          <p>Manage your withdrawal requests and view account statements</p>
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="content-wrapper">
        {/* Request Withdrawal Section */}
        <div className="withdrawal-form-section">
          <div className="section-header">
            <h3>💸 Request Withdrawal</h3>
            <span className="section-subtitle">Submit a new withdrawal request</span>
          </div>

          <form onSubmit={handleWithdrawalSubmit} className="withdrawal-form">
            <div className="form-row">
              <div className="form-group">
                <label>📋 Select Policy</label>
                <select
                  value={form.policyNumber}
                  onChange={e => setForm({ ...form, policyNumber: e.target.value })}
                  required
                >
                  <option value="">Choose a policy</option>
                  {policies.map(policy => (
                    <option key={policy.id} value={policy.id}>
                      {policy.policy_number} {isPrincipalLocked(policy) && '🔒 (Principal Locked)'}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>💰 Withdrawal Type</label>
                <select
                  value={form.type}
                  onChange={e => setForm({ ...form, type: e.target.value })}
                >
                  <option value="roi_only">ROI Only</option>
                  <option value="principal_only">Principal Only</option>
                  <option value="composite">Both (ROI + Principal)</option>
                </select>
              </div>

              <div className="form-group">
                <label>💵 Amount (₦)</label>
                <input
                  type="number"
                  value={form.amount}
                  onChange={e => setForm({ ...form, amount: e.target.value })}
                  placeholder="Enter amount"
                  required
                  min="0"
                  step="0.01"
                />
              </div>
            </div>

            <div className="form-actions">
              <button type="submit" className="submit-button">
                <span className="button-icon">✓</span>
                Submit Request
              </button>
            </div>
          </form>
        </div>

        {/* Withdrawal History Section */}
        <div className="history-section">
          <div className="section-header">
            <h3>📜 Withdrawal History</h3>
            <span className="section-subtitle">Track your withdrawal requests</span>
          </div>

          {withdrawals.length > 0 ? (
            <div className="table-wrapper">
              <table className="withdrawal-table">
                <thead>
                  <tr>
                    <th>Request ID</th>
                    <th>Policy Number</th>
                    <th>Type</th>
                    <th>Amount (₦)</th>
                    <th>Status</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {withdrawals.map((req, idx) => (
                    <tr key={idx}>
                      <td className="request-id">#{req.id}</td>
                      <td className="policy-number">{req.policy_number}</td>
                      <td className="withdrawal-type">{req.withdrawal_type_display || req.withdrawal_type}</td>
                      <td className="amount">₦{Number(req.amount_requested || 0).toLocaleString()}</td>
                      <td>
                        <span className={`status-badge ${req.status?.toLowerCase()}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="date">{req.request_date ? new Date(req.request_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📋</span>
              <p>No withdrawal requests found</p>
              <small>Submit your first withdrawal request above</small>
            </div>
          )}
        </div>

        {/* Ledger Statement Section */}
        <div className="ledger-section">
          <div className="section-header">
            <h3>📊 Ledger Statement</h3>
            <span className="section-subtitle">View and download your account statements</span>
          </div>

          <div className="ledger-controls">
            <div className="period-selector">
              <label>📅 Select Period</label>
              <select
                value={period}
                onChange={e => setPeriod(e.target.value)}
                className="period-select"
              >
                <option value="1_month">1 Month</option>
                <option value="3_months">3 Months</option>
                <option value="6_months">6 Months</option>
                <option value="1_year">1 Year</option>
              </select>
            </div>
            <div className="action-buttons">
              <button className="preview-button" onClick={handlePreview}>
                <span className="button-icon">👁️</span>
                Preview
              </button>
              <button className="download-button" onClick={handleDownload}>
                <span className="button-icon">📥</span>
                Generate Statement
              </button>
            </div>
          </div>

          {ledgerEntries.length > 0 ? (
            <div className="table-wrapper">
              <table className="ledger-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Policy</th>
                    <th>Description</th>
                    <th>In (₦)</th>
                    <th>Out (₦)</th>
                    <th>Principal (₦)</th>
                    <th>ROI (₦)</th>
                    <th>Total (₦)</th>
                  </tr>
                </thead>
                <tbody>
                  {ledgerEntries.slice(0, 20).map((entry, idx) => (
                    <tr key={idx}>
                      <td className="date">{entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : 'N/A'}</td>
                      <td className="policy-number">{entry.policy_number}</td>
                      <td className="description">{entry.description}</td>
                      <td className="amount inflow">₦{Number(entry.inflow || 0).toLocaleString()}</td>
                      <td className="amount outflow">₦{Number(entry.outflow || 0).toLocaleString()}</td>
                      <td className="amount">₦{Number(entry.principal_balance || 0).toLocaleString()}</td>
                      <td className="amount">₦{Number(entry.roi_balance || 0).toLocaleString()}</td>
                      <td className="amount total">₦{Number(entry.total_balance || 0).toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>No ledger entries found</p>
              <small>Your transaction history will appear here</small>
            </div>
          )}
        </div>
      </div>

      {/* Preview Modal */}
      {showPreview && (
        <div className="modal-overlay" onClick={closePreview}>
          <div className="preview-modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h3>📊 Ledger Preview</h3>
              <button className="close-button" onClick={closePreview}>×</button>
            </div>
            <div className="modal-content">
              {ledgerEntries.length > 0 ? (
                <div className="table-wrapper">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Date</th>
                        <th>Policy</th>
                        <th>Description</th>
                        <th>In (₦)</th>
                        <th>Out (₦)</th>
                        <th>Principal (₦)</th>
                        <th>ROI (₦)</th>
                        <th>Total (₦)</th>
                      </tr>
                    </thead>
                    <tbody>
                      {ledgerEntries.slice(0, 10).map((entry, idx) => (
                        <tr key={idx}>
                          <td>{entry.entry_date ? new Date(entry.entry_date).toLocaleDateString() : 'N/A'}</td>
                          <td>{entry.policy_number}</td>
                          <td>{entry.description}</td>
                          <td>₦{Number(entry.inflow || 0).toLocaleString()}</td>
                          <td>₦{Number(entry.outflow || 0).toLocaleString()}</td>
                          <td>₦{Number(entry.principal_balance || 0).toLocaleString()}</td>
                          <td>₦{Number(entry.roi_balance || 0).toLocaleString()}</td>
                          <td>₦{Number(entry.total_balance || 0).toLocaleString()}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="no-data">No ledger entries to preview</p>
              )}
              <div className="modal-actions">
                <button className="download-button" onClick={handleDownload}>
                  <span className="button-icon">📥</span>
                  Generate Statement
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </section>
  );
};

export default WithdrawalRequests;
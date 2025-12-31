import React, { useState, useEffect } from 'react';
import './ROIManagement.css';
import useInvestmentApi from '../../services/InvestmentApiService';
import { useAuth } from '../../contexts/AuthContext';

const ROIManagement = () => {
  const { user } = useAuth();
  const { getPolicies, changeRoiFrequency, createWithdrawal } = useInvestmentApi();

  const [policies, setPolicies] = useState([]);
  const [withdrawalAmount, setWithdrawalAmount] = useState({});
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        setLoading(true);
        setError(null);

        const policiesData = await getPolicies();
        if (policiesData && policiesData.results) {
          setPolicies(policiesData.results);
        }
      } catch (err) {
        console.error('Error fetching policies:', err);
        setError('Failed to load policies. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchPolicies();
  }, [getPolicies]);

  // Set tenant colors as CSS variables
  useEffect(() => {
    if (user?.tenant_primary_color) {
      document.documentElement.style.setProperty('--tenant-primary', user.tenant_primary_color);
    }
    if (user?.tenant_secondary_color) {
      document.documentElement.style.setProperty('--tenant-secondary', user.tenant_secondary_color);
    }
  }, [user]);

  const handleToggleFrequency = async (policyId) => {
    const policy = policies.find(p => p.id === policyId);
    if (!policy) {
      setMessage('Policy not found');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const newFrequency = policy.roi_frequency === 'monthly' ? 'on_demand' : 'monthly';

    try {
      const result = await changeRoiFrequency(policyId, newFrequency);

      if (result.success) {
        setMessage(`ROI frequency updated to ${newFrequency === 'monthly' ? 'Monthly' : 'On Demand'}`);
        setPolicies(prev =>
          prev.map(p =>
            p.id === policyId
              ? { ...p, roi_frequency: newFrequency }
              : p
          )
        );
      } else {
        setMessage(result.error || 'Failed to update ROI frequency');
      }
    } catch (error) {
      console.error('Error updating ROI frequency:', error);
      setMessage('Failed to update ROI frequency. Please try again.');
    }

    setTimeout(() => setMessage(''), 3000);
  };

  const handleWithdrawalRequest = async (policyId, amount) => {
    const numericAmount = parseFloat(amount);
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setMessage('Please enter a valid withdrawal amount');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    const policy = policies.find(p => p.id === policyId);
    if (!policy || numericAmount > (policy.roi_balance || 0)) {
      setMessage(`Withdrawal amount exceeds ROI balance of ₦${(policy?.roi_balance || 0).toLocaleString()}`);
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      const withdrawalData = {
        policy: policyId,
        withdrawal_type: 'roi_only',
        amount_requested: numericAmount.toString(),
        disbursement_bank: user?.bank_name || '',
        account_name: user?.account_name || '',
        account_number: user?.account_number || '',
      };

      const result = await createWithdrawal(withdrawalData);

      if (result.success) {
        setMessage(`Withdrawal request of ₦${numericAmount.toLocaleString()} submitted successfully`);
        setWithdrawalAmount(prev => ({ ...prev, [policyId]: '' }));
      } else {
        setMessage(result.error || 'Failed to submit withdrawal request');
      }
    } catch (error) {
      console.error('Error submitting withdrawal:', error);
      setMessage('Failed to submit withdrawal request. Please try again.');
    }

    setTimeout(() => setMessage(''), 5000);
  };

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading ROI data...
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
    <section className="roi-management light">
      <div className="header-section">
        <div className="user-greeting">
          <h3>👋 Welcome back, {user?.first_name}!</h3>
          <p>Manage your ROI frequency and withdrawal requests</p>
        </div>
      </div>

      {message && <div className="message">{message}</div>}

      <div className="content-wrapper">
        {/* ROI Management Section */}
        <div className="roi-section">
          <div className="section-header">
            <h3>💰 ROI Management</h3>
            <span className="section-subtitle">Control your return on investment preferences</span>
          </div>

          {policies.length > 0 ? (
            <div className="policies-grid">
              {policies.map((policy, idx) => (
                <div key={idx} className="policy-card">
                  <div className="policy-card-header">
                    <div className="policy-number">
                      <span className="policy-icon">📋</span>
                      <span>{policy.policy_number}</span>
                    </div>
                    <span className={`frequency-badge ${policy.roi_frequency}`}>
                      {policy.roi_frequency === 'monthly' ? '📅 Monthly' : '🔔 On Demand'}
                    </span>
                  </div>

                  <div className="policy-card-body">
                    <div className="balance-info">
                      <span className="balance-label">ROI Balance</span>
                      <span className="balance-value">₦{Number(policy.roi_balance || 0).toLocaleString()}</span>
                    </div>

                    <div className="card-actions">
                      <button
                        className="toggle-button"
                        onClick={() => handleToggleFrequency(policy.id)}
                      >
                        <span className="button-icon">🔄</span>
                        Switch to {policy.roi_frequency === 'monthly' ? 'On Demand' : 'Monthly'}
                      </button>
                    </div>

                    <div className="withdrawal-section">
                      <label className="withdrawal-label">Request Withdrawal</label>
                      <div className="withdrawal-input-group">
                        <input
                          type="number"
                          placeholder="Enter amount"
                          value={withdrawalAmount[policy.id] || ''}
                          onChange={e =>
                            setWithdrawalAmount(prev => ({
                              ...prev,
                              [policy.id]: e.target.value,
                            }))
                          }
                          className="withdrawal-input"
                          min="0"
                          step="0.01"
                        />
                        <button
                          className="withdraw-button"
                          onClick={() =>
                            handleWithdrawalRequest(policy.id, withdrawalAmount[policy.id])
                          }
                        >
                          <span className="button-icon">💸</span>
                          Withdraw
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>No investment policies found</p>
              <small>Start your investment journey today</small>
            </div>
          )}
        </div>

        {/* Quick Stats Section */}
        {policies.length > 0 && (
          <div className="stats-section">
            <div className="section-header">
              <h3>📈 Quick Statistics</h3>
              <span className="section-subtitle">Overview of your ROI performance</span>
            </div>

            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📋</div>
                <div className="stat-content">
                  <span className="stat-label">Active Policies</span>
                  <span className="stat-value">{policies.length}</span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">💰</div>
                <div className="stat-content">
                  <span className="stat-label">Total ROI Balance</span>
                  <span className="stat-value">
                    ₦{policies.reduce((sum, p) => sum + (p.roi_balance || 0), 0).toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">📅</div>
                <div className="stat-content">
                  <span className="stat-label">Monthly Policies</span>
                  <span className="stat-value">
                    {policies.filter(p => p.roi_frequency === 'monthly').length}
                  </span>
                </div>
              </div>

              <div className="stat-card">
                <div className="stat-icon">🔔</div>
                <div className="stat-content">
                  <span className="stat-label">On-Demand Policies</span>
                  <span className="stat-value">
                    {policies.filter(p => p.roi_frequency === 'on_demand').length}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default ROIManagement;
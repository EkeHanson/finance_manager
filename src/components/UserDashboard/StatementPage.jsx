import React, { useState, useEffect } from 'react';
import './StatementPage.css';
import useInvestmentApi from '../../services/InvestmentApiService';
import { useAuth } from '../../contexts/AuthContext';

const StatementPage = () => {
  const { user } = useAuth();
  const { getPolicies, generateStatement, getLedger } = useInvestmentApi();

  const [policies, setPolicies] = useState([]);
  const [selectedPolicy, setSelectedPolicy] = useState('');
  const [duration, setDuration] = useState('3_months');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');
  const [statement, setStatement] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const fetchPolicies = async () => {
      try {
        const response = await getPolicies();
        if (response.results) {
          setPolicies(response.results);
        }
      } catch (err) {
        console.error('Error fetching policies:', err);
        setError('Failed to load policies');
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

  const handleGenerateStatement = async (e) => {
    e.preventDefault();

    if (!selectedPolicy) {
      setMessage('Please select a policy');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    if (duration === 'custom' && (!customStartDate || !customEndDate)) {
      setMessage('Please select both start and end dates for custom range');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const statementData = {
        policy_id: selectedPolicy,
        duration: duration,
      };

      if (duration === 'custom') {
        statementData.start_date = customStartDate;
        statementData.end_date = customEndDate;
      }

      const result = await generateStatement(statementData);

      if (result.success) {
        setStatement(result.data);
        setMessage('Statement generated successfully');
      } else {
        setError(result.error || 'Failed to generate statement');
      }
    } catch (err) {
      console.error('Error generating statement:', err);
      setError('Failed to generate statement');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 3000);
    }
  };

  const handleDownload = () => {
    if (!statement) return;

    const statementText = `
INVESTMENT STATEMENT
===================

Policy: ${statement.policy_details.policy_number}
Investor: ${statement.policy_details.investor_name}
Period: ${statement.statement_period}

Summary:
- Total Inflow: ₦${statement.summary.total_inflow}
- Total Outflow: ₦${statement.summary.total_outflow}
- Net Flow: ₦${statement.summary.net_flow}
- ROI Accrued: ₦${statement.summary.roi_accrued}
- Withdrawals: ₦${statement.summary.withdrawals}

Transactions:
${statement.entries.map(entry => `
Date: ${entry.entry_date}
Description: ${entry.description}
Type: ${entry.entry_type_display}
Inflow: ₦${entry.inflow}
Outflow: ₦${entry.outflow}
Principal Balance: ₦${entry.principal_balance}
ROI Balance: ₦${entry.roi_balance}
Total Balance: ₦${entry.total_balance}
`).join('\n')}

Generated on: ${new Date().toLocaleString()}
    `;

    const blob = new Blob([statementText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `statement_${statement.policy_details.policy_number}_${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    setMessage('Statement downloaded successfully');
    setTimeout(() => setMessage(''), 3000);
  };

  return (
    <section className="statement-page light">
      <div className="header-section">
        <div className="user-greeting">
          <h3>👋 Welcome back, {user?.first_name}!</h3>
          <p>Generate and download your investment statements</p>
        </div>
      </div>

      {message && <div className="message">{message}</div>}
      {error && <div className="error-message">{error}</div>}

      <div className="content-wrapper">
        {/* Statement Generation Form */}
        <div className="form-section">
          <div className="section-header">
            <h3>📄 Generate Statement</h3>
            <span className="section-subtitle">Create a detailed statement for your investment policy</span>
          </div>

          <form onSubmit={handleGenerateStatement} className="statement-form">
            <div className="form-row">
              <div className="form-group">
                <label>📋 Select Policy</label>
                <select
                  value={selectedPolicy}
                  onChange={(e) => setSelectedPolicy(e.target.value)}
                  required
                >
                  <option value="">Choose a policy</option>
                  {policies.map(policy => (
                    <option key={policy.id} value={policy.id}>
                      {policy.policy_number} - ₦{Number(policy.principal_amount).toLocaleString()}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-group">
                <label>📅 Duration</label>
                <select
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                >
                  <option value="1_month">1 Month</option>
                  <option value="3_months">3 Months</option>
                  <option value="6_months">6 Months</option>
                  <option value="1_year">1 Year</option>
                  <option value="custom">Custom Range</option>
                </select>
              </div>
            </div>

            {duration === 'custom' && (
              <div className="form-row">
                <div className="form-group">
                  <label>🗓️ Start Date</label>
                  <input
                    type="date"
                    value={customStartDate}
                    onChange={(e) => setCustomStartDate(e.target.value)}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>🗓️ End Date</label>
                  <input
                    type="date"
                    value={customEndDate}
                    onChange={(e) => setCustomEndDate(e.target.value)}
                    required
                  />
                </div>
              </div>
            )}

            <div className="form-actions">
              <button type="submit" className="generate-button" disabled={loading}>
                <span className="button-icon">{loading ? '⏳' : '✨'}</span>
                {loading ? 'Generating...' : 'Generate Statement'}
              </button>
            </div>
          </form>
        </div>

        {/* Statement Display */}
        {statement && (
          <div className="statement-display">
            <div className="statement-header">
              <div className="header-content">
                <h3>📊 Statement Details</h3>
                <span className="statement-period">{statement.statement_period}</span>
              </div>
              <button className="download-button" onClick={handleDownload}>
                <span className="button-icon">📥</span>
                Download Statement
              </button>
            </div>

            <div className="statement-info">
              <div className="info-card">
                <span className="info-label">Policy Number</span>
                <span className="info-value">{statement.policy_details.policy_number}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Investor Name</span>
                <span className="info-value">{statement.policy_details.investor_name}</span>
              </div>
              <div className="info-card">
                <span className="info-label">Statement Period</span>
                <span className="info-value">{statement.statement_period}</span>
              </div>
            </div>

            <div className="statement-summary">
              <div className="section-header">
                <h4>💰 Financial Summary</h4>
              </div>
              <div className="summary-grid">
                <div className="summary-card">
                  <div className="summary-icon">📈</div>
                  <div className="summary-content">
                    <span className="summary-label">Total Inflow</span>
                    <span className="summary-value">₦{Number(statement.summary.total_inflow).toLocaleString()}</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">📉</div>
                  <div className="summary-content">
                    <span className="summary-label">Total Outflow</span>
                    <span className="summary-value">₦{Number(statement.summary.total_outflow).toLocaleString()}</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">💵</div>
                  <div className="summary-content">
                    <span className="summary-label">Net Flow</span>
                    <span className="summary-value">₦{Number(statement.summary.net_flow).toLocaleString()}</span>
                  </div>
                </div>
                <div className="summary-card">
                  <div className="summary-icon">🎯</div>
                  <div className="summary-content">
                    <span className="summary-label">ROI Accrued</span>
                    <span className="summary-value">₦{Number(statement.summary.roi_accrued).toLocaleString()}</span>
                  </div>
                </div>
              </div>
            </div>

            <div className="statement-transactions">
              <div className="section-header">
                <h4>📝 Transaction History</h4>
              </div>
              <div className="table-wrapper">
                <table className="transactions-table">
                  <thead>
                    <tr>
                      <th>Date</th>
                      <th>Description</th>
                      <th>Type</th>
                      <th>Inflow (₦)</th>
                      <th>Outflow (₦)</th>
                      <th>Principal (₦)</th>
                      <th>ROI (₦)</th>
                      <th>Total (₦)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statement.entries.map((entry, idx) => (
                      <tr key={idx}>
                        <td className="date">{new Date(entry.entry_date).toLocaleDateString()}</td>
                        <td className="description">{entry.description}</td>
                        <td className="type">{entry.entry_type_display}</td>
                        <td className="amount inflow">₦{Number(entry.inflow).toLocaleString()}</td>
                        <td className="amount outflow">₦{Number(entry.outflow).toLocaleString()}</td>
                        <td className="amount">₦{Number(entry.principal_balance).toLocaleString()}</td>
                        <td className="amount">₦{Number(entry.roi_balance).toLocaleString()}</td>
                        <td className="amount total">₦{Number(entry.total_balance).toLocaleString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default StatementPage;
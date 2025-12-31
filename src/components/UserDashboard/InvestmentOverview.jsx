import React, { useState, useEffect } from 'react';
import './InvestmentOverview.css';
import useInvestmentApi from '../../services/InvestmentApiService';
import { useAuth } from '../../contexts/AuthContext';

const InvestmentOverview = () => {
  const { user } = useAuth();
  const {
    getDashboard,
    getPolicies,
  } = useInvestmentApi();

  const [dashboard, setDashboard] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch dashboard data
        const dashboardData = await getDashboard();
        if (dashboardData) {
          setDashboard(dashboardData);
        }

        // Fetch user's policies
        const policiesData = await getPolicies();
        if (policiesData && policiesData.results) {
          setPolicies(policiesData.results);
        }

      } catch (err) {
        console.error('Error fetching investment overview data:', err);
        setError('Failed to load investment data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [getDashboard, getPolicies]);

  // Set tenant colors as CSS variables
  useEffect(() => {
    if (user?.tenant_primary_color) {
      document.documentElement.style.setProperty('--tenant-primary', user.tenant_primary_color);
    }
    if (user?.tenant_secondary_color) {
      document.documentElement.style.setProperty('--tenant-secondary', user.tenant_secondary_color);
    }
  }, [user]);

  if (loading) {
    return (
      <div className="loading">
        <div className="spinner"></div>
        Loading investments...
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
    <section className="investment-overview light">
      <div className="header-section">
        <div className="user-greeting">
          <h3>👋 Welcome back, {user?.first_name}!</h3>
          <p>Track your investment performance and portfolio</p>
        </div>
      </div>

      <div className="content-wrapper">
        {/* Investment Summary Section */}
        {dashboard && (
          <div className="summary-section">
            <div className="section-header">
              <h3>📊 Investment Summary</h3>
              <span className="section-subtitle">Your portfolio overview at a glance</span>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <div className="card-header">
                  <span className="card-icon">📋</span>
                  <span className="card-label">Total Policies</span>
                </div>
                <p className="card-value">{dashboard.metrics?.total_policies || 0}</p>
              </div>

              <div className="summary-card">
                <div className="card-header">
                  <span className="card-icon">💰</span>
                  <span className="card-label">Total Investment</span>
                </div>
                <p className="card-value">₦{Number(dashboard.metrics?.total_policy_amount || 0).toLocaleString()}</p>
              </div>

              <div className="summary-card">
                <div className="card-header">
                  <span className="card-icon">📈</span>
                  <span className="card-label">Accrued ROI</span>
                </div>
                <p className="card-value">₦{Number(dashboard.metrics?.total_roi || 0).toLocaleString()}</p>
              </div>

              <div className="summary-card">
                <div className="card-header">
                  <span className="card-icon">📅</span>
                  <span className="card-label">Monthly ROI Estimate</span>
                </div>
                <p className="card-value">₦{Number(dashboard.metrics?.monthly_roi_estimate || 0).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}

        {/* Recent Activity Section */}
        {dashboard?.recent_activity && dashboard.recent_activity.length > 0 && (
          <div className="activity-section">
            <div className="section-header">
              <h3>🔔 Recent Activity</h3>
              <span className="section-subtitle">Your latest investment transactions</span>
            </div>

            <div className="activity-list">
              {dashboard.recent_activity.slice(0, 5).map((activity, idx) => (
                <div key={idx} className="activity-item">
                  <div className="activity-icon">💼</div>
                  <div className="activity-details">
                    <div className="activity-description">{activity.description}</div>
                    <div className="activity-meta">
                      <span className="activity-date">{new Date(activity.date).toLocaleDateString()}</span>
                      <span className="activity-amount">₦{Number(activity.amount || 0).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investment Policies Section */}
        <div className="policies-section">
          <div className="section-header">
            <h3>📁 My Investment Policies</h3>
            <span className="section-subtitle">Detailed view of your active investment policies</span>
          </div>

          {policies.length > 0 ? (
            <div className="table-wrapper">
              <table className="policies-table">
                <thead>
                  <tr>
                    <th>Policy Number</th>
                    <th>Principal (₦)</th>
                    <th>ROI Balance (₦)</th>
                    <th>Total Balance (₦)</th>
                    <th>ROI Frequency</th>
                    <th>Status</th>
                    <th>Start Date</th>
                  </tr>
                </thead>
                <tbody>
                  {policies.map((policy, idx) => (
                    <tr key={idx}>
                      <td className="policy-number">{policy.policy_number}</td>
                      <td className="amount">₦{Number(policy.principal_amount || 0).toLocaleString()}</td>
                      <td className="amount">₦{Number(policy.roi_balance || 0).toLocaleString()}</td>
                      <td className="amount total-balance">₦{Number((policy.current_balance || 0) + (policy.roi_balance || 0)).toLocaleString()}</td>
                      <td className="frequency">{policy.roi_frequency}</td>
                      <td>
                        <span className={`status-badge ${policy.status?.toLowerCase()}`}>
                          {policy.status}
                        </span>
                      </td>
                      <td className="date">{policy.start_date ? new Date(policy.start_date).toLocaleDateString() : 'N/A'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📊</span>
              <p>No investment policies found</p>
              <small>Start your investment journey today</small>
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default InvestmentOverview;
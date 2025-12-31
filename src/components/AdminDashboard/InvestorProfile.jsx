// src/components/AdminDashboard/InvestorProfile.jsx
import React, { useState, useEffect } from 'react';
import useInvestmentApi from '../../services/InvestmentApiService';
import './InvestorProfile.css';

const PAGE_SIZE = 10;

const InvestorProfile = ({ investor, onBack }) => {
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [expandedInvestment, setExpandedInvestment] = useState(null);
  const [policies, setPolicies] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  
  const { getInvestorPolicies, getWithdrawals } = useInvestmentApi();

  // Fetch policies and withdrawals for this investor
  useEffect(() => {
    const loadData = async () => {
      if (!investor?.id) return;

      setLoading(true);
      try {
        // Fetch policies for this specific investor using the dedicated endpoint
        const investorData = await getInvestorPolicies(investor.id);
        const userPolicies = investorData.policies || [];
        setPolicies(userPolicies);

        // Fetch withdrawals for all policies of this investor
        const withdrawalsData = await getWithdrawals({ user: investor.id });
        const userWithdrawals = withdrawalsData.results || [];
        setWithdrawals(userWithdrawals);
      } catch (error) {
        console.error('Error loading investor data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [investor?.id, getInvestorPolicies, getWithdrawals]);

  // Reset to page 1 when search changes
  useEffect(() => {
    setCurrentPage(1);
    setExpandedInvestment(null);
  }, [search]);

  if (!investor) return null;
  if (loading) {
    return (
      <div className="investor-detail-container">
        <button onClick={onBack} className="back-btn">
          <span className="material-icons">arrow_back</span> Back
        </button>
        <div style={{ textAlign: 'center', padding: '3rem' }}>
          <div className="loader"></div>
          <p>Loading investor data...</p>
        </div>
      </div>
    );
  }

  // Filtered policies based on search
  const filteredPolicies = policies.filter(policy =>
    Object.values(policy)
      .join(' ')
      .toLowerCase()
      .includes(search.toLowerCase())
  );

  // Pagination logic
  const totalPages = Math.ceil(filteredPolicies.length / PAGE_SIZE);
  const paginatedPolicies = filteredPolicies.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  // Helper function to get withdrawals for a specific policy
  const getWithdrawalsForPolicy = (policyId) => {
    return withdrawals.filter(w => w.policy === policyId);
  };

  // Toggle expanded policy for withdrawals
  const toggleWithdrawals = (policyId) => {
    setExpandedInvestment(expandedInvestment === policyId ? null : policyId);
  };

  // Calculate totals
  const totalPrincipal = policies.reduce((total, policy) => 
    total + parseFloat(policy.principal_amount || 0), 0
  );
  
  const totalRemainingBalance = policies.reduce((total, policy) => 
    total + parseFloat(policy.current_balance || 0), 0
  );
  
  const totalRoiBalance = policies.reduce((total, policy) => 
    total + parseFloat(policy.roi_balance || 0), 0
  );
  
  const totalWithdrawn = withdrawals
    .filter(w => w.status === 'processed')
    .reduce((total, w) => total + parseFloat(w.amount_requested || 0), 0);

  return (
    <div className="investor-detail-container">
      <button onClick={onBack} className="back-btn">
        <span className="material-icons">arrow_back</span> Back
      </button>
      <div className="investor-detail-card">
        <h3 className="investor-detail-title">
          <span className="material-icons investor-avatar">
            {investor.gender === 'Male' ? 'person' : 'person_2'}
          </span>
          {investor.name}  
          <span className="investor-contact">
            {investor.gender && (
              <>
                <span className="material-icons">wc</span>
                <span>{investor.gender}</span>
              </>
            )}
            {investor.phoneNumber && investor.phoneNumber !== 'N/A' && (
              <>
                <span className="material-icons">call</span>
                <span>{investor.phoneNumber}</span>
              </>
            )}
            {investor.email && (
              <>
                <span className="material-icons">mail</span>
                <span>{investor.email}</span>
              </>
            )}
          </span>
        </h3>
        
        {/* Summary Cards */}
        <div className="summary-cards">
          <div className="summary-card">
            <div className="summary-label">Total Principal</div>
            <div className="summary-value">₦{totalPrincipal.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Current Balance</div>
            <div className="summary-value">₦{totalRemainingBalance.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">ROI Balance</div>
            <div className="summary-value">₦{totalRoiBalance.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Withdrawn</div>
            <div className="summary-value">₦{totalWithdrawn.toLocaleString()}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Active Policies</div>
            <div className="summary-value">{policies.filter(p => p.status === 'active').length}</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total Policies</div>
            <div className="summary-value">{policies.length}</div>
          </div>
        </div>

        {policies.length > 0 ? (
          <>
            <h4 className="roi-history-title">Investment Policies & Withdrawals</h4>
            <div style={{ marginBottom: '1rem', maxWidth: 300 }}>
              <input
                type="text"
                className="roi-history-search"
                placeholder="Search policies..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                style={{
                  width: '100%',
                  padding: '0.5rem',
                  borderRadius: '6px',
                  border: '1px solid #ccc',
                  fontSize: '1rem'
                }}
              />
            </div>
            <div className="investments-table-wrapper">
              <table className="investments-table">
                <thead>
                  <tr>
                    <th>Policy Number</th>
                    <th>Principal Amount</th>
                    <th>Current Balance</th>
                    <th>ROI Balance</th>
                    <th>ROI Rate</th>
                    <th>Frequency</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedPolicies.map((policy) => {
                    const policyWithdrawals = getWithdrawalsForPolicy(policy.id);
                    const isExpanded = expandedInvestment === policy.id;
                    return (
                      <React.Fragment key={policy.id}>
                        <tr className="investment-row">
                          <td>{policy.policy_number}</td>
                          <td>₦{parseFloat(policy.principal_amount || 0).toLocaleString()}</td>
                          <td>₦{parseFloat(policy.current_balance || 0).toLocaleString()}</td>
                          <td>₦{parseFloat(policy.roi_balance || 0).toLocaleString()}</td>
                          <td>{policy.roi_rate}%</td>
                          <td className="capitalize">{policy.roi_frequency}</td>
                          <td>
                            <span className={`status-badge ${policy.status}`}>
                              {policy.status}
                            </span>
                          </td>
                          <td>
                            <button
                              className="toggle-withdrawals-btn"
                              onClick={() => toggleWithdrawals(policy.id)}
                              title="View withdrawals"
                            >
                              <span className="material-icons">
                                {isExpanded ? 'expand_less' : 'expand_more'}
                              </span>
                              <span style={{ marginLeft: '0.25rem' }}>
                                ({policyWithdrawals.length})
                              </span>
                            </button>
                          </td>
                        </tr>
                        {isExpanded && policyWithdrawals.length > 0 && (
                          <tr className="withdrawals-row">
                            <td colSpan="8">
                              <div className="withdrawals-section">
                                <h6>Withdrawals for {policy.policy_number}</h6>
                                <div className="withdrawals-table-wrapper">
                                  <table className="withdrawals-table">
                                    <thead>
                                      <tr>
                                        <th>Amount</th>
                                        <th>Type</th>
                                        <th>Request Date</th>
                                        <th>Status</th>
                                        <th>Bank Details</th>
                                      </tr>
                                    </thead>
                                    <tbody>
                                      {policyWithdrawals.map(withdrawal => (
                                        <tr key={withdrawal.id}>
                                          <td>₦{parseFloat(withdrawal.amount_requested || 0).toLocaleString()}</td>
                                          <td className="capitalize">{withdrawal.withdrawal_type?.replace('_', ' ')}</td>
                                          <td>{formatDate(withdrawal.request_date)}</td>
                                          <td>
                                            <span className={`status-badge ${withdrawal.status}`}>
                                              {withdrawal.status}
                                            </span>
                                          </td>
                                          <td>
                                            {withdrawal.disbursement_bank}<br />
                                            <small>{withdrawal.account_number}</small>
                                          </td>
                                        </tr>
                                      ))}
                                    </tbody>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                        {isExpanded && policyWithdrawals.length === 0 && (
                          <tr className="withdrawals-row">
                            <td colSpan="8">
                              <div className="no-withdrawals">
                                No withdrawals for this policy
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {totalPages > 1 && (
              <div style={{ display: 'flex', justifyContent: 'center', marginTop: '1rem', gap: '0.5rem' }}>
                <button
                  className="pagination-btn"
                  onClick={handlePrev}
                  disabled={currentPage === 1}
                >
                  &lt;
                </button>
                {[...Array(totalPages)].map((_, i) => (
                  <button
                    key={i}
                    className={`pagination-btn${currentPage === i + 1 ? ' active' : ''}`}
                    onClick={() => setCurrentPage(i + 1)}
                  >
                    {i + 1}
                  </button>
                ))}
                <button
                  className="pagination-btn"
                  onClick={handleNext}
                  disabled={currentPage === totalPages}
                >
                  &gt;
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="no-history-section">
            <h4 className="roi-history-title">Investment Status</h4>
            <p className="no-history-message">
              This investor has no active investment policies.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Helper function to format dates
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(/ /g, ' ');
};

export default InvestorProfile;
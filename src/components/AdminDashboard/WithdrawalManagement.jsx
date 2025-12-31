// src/components/AdminDashboard/WithdrawalManagement.jsx
import React, { useState, useEffect } from 'react';
import useInvestmentApi from '../../services/InvestmentApiService';
import './WithdrawalManagement.css';

const WithdrawalManagement = () => {
  const { getWithdrawals, approveWithdrawal, processWithdrawal } = useInvestmentApi();
  
  const [withdrawals, setWithdrawals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(null);
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [message, setMessage] = useState({ text: '', type: '' });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // Load withdrawals
  useEffect(() => {
    loadWithdrawals();
  }, []);

  const loadWithdrawals = async () => {
    setLoading(true);
    try {
      const data = await getWithdrawals();
      setWithdrawals(data.results || []);
    } catch (error) {
      console.error('Error loading withdrawals:', error);
      showMessage('Failed to load withdrawals', 'error');
    } finally {
      setLoading(false);
    }
  };

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage({ text: '', type: '' }), 5000);
  };

  const handleApprove = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to approve this withdrawal?')) {
      return;
    }

    setActionLoading(withdrawalId);
    try {
      const result = await approveWithdrawal(withdrawalId);
      if (result.success) {
        showMessage('Withdrawal approved successfully!', 'success');
        await loadWithdrawals();
      } else {
        showMessage(result.error || 'Failed to approve withdrawal', 'error');
      }
    } catch (error) {
      console.error('Error approving withdrawal:', error);
      showMessage('An error occurred', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  const handleProcess = async (withdrawalId) => {
    if (!window.confirm('Are you sure you want to process this withdrawal? This action cannot be undone.')) {
      return;
    }

    setActionLoading(withdrawalId);
    try {
      const result = await processWithdrawal(withdrawalId);
      if (result.success) {
        showMessage('Withdrawal processed successfully!', 'success');
        await loadWithdrawals();
      } else {
        showMessage(result.error || 'Failed to process withdrawal', 'error');
      }
    } catch (error) {
      console.error('Error processing withdrawal:', error);
      showMessage('An error occurred', 'error');
    } finally {
      setActionLoading(null);
    }
  };

  // Filter withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesFilter = filter === 'all' || w.status === filter;
    const matchesSearch = 
      w.policy_number?.toLowerCase().includes(search.toLowerCase()) ||
      w.investor_name?.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  // Pagination
  const totalPages = Math.ceil(filteredWithdrawals.length / pageSize);
  const paginatedWithdrawals = filteredWithdrawals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrev = () => setCurrentPage(p => Math.max(1, p - 1));
  const handleNext = () => setCurrentPage(p => Math.min(totalPages, p + 1));

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loader"></div>
        <p>Loading withdrawals...</p>
      </div>
    );
  }

  return (
    <div className="withdrawal-management">
      {message.text && (
        <div className={`withdrawal-message ${message.type}`}>
          {message.text}
        </div>
      )}


      {/* Filters and Search */}
      <div className="withdrawal-controls">
        <input
          type="text"
          placeholder="Search by policy number or investor name..."
          value={search}
          onChange={(e) => {
            setSearch(e.target.value);
            setCurrentPage(1);
          }}
          className="search-input"
        />

        <select
          value={filter}
          onChange={(e) => {
            setFilter(e.target.value);
            setCurrentPage(1);
          }}
          className="filter-select"
        >
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="processed">Processed</option>
          <option value="rejected">Rejected</option>
        </select>

        <button onClick={loadWithdrawals} className="refresh-btn" disabled={loading}>
          <span className="material-icons">refresh</span>
          Refresh
        </button>
      </div>

      {/* Statistics */}
      <div className="withdrawal-stats">
        <div
          className={`stat-card clickable ${filter === 'all' ? 'active' : ''}`}
          onClick={() => {
            setFilter('all');
            setCurrentPage(1);
          }}
          style={{ cursor: 'pointer' }}
          title="Click to show all withdrawals"
        >
          <span className="material-icons">list_alt</span>
          <div>
            <div className="stat-value">{withdrawals.length}</div>
            <div className="stat-label">All</div>
          </div>
        </div>
        <div
          className={`stat-card clickable ${filter === 'pending' ? 'active' : ''}`}
          onClick={() => {
            setFilter('pending');
            setCurrentPage(1);
          }}
          style={{ cursor: 'pointer' }}
          title="Click to filter by pending withdrawals"
        >
          <span className="material-icons">pending_actions</span>
          <div>
            <div className="stat-value">{withdrawals.filter(w => w.status === 'pending').length}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div
          className={`stat-card clickable ${filter === 'approved' ? 'active' : ''}`}
          onClick={() => {
            setFilter('approved');
            setCurrentPage(1);
          }}
          style={{ cursor: 'pointer' }}
          title="Click to filter by approved withdrawals"
        >
          <span className="material-icons">check_circle</span>
          <div>
            <div className="stat-value">{withdrawals.filter(w => w.status === 'approved').length}</div>
            <div className="stat-label">Approved</div>
          </div>
        </div>
        <div
          className={`stat-card clickable ${filter === 'processed' ? 'active' : ''}`}
          onClick={() => {
            setFilter('processed');
            setCurrentPage(1);
          }}
          style={{ cursor: 'pointer' }}
          title="Click to filter by processed withdrawals"
        >
          <span className="material-icons">task_alt</span>
          <div>
            <div className="stat-value">{withdrawals.filter(w => w.status === 'processed').length}</div>
            <div className="stat-label">Processed</div>
          </div>
        </div>
      </div>

      {/* Withdrawals Table */}
      <div className="withdrawals-table-wrapper">
        <table className="withdrawals-table">
          <thead>
            <tr>
              <th>Policy Number</th>
              <th>Investor</th>
              <th>Type</th>
              <th>Amount (₦)</th>
              <th>Request Date</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedWithdrawals.length === 0 ? (
              <tr>
                <td colSpan={7} style={{ textAlign: 'center', padding: '2rem' }}>
                  No withdrawals found
                </td>
              </tr>
            ) : (
              paginatedWithdrawals.map((withdrawal) => (
                <tr key={withdrawal.id}>
                  <td>{withdrawal.policy_number}</td>
                  <td>{withdrawal.investor_name}</td>
                  <td className="capitalize">{withdrawal.withdrawal_type?.replace('_', ' ')}</td>
                  <td>₦{parseFloat(withdrawal.amount_requested || 0).toLocaleString()}</td>
                  <td>{formatDate(withdrawal.request_date)}</td>
                  <td>
                    <span className={`status-badge ${withdrawal.status}`}>
                      {withdrawal.status}
                    </span>
                  </td>
                  <td>
                    <div className="action-buttons">
                      {withdrawal.status === 'pending' && (
                        <button
                          onClick={() => handleApprove(withdrawal.id)}
                          className="action-btn approve"
                          disabled={actionLoading === withdrawal.id}
                        >
                          <span className="material-icons">check</span>
                          {actionLoading === withdrawal.id ? 'Processing...' : 'Approve'}
                        </button>
                      )}
                      {withdrawal.status === 'approved' && (
                        <button
                          onClick={() => handleProcess(withdrawal.id)}
                          className="action-btn process"
                          disabled={actionLoading === withdrawal.id}
                        >
                          <span className="material-icons">send</span>
                          {actionLoading === withdrawal.id ? 'Processing...' : 'Process'}
                        </button>
                      )}
                      {withdrawal.status === 'processed' && (
                        <span className="completed-badge">
                          <span className="material-icons">done_all</span>
                          Completed
                        </span>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="pagination">
          <button onClick={handlePrev} disabled={currentPage === 1} className="pagination-btn">
            &lt;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
            >
              {i + 1}
            </button>
          ))}
          <button onClick={handleNext} disabled={currentPage === totalPages} className="pagination-btn">
            &gt;
          </button>
        </div>
      )}
    </div>
  );
};

// Helper function
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  return date.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' });
};

export default WithdrawalManagement;
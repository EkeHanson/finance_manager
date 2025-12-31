import React, { useState, useEffect, useRef } from 'react';
import MessageModal from '../MessageModal';
import './InvestmentTable.css';

// Helper function to format date as DD MMM YYYY (e.g., 21 Sep 2025)
const formatDate = (dateString) => {
  if (!dateString) return 'N/A';
  const date = new Date(dateString);
  const options = { day: '2-digit', month: 'short', year: 'numeric' };
  return date.toLocaleDateString('en-GB', options).replace(/ /g, ' ');
};

// Helper function to get month name from date string (e.g., "2025-07-01" -> "July")
const getMonthName = (dateString) => {
  if (!dateString) return null;
  const date = new Date(dateString);
  return date.toLocaleString('en-GB', { month: 'long' });
};

const WithdrawalHistoryTable = ({ investors, onInvestorNameClick, onWithdrawalAction }) => {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [statusFilter, setStatusFilter] = useState('All Statuses');

  // Message modal state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Hamburger menu state
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();
  const [dropdownUp, setDropdownUp] = useState(false);

  // Flatten withdrawals with investor details
  const withdrawals = investors.flatMap(investor =>
    (investor.withdrawals || []).map((withdrawal, idx) => ({
      investorId: investor.id,
      withdrawalIndex: idx,
      investorName: investor.name,
      email: investor.email,
      phoneNumber: investor.phoneNumber,
      uniquePolicy: investor.uniquePolicy,
      amount: withdrawal.amount,
      date: withdrawal.date,
      status: withdrawal.status || 'Pending',
      reason: withdrawal.reason || 'N/A'
    }))
  );

  // Get unique months and statuses for dropdowns
  const uniqueMonths = ['All Months', ...new Set(withdrawals.map(w => getMonthName(w.date)).filter(Boolean))];
  const uniqueStatuses = ['All Statuses', 'Pending', 'Approved', 'Rejected'];

  // Filtered withdrawals
  const filteredWithdrawals = withdrawals.filter(w => {
    const matchesSearch = (
      w.investorName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (w.uniquePolicy && w.uniquePolicy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.email && w.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (w.phoneNumber && w.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesMonth = monthFilter === 'All Months' || getMonthName(w.date) === monthFilter;
    const matchesStatus = statusFilter === 'All Statuses' || w.status === statusFilter;
    return matchesSearch && matchesMonth && matchesStatus;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredWithdrawals.length / pageSize);
  const paginatedWithdrawals = filteredWithdrawals.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId !== null && menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, monthFilter, statusFilter]);

  // Check if dropdown should open up or down
  const handleHamburgerClick = (withdrawalId, btnRef) => {
    if (openMenuId === withdrawalId) {
      setOpenMenuId(null);
      return;
    }
    setOpenMenuId(withdrawalId);
    setTimeout(() => {
      if (btnRef.current) {
        const rect = btnRef.current.getBoundingClientRect();
        const dropdownHeight = 100; // Estimate dropdown height
        const spaceBelow = window.innerHeight - rect.bottom;
        setDropdownUp(spaceBelow < dropdownHeight);
      }
    }, 0);
  };

  return (
    <div className="table-container" role="region" aria-label="Withdrawal History Table">
      <MessageModal
        message={message}
        type={messageType}
        onClose={() => setMessage('')}
      />
      <h2>Withdrawal History</h2>
      {/* Search and Filter Controls */}
      <div className="table-search-bar">
        <div className="filter-group">
          <label htmlFor="search-input">Search:</label>
          <input
            id="search-input"
            type="text"
            placeholder="Search by name, policy, email, or phone..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="month-filter">Filter by Month:</label>
          <select
            id="month-filter"
            value={monthFilter}
            onChange={e => setMonthFilter(e.target.value)}
          >
            {uniqueMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select
            id="status-filter"
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
          >
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Phone</th>
            <th>Policy Number</th>
            <th>Amount (₦)</th>
            <th>Request Date</th>
            <th>Status</th>
            <th>Reason</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedWithdrawals.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                No withdrawal requests found.
              </td>
            </tr>
          ) : (
            paginatedWithdrawals.map((withdrawal, idx) => {
              const btnRef = useRef();
              const withdrawalId = `${withdrawal.investorId}-${withdrawal.withdrawalIndex}`;
              return (
                <tr key={withdrawalId}>
                  <td data-label="Name">
                    <button
                      className="investor-name-btn"
                      onClick={() => onInvestorNameClick && onInvestorNameClick(investors.find(i => i.id === withdrawal.investorId))}
                      title={`View details for ${withdrawal.investorName}`}
                    >
                      {withdrawal.investorName || 'N/A'}
                    </button>
                  </td>
                  <td data-label="Email">{withdrawal.email || 'N/A'}</td>
                  <td data-label="Phone">{withdrawal.phoneNumber || 'N/A'}</td>
                  <td data-label="Policy Number">{withdrawal.uniquePolicy || 'N/A'}</td>
                  <td data-label="Amount (₦)">{withdrawal.amount.toLocaleString()}</td>
                  <td data-label="Request Date">{formatDate(withdrawal.date)}</td>
                  <td data-label="Status">
                    <span
                      style={{
                        color:
                          withdrawal.status === 'Approved'
                            ? '#388e3c'
                            : withdrawal.status === 'Rejected'
                            ? '#e63a27'
                            : '#888',
                        fontWeight: 600,
                      }}
                    >
                      {withdrawal.status}
                    </span>
                  </td>
                  <td data-label="Reason">{withdrawal.reason}</td>
                  <td data-label="Actions" style={{ position: 'relative' }}>
                    {withdrawal.status === 'Pending' && (
                      <div className="hamburger-menu-wrapper" ref={openMenuId === withdrawalId ? menuRef : null}>
                        <button
                          ref={btnRef}
                          className="hamburger-btn"
                          aria-label="Show actions"
                          onClick={e => {
                            e.stopPropagation();
                            handleHamburgerClick(withdrawalId, btnRef);
                          }}
                        >
                          <span className="hamburger-bar"></span>
                          <span className="hamburger-bar"></span>
                          <span className="hamburger-bar"></span>
                        </button>
                        {openMenuId === withdrawalId && (
                          <div
                            className={`hamburger-dropdown${dropdownUp ? ' dropdown-up' : ''}`}
                            onClick={e => e.stopPropagation()}
                          >
                            <button
                              className="dropdown-action-btn"
                              onClick={() => {
                                onWithdrawalAction(investors.find(i => i.id === withdrawal.investorId), withdrawal.withdrawalIndex);
                                setOpenMenuId(null);
                              }}
                            >
                              Approve
                            </button>
                            <button
                              className="dropdown-action-btn"
                              style={{ color: '#e63a27' }}
                              onClick={() => {
                                onWithdrawalAction(investors.find(i => i.id === withdrawal.investorId), withdrawal.withdrawalIndex);
                                setOpenMenuId(null);
                              }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
      <div className="pagination">
        <button className="pagination-btn" onClick={handlePrev} disabled={currentPage === 1}>
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
        <button className="pagination-btn" onClick={handleNext} disabled={currentPage === totalPages}>
          &gt;
        </button>
      </div>
    </div>
  );
};

export default WithdrawalHistoryTable;
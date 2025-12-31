import React, { useState, useEffect } from 'react';
import './InvestmentTable.css';
import MessageModal from '../MessageModal';

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

const ROIPolicyTable = ({ investors, onInvestorNameClick }) => {
  // Search and filter states
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [roiDueFilter, setRoiDueFilter] = useState('All');

  // Message modal state
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');

  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;

  // Get unique months for dropdown
  const uniqueMonths = ['All Months', ...new Set(investors.map(inv => getMonthName(inv.roiDueDate)).filter(Boolean))];

  // Filtered investors
  const filteredInvestors = investors.filter(inv => {
    // Only include investors with ROI due
    if (!inv.roiDue || inv.roiDue <= 0) return false;

    const matchesSearch = (
      inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.uniquePolicy && inv.uniquePolicy.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.email && inv.email.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (inv.phoneNumber && inv.phoneNumber.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    const matchesMonth = monthFilter === 'All Months' || getMonthName(inv.roiDueDate) === monthFilter;

    const now = new Date(); // Use current date dynamically
    const dueDate = inv.roiDueDate ? new Date(inv.roiDueDate) : null;
    const matchesRoiDue = roiDueFilter === 'All' ||
      (roiDueFilter === 'Monthly' && inv.roiFrequency === 'Monthly' && matchesMonth) ||
      (roiDueFilter === 'As at When Due' && dueDate && (
        dueDate <= now || // Overdue
        (dueDate > now && (dueDate - now) / (1000 * 60 * 60 * 24) <= 7) // Due within 7 days
      ));

    return matchesSearch && matchesMonth && matchesRoiDue;
  });

  // Pagination logic
  const totalPages = Math.ceil(filteredInvestors.length / pageSize);
  const paginatedInvestors = filteredInvestors.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, monthFilter, roiDueFilter]);

  return (
    <div className="table-container" role="region" aria-label="ROI Due Customers Table">
      <MessageModal
        message={message}
        type={messageType}
        onClose={() => setMessage('')}
      />
      <h2>Customers with ROI Due</h2>
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
          <label htmlFor="roi-due-filter">Filter by ROI Due:</label>
          <select
            id="roi-due-filter"
            value={roiDueFilter}
            onChange={e => setRoiDueFilter(e.target.value)}
          >
            <option value="All">All</option>
            <option value="Monthly">Monthly</option>
            <option value="As at When Due">As at When Due</option>
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
            <th>ROI Amount (₦)</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInvestors.length === 0 ? (
            <tr>
              <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                No customers with ROI due found.
              </td>
            </tr>
          ) : (
            paginatedInvestors.map((investor) => (
              <tr key={investor.id}>
                <td data-label="Name">
                  <button
                    className="investor-name-btn"
                    onClick={() => onInvestorNameClick && onInvestorNameClick(investor)}
                    title={`View details for ${investor.name}`}
                  >
                    {investor.name || 'N/A'}
                  </button>
                </td>
                <td data-label="Email">{investor.email || 'N/A'}</td>
                <td data-label="Phone">{investor.phoneNumber || 'N/A'}</td>
                <td data-label="Policy Number">{investor.uniquePolicy || 'N/A'}</td>
                <td data-label="ROI Amount (₦)">
                  <div>
                    <div>₦{(investor.roiDue ?? 0).toLocaleString()}</div>
                    <div
                      className={
                        !investor.roiDueDate
                          ? "roi-date roi-date-na"
                          : (() => {
                              const due = new Date(investor.roiDueDate);
                              const now = new Date();
                              const diff = (due - now) / (1000 * 60 * 60 * 24);
                              if (diff < 0) return "roi-date roi-date-warning";
                              if (diff <= 7) return "roi-date roi-date-warning";
                              return "roi-date roi-date-ok";
                            })()
                      }
                      style={{ fontSize: '0.95em' }}
                    >
                      ({formatDate(investor.roiDueDate) || 'N/A'})
                    </div>
                  </div>
                </td>
              </tr>
            ))
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

export default ROIPolicyTable;
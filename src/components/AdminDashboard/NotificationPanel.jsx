
import React, { useState, useEffect } from 'react';
import './NotificationPanel.css';

const NotificationPanel = ({ notifications }) => {
  // State for search, filter, compact view, mark as read, and pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [compact, setCompact] = useState(false);
  const [readNotifications, setReadNotifications] = useState([]);

  const pageSize = 10;

  // Transform notifications to ensure consistent structure
  const processedNotifications = notifications.map((note, index) => {
    if (typeof note === 'string') {
      // Handle legacy string notifications from AdminDashboard
      let type = 'general';
      let status = 'Info';
      let details = '';
      const timestamp = new Date().toISOString().slice(0, 16).replace('T', ' ');

      if (note.includes('New investment') || note.includes('deposit')) {
        type = 'investment';
        status = 'Successful';
        details = `Investment Date: ${timestamp.split(' ')[0]} | Plan: Standard`;
      } else if (note.includes('ROI')) {
        type = 'roi';
        status = 'Available';
        details = `ROI Date: ${timestamp.split(' ')[0]} | Period: 1 Month`;
      } else if (note.includes('Withdrawal')) {
        type = 'withdrawal';
        status = note.includes('Pending') ? 'Pending' : 'Completed';
        details = `Withdrawal Date: ${timestamp.split(' ')[0]} | Method: Bank Transfer`;
      } else if (note.includes('KYC')) {
        type = 'kyc';
        status = note.includes('Approved') ? 'Approved' : 'Awaiting Approval';
        details = `Submission Date: ${timestamp.split(' ')[0]}`;
      } else if (note.includes('potential investor')) {
        type = 'investment';
        status = 'Pending';
        details = `Registration Date: ${timestamp.split(' ')[0]} | Awaiting Payment`;
      }

      return {
        type,
        message: note,
        details,
        status,
        timestamp,
      };
    }
    // Already structured notifications
    return note;
  });

  // Filter and search logic
  const filteredNotifications = processedNotifications.filter((note) => {
    const matchesType = filterType === 'all' || note.type === filterType;
    const matchesSearch =
      note.message.toLowerCase().includes(search.toLowerCase()) ||
      note.details.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const totalPages = Math.ceil(filteredNotifications.length / pageSize);
  const paginatedNotifications = filteredNotifications.slice(
    (currentPage - 1) * pageSize,
    Math.min(currentPage * pageSize, filteredNotifications.length)
  );

  const handlePrev = () => {
    setCurrentPage((prev) => Math.max(prev - 1, 1));
  };

  const handleNext = () => {
    setCurrentPage((prev) => Math.min(prev + 1, totalPages));
  };

  const handleMarkAllRead = () => {
    setReadNotifications(filteredNotifications.map((_, idx) => idx + (currentPage - 1) * pageSize));
  };

  // Icon mapping
  const typeIcons = {
    investment: 'trending_up',
    roi: 'show_chart',
    withdrawal: 'account_balance_wallet',
    kyc: 'verified_user',
    general: 'info',
  };

  // Status badge color
  const statusColors = {
    Successful: '#10b981',
    Available: '#3b82f6',
    Completed: '#f59e42',
    Approved: '#10b981',
    'Awaiting Approval': '#eab308',
    Pending: '#eab308',
    Info: '#6b7280',
  };

  // Reset to page 1 when search/filter changes
  useEffect(() => {
    setCurrentPage(1);
  }, [search, filterType]);

  return (
    <div className={`notification-panel${compact ? ' compact' : ''}`} style={compact ? { padding: '0.5rem', fontSize: '0.95rem', maxWidth: '500px', margin: '0 auto' } : {}}>
      <div className="notification-header" style={compact ? { padding: '0.5rem 0', fontSize: '1rem' } : {}}>
        <h3 style={compact ? { fontSize: '1.1rem', margin: '0.5rem 0' } : {}}>
          Notifications <span className="notification-count">({filteredNotifications.length})</span>
        </h3>
        <div className="notification-actions" style={compact ? { gap: '0.5rem' } : {}}>
          <input
            type="text"
            className="notification-search"
            placeholder="Search notifications..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setCurrentPage(1);
            }}
            style={compact ? { padding: '0.3rem', fontSize: '0.95rem', minWidth: '120px' } : {}}
          />
          <select
            className="notification-filter"
            value={filterType}
            onChange={(e) => {
              setFilterType(e.target.value);
              setCurrentPage(1);
            }}
            style={compact ? { padding: '0.3rem', fontSize: '0.95rem', minWidth: '100px' } : {}}
          >
            <option value="all">All Types</option>
            <option value="investment">Investment</option>
            <option value="roi">ROI</option>
            <option value="withdrawal">Withdrawal</option>
            <option value="kyc">KYC</option>
            <option value="general">General</option>
          </select>
          <button
            className="notification-btn"
            onClick={handleMarkAllRead}
            title="Mark all as read"
            style={compact ? { padding: '0.2rem 0.4rem', fontSize: '0.95rem' } : {}}
          >
            <span className="material-icons">done_all</span>
          </button>
          <button
            className="notification-btn"
            onClick={() => setCompact((v) => !v)}
            title={compact ? 'Regular view' : 'Compact view'}
            style={compact ? { padding: '0.2rem 0.4rem', fontSize: '0.95rem' } : {}}
          >
            <span className="material-icons">{compact ? 'view_agenda' : 'view_compact'}</span>
          </button>
        </div>
      </div>
      <ul style={compact ? { padding: 0, margin: 0 } : {}}>
        {paginatedNotifications.length === 0 ? (
          <li className="notification-empty" style={compact ? { fontSize: '0.95rem', padding: '0.5rem' } : {}}>
            No notifications found.
          </li>
        ) : (
          paginatedNotifications.map((note, idx) => {
            const globalIdx = idx + (currentPage - 1) * pageSize;
            const isRead = readNotifications.includes(globalIdx);
            return (
              <li
                key={globalIdx}
                className={`notification-item ${note.type}${compact ? ' compact' : ''}${isRead ? ' read' : ''}`}
                style={compact ? { padding: '0.5rem 0.3rem', marginBottom: '0.2rem', borderRadius: '6px', fontSize: '0.95rem', display: 'flex', flexDirection: 'column', gap: '0.2rem' } : {}}
              >
                <div className="notification-main" style={compact ? { gap: '0.5rem', alignItems: 'center', display: 'flex' } : {}}>
                  <span
                    className="material-icons notification-icon"
                    style={{ color: statusColors[note.status] || '#003087', fontSize: compact ? '1.1rem' : '1.3rem' }}
                  >
                    {typeIcons[note.type] || 'info'}
                  </span>
                  <div className="notification-content" style={compact ? { fontSize: '0.95rem' } : {}}>
                    <strong style={compact ? { fontWeight: 500 } : {}}>{note.message}</strong>
                    <div className="notification-details" style={compact ? { fontSize: '0.92rem' } : {}}>
                      {note.details}
                    </div>
                  </div>
                  <span
                    className="notification-status"
                    style={{
                      background: statusColors[note.status] || '#eee',
                      fontSize: compact ? '0.92rem' : '1rem',
                      padding: compact ? '0.2rem 0.5rem' : '0.3rem 0.7rem',
                      borderRadius: '5px',
                    }}
                  >
                    {note.status}
                  </span>
                </div>
                <div className="notification-meta" style={compact ? { fontSize: '0.9rem', color: '#888' } : {}}>
                  <span className="notification-timestamp">
                    <span className="material-icons" style={{ fontSize: '1rem', verticalAlign: 'middle', color: '#888' }}>
                      schedule
                    </span>
                    {note.timestamp}
                  </span>
                </div>
              </li>
            );
          })
        )}
      </ul>
      <div className="pagination" style={compact ? { margin: '0.5rem 0', gap: '0.2rem' } : {}}>
        <button
          className="pagination-btn"
          onClick={handlePrev}
          disabled={currentPage === 1}
          style={compact ? { width: '1.5rem', height: '1.5rem', fontSize: '0.95rem' } : {}}
        >
          &lt;
        </button>
        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            className={`pagination-btn${currentPage === i + 1 ? ' active' : ''}`}
            onClick={() => setCurrentPage(i + 1)}
            style={compact ? { width: '1.5rem', height: '1.5rem', fontSize: '0.95rem' } : {}}
          >
            {i + 1}
          </button>
        ))}
        <button
          className="pagination-btn"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          style={compact ? { width: '1.5rem', height: '1.5rem', fontSize: '0.95rem' } : {}}
        >
          &gt;
        </button>
      </div>
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
};

export default NotificationPanel;
// src/components/StaffTable.jsx
import React, { useState, useRef, useEffect } from 'react';
import './StaffTable.css';
import MessageModal from '../MessageModal';
import ConfirmModal from '../ConfirmModal';
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

const StaffTable = ({ staff, onStaffNameClick, onDelete }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [confirm, setConfirm] = useState({ show: false, action: null, staffMember: null });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();
  const [dropdownUp, setDropdownUp] = useState(false);
  const btnRefs = useRef({});


  console.log("staff")
  console.log(staff)
  console.log("staff")
  const uniqueMonths = ['All Months', ...new Set(staff.map(s => getMonthName(s.date)).filter(Boolean))];
  const uniqueStatuses = ['All Statuses', ...new Set(staff.map(s => s.status || 'Active'))];

  const filteredStaff = staff.filter(s => {
    const matchesSearch = s.name.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesMonth = monthFilter === 'All Months' || getMonthName(s.date) === monthFilter;
    const matchesStatus = statusFilter === 'All Statuses' || (s.status || 'Active') === statusFilter;
    return matchesSearch && matchesMonth && matchesStatus;
  });

  const totalPages = Math.ceil(filteredStaff.length / pageSize);
  const paginatedStaff = filteredStaff.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  const handlePrev = () => setCurrentPage((prev) => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage((prev) => Math.min(prev + 1, totalPages));

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (openMenuId !== null && menuRef.current && !menuRef.current.contains(event.target)) {
        setOpenMenuId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [openMenuId]);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, monthFilter, statusFilter]);

  const handleHamburgerClick = (staffId) => {
    if (openMenuId === staffId) {
      setOpenMenuId(null);
      return;
    }
    setOpenMenuId(staffId);
    setTimeout(() => {
      if (btnRefs.current[staffId]) {
        // On mobile, we use fixed positioning, so skip dynamic positioning
        if (window.innerWidth <= 480) {
          setDropdownUp(false);
          return;
        }

        const rect = btnRefs.current[staffId].getBoundingClientRect();
        const dropdownHeight = 180;
        const spaceBelow = window.innerHeight - rect.bottom;
        setDropdownUp(spaceBelow < dropdownHeight);
      }
    }, 0);
  };

  const handleAction = (action, staffMember) => {
    setConfirm({ show: true, action, staffMember });
    setOpenMenuId(null);
  };

  const handleConfirm = async () => {
    const { action, staffMember } = confirm;
    try {
      if (action === 'delete') {
        await onDelete(staffMember.id);
      } else {
        // For block/unblock, we still need to handle locally or call parent functions
        // For now, keep the message for block/unblock
        let msg = '';
        let type = 'success';
        if (action === 'block') {
          msg = `Staff "${staffMember.name}" has been blocked.`;
        } else if (action === 'unblock') {
          msg = `Staff "${staffMember.name}" has been unblocked.`;
        } else {
          type = 'error';
          msg = 'Unknown action!';
        }
        setMessage(msg);
        setMessageType(type);
      }
    } catch (error) {
      setMessage('Failed to perform action: ' + error.message);
      setMessageType('error');
    }
    setConfirm({ show: false, action: null, staffMember: null });
  };

  const handleCancel = () => {
    setConfirm({ show: false, action: null, staffMember: null });
  };

  return (
    <div className="table-container" role="region" aria-label="Staff Table">
      <MessageModal message={message} type={messageType} onClose={() => setMessage('')} />
      <ConfirmModal
        message={
          confirm.show
            ? confirm.action === 'block'
              ? `Are you sure you want to block "${confirm.staffMember?.name}"?`
              : confirm.action === 'unblock'
              ? `Are you sure you want to unblock "${confirm.staffMember?.name}"?`
              : confirm.action === 'delete'
              ? `Are you sure you want to delete "${confirm.staffMember?.name}"? This action cannot be undone.`
              : ''
            : ''
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <h2>Staff Members</h2>
      <div className="table-search-bar">
        <div className="filter-group">
          <label htmlFor="search-input">Search:</label>
          <input
            id="search-input"
            type="text"
            placeholder="Search by name..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="filter-group">
          <label htmlFor="month-filter">Filter by Month:</label>
          <select id="month-filter" value={monthFilter} onChange={e => setMonthFilter(e.target.value)}>
            {uniqueMonths.map(month => (
              <option key={month} value={month}>{month}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label htmlFor="status-filter">Filter by Status:</label>
          <select id="status-filter" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
            {uniqueStatuses.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>
      <table>
        <thead>
          <tr>
            <th>Date</th>
            <th>Staff Name</th>
            <th>Role</th>
            <th>Email</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedStaff.length === 0 ? (
            <tr>
              <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                No staff found.
              </td>
            </tr>
          ) : (
            paginatedStaff.map((staffMember) => {
              if (!btnRefs.current[staffMember.id]) {
                btnRefs.current[staffMember.id] = React.createRef();
              }
              const btnRef = btnRefs.current[staffMember.id];

              return (
                <tr key={staffMember.id}>
                  <td data-label="Date">{formatDate(staffMember.date)}</td>
                  <td data-label="Staff Name">
                    <button
                      className="investor-name-btn"
                      onClick={() => onStaffNameClick && onStaffNameClick(staffMember)}
                      title={`View details for ${staffMember.name}`}
                    >
                      {staffMember.name}
                    </button>
                  </td>
                  <td data-label="Role">{staffMember.role || 'N/A'}</td>
                  <td data-label="Email">{staffMember.email || 'N/A'}</td>
                  <td data-label="Status">
                    <span
                      style={{
                        color:
                          staffMember.status === 'Blocked'
                            ? '#e63a27'
                            : staffMember.status === 'Active'
                            ? '#388e3c'
                            : '#888',
                        fontWeight: 600,
                      }}
                    >
                      {staffMember.status || 'Active'}
                    </span>
                  </td>
                  <td data-label="Actions" style={{ position: 'relative' }}>
                    <div className="hamburger-menu-wrapper" ref={openMenuId === staffMember.id ? menuRef : null}>
                      <button
                        ref={btnRef}
                        className="hamburger-btn"
                        aria-label="Show actions"
                        onClick={e => {
                          e.stopPropagation();
                          handleHamburgerClick(staffMember.id);
                        }}
                      >
                        <span className="hamburger-bar"></span>
                        <span className="hamburger-bar"></span>
                        <span className="hamburger-bar"></span>
                      </button>
                      {openMenuId === staffMember.id && (
                        <div
                          className={`hamburger-dropdown${dropdownUp ? ' dropdown-up' : ''}`}
                          onClick={e => e.stopPropagation()}
                        >
                          {staffMember.status !== 'Blocked' ? (
                            <button
                              className="dropdown-action-btn"
                              onClick={() => handleAction('block', staffMember)}
                            >
                              Block/Suspend
                            </button>
                          ) : (
                            <button
                              className="dropdown-action-btn"
                              onClick={() => handleAction('unblock', staffMember)}
                            >
                              Unblock
                            </button>
                          )}
                          <button
                            className="dropdown-action-btn"
                            style={{ color: '#e63a27' }}
                            onClick={() => handleAction('delete', staffMember)}
                          >
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
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

export default StaffTable;
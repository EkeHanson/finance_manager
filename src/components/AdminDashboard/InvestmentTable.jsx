import React, { useState, useRef, useEffect } from 'react';
import './InvestmentTable.css';
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

const InvestmentTable = ({ investors, onVerifyKYC, onRecordTransaction, onInvestorNameClick, onDelete, onEditPolicy, onTaxReport }) => {
    // Map API data to table fields
    const mappedInvestors = investors.map(inv => {
      // Support both flat and nested API structures
      const user = inv.user_details || inv.userDetails || {};
      const investmentDetail = (user.investment_details && user.investment_details[0]) || (user.investmentDetails && user.investmentDetails[0]) || {};
      const withdrawals = user.withdrawal_details || user.withdrawalDetails || [];
      // Use current_balance from policy, fallback to investment_detail.remaining_balance
      const currentBalance = parseFloat(inv.current_balance || inv.currentBalance || investmentDetail.remaining_balance || 0);
      const principalAmount = parseFloat(inv.principal_amount || inv.principalAmount || investmentDetail.investment_amount || 0);
      // Calculate ROI Due (monthly) if not provided
      let roiDue = inv.roiDue;
      if (roiDue === undefined) {
        const roiRate = parseFloat(inv.roi_rate || inv.roiRate || investmentDetail.roi_rate || 0);
        roiDue = currentBalance * roiRate / 100 / 12;
      }
      // Use next_roi_date from policy, fallback to investment_detail.investment_start_date
      const roiDueDate = inv.next_roi_date || inv.nextRoiDate || investmentDetail.investment_start_date || null;
      return {
        id: inv.id,
        name: user.first_name && user.last_name ? `${user.first_name} ${user.last_name}` : user.email || inv.name || '',
        uniquePolicy: inv.policy_number || inv.policyNumber || inv.unique_policy_id || inv.uniquePolicy || '',
        date: inv.start_date || inv.startDate || investmentDetail.investment_start_date || '',
        investmentAmount: principalAmount,
        remainingBalance: currentBalance,
        roiDue,
        roiDueDate,
        withdrawals,
        status: inv.status || 'Active',
        kycStatus: user.kyc_status || user.kycStatus || '',
        policies: inv.policies || [],
        ...inv,
      };
    });
  const [searchTerm, setSearchTerm] = useState('');
  const [monthFilter, setMonthFilter] = useState('All Months');
  const [statusFilter, setStatusFilter] = useState('All Statuses');
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState('success');
  const [confirm, setConfirm] = useState({ show: false, action: null, investor: null });
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;
  const [openMenuId, setOpenMenuId] = useState(null);
  const menuRef = useRef();
  const [dropdownUp, setDropdownUp] = useState(false);
  const btnRefs = useRef({});


  const uniqueMonths = ['All Months', ...new Set(mappedInvestors.map(inv => getMonthName(inv.date)).filter(Boolean))];
  const uniqueStatuses = ['All Statuses', ...new Set(mappedInvestors.map(inv => inv.status || 'Active'))];

  const filteredInvestors = mappedInvestors.filter(inv => {
    const matchesSearch = (
      inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (inv.uniquePolicy && inv.uniquePolicy.toLowerCase().includes(searchTerm.toLowerCase()))
    );
    const matchesMonth = monthFilter === 'All Months' || getMonthName(inv.date) === monthFilter;
    const matchesStatus = statusFilter === 'All Statuses' || (inv.status || 'Active') === statusFilter;
    return matchesSearch && matchesMonth && matchesStatus;
  });

  const totalPages = Math.ceil(filteredInvestors.length / pageSize);
  const paginatedInvestors = filteredInvestors.slice(
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

  const handleHamburgerClick = (investorId) => {
    if (openMenuId === investorId) {
      setOpenMenuId(null);
      return;
    }
    setOpenMenuId(investorId);
    setTimeout(() => {
      if (btnRefs.current[investorId]) {
        // On mobile, we use fixed positioning, so skip dynamic positioning
        if (window.innerWidth <= 480) {
          setDropdownUp(false);
          return;
        }

        const rect = btnRefs.current[investorId].getBoundingClientRect();
        const dropdownHeight = 180;
        const spaceBelow = window.innerHeight - rect.bottom;
        setDropdownUp(spaceBelow < dropdownHeight);
      }
    }, 0);
  };

  const handleAction = (action, investor) => {
    setConfirm({ show: true, action, investor });
    setOpenMenuId(null);
  };

  const handleConfirm = async () => {
    const { action, investor } = confirm;
    try {
      if (action === 'delete') {
        await onDelete(investor.id);
      } else {
        // For block/unblock, we still need to handle locally or call parent functions
        // For now, keep the message for block/unblock
        let msg = '';
        let type = 'success';
        if (action === 'block') {
          msg = `Investor "${investor.name}" has been blocked.`;
        } else if (action === 'unblock') {
          msg = `Investor "${investor.name}" has been unblocked.`;
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
    setConfirm({ show: false, action: null, investor: null });
  };

  const handleCancel = () => {
    setConfirm({ show: false, action: null, investor: null });
  };

  return (
    <div className="table-container" role="region" aria-label="Investors Table">
      <MessageModal message={message} type={messageType} onClose={() => setMessage('')} />
      <ConfirmModal
        message={
          confirm.show
            ? confirm.action === 'block'
              ? `Are you sure you want to block "${confirm.investor?.name}"?`
              : confirm.action === 'unblock'
              ? `Are you sure you want to unblock "${confirm.investor?.name}"?`
              : confirm.action === 'delete'
              ? `Are you sure you want to delete "${confirm.investor?.name}"? This action cannot be undone.`
              : ''
            : ''
        }
        onConfirm={handleConfirm}
        onCancel={handleCancel}
      />
      <h2>Investors List</h2>
      <div className="table-search-bar">
        <div className="filter-group">
          <label htmlFor="search-input">Search:</label>
          <input
            id="search-input"
            type="text"
            placeholder="Search by name or policy number..."
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
            <th>Unique Policy</th>
            <th>Investor Name</th>
            <th>Investment (₦)</th>
            <th>Remaining Balance (₦)</th>
            <th>ROI Due (₦)</th>
            <th>Withdrawals (₦)</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {paginatedInvestors.length === 0 ? (
            <tr>
              <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#888' }}>
                No investors found.
              </td>
            </tr>
          ) : (
            paginatedInvestors.map((investor) => {
              if (!btnRefs.current[investor.id]) {
                btnRefs.current[investor.id] = React.createRef();
              }
              const btnRef = btnRefs.current[investor.id];
              const investmentAmount = investor.investmentAmount ? parseFloat(investor.investmentAmount) : 0;
              const remainingBalance = investor.remainingBalance ? parseFloat(investor.remainingBalance) : 0;

              return (
                <tr key={investor.id}>
                  <td data-label="Date">{formatDate(investor.date)}</td>
                  <td data-label="Unique Policy">{investor.uniquePolicy || 'N/A'}</td>
                  <td data-label="Investor Name">
                    <button
                      className="investor-name-btn"
                      onClick={() => onInvestorNameClick && onInvestorNameClick(investor)}
                      title={`View details for ${investor.name}`}
                    >
                      {investor.name}
                    </button>
                  </td>
                  <td data-label="Investment (₦)">
                    ₦{investmentAmount.toLocaleString()}
                  </td>
                  <td data-label="Remaining Balance (₦)">
                    ₦{remainingBalance.toLocaleString()}
                  </td>
                  <td data-label="ROI Due (₦)">
                    <div>
                      <div>₦{(investor.roiDue ?? 0).toLocaleString()}</div>
                      <div
                        className={
                          !investor.roiDueDate || investor.roiDueDate === 'N/A' || investor.roiDueDate === 'On Demand'
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
                        ({investor.roiDueDate || 'N/A'})
                      </div>
                    </div>
                  </td>
                  <td data-label="Withdrawals (₦)">
                    ₦{Array.isArray(investor.withdrawals)
                      ? investor.withdrawals.reduce((sum, w) => sum + (parseFloat(w.amount) || 0), 0).toLocaleString()
                      : 0}
                  </td>
                  <td data-label="Status">
                    <span
                      style={{
                        color:
                          investor.status === 'Blocked'
                            ? '#e63a27'
                            : investor.status === 'Active'
                            ? '#388e3c'
                            : '#888',
                        fontWeight: 600,
                      }}
                    >
                      {investor.status || 'Active'}
                    </span>
                  </td>
                  <td data-label="Actions" style={{ position: 'relative' }}>
                    <div className="hamburger-menu-wrapper" ref={openMenuId === investor.id ? menuRef : null}>
                      <button
                        ref={btnRef}
                        className="hamburger-btn"
                        aria-label="Show actions"
                        onClick={e => {
                          e.stopPropagation();
                          handleHamburgerClick(investor.id);
                        }}
                      >
                        <span className="hamburger-bar"></span>
                        <span className="hamburger-bar"></span>
                        <span className="hamburger-bar"></span>
                      </button>
                      {openMenuId === investor.id && (
                        <div
                          className={`hamburger-dropdown${dropdownUp ? ' dropdown-up' : ''}`}
                          onClick={e => e.stopPropagation()}
                        >
                          <button
                            className="dropdown-action-btn"
                            onClick={() => {
                              onRecordTransaction(investor);
                              setOpenMenuId(null);
                            }}
                          >
                            Record Transaction
                          </button>
                          <button
                            className={`dropdown-action-btn ${investor.kycStatus === 'Approved' ? 'kyc-approved' : ''}`}
                            onClick={() => {
                              onVerifyKYC(investor);
                              setOpenMenuId(null);
                            }}
                            title={`KYC Status: ${investor.kycStatus}`}
                          >
                            Verify KYC
                            {investor.kycStatus === 'Approved' && <span className="kyc-status-dot"></span>}
                          </button>
                          {investor.status !== 'Blocked' ? (
                            <button
                              className="dropdown-action-btn"
                              onClick={() => handleAction('block', investor)}
                            >
                              Block/Suspend
                            </button>
                          ) : (
                            <button
                              className="dropdown-action-btn"
                              onClick={() => handleAction('unblock', investor)}
                            >
                              Unblock
                            </button>
                          )}
                          <button
                            className="dropdown-action-btn"
                            onClick={() => {
                              if (onEditPolicy) {
                                // Find the primary policy for this investor
                                const primaryPolicy = investor.policies && investor.policies.length > 0 ? investor.policies[0] : null;
                                if (primaryPolicy) {
                                  onEditPolicy(primaryPolicy);
                                }
                              }
                              setOpenMenuId(null);
                            }}
                          >
                            Edit Policy
                          </button>
                          <button
                            className="dropdown-action-btn"
                            onClick={() => {
                              if (onTaxReport) {
                                onTaxReport(investor);
                              }
                              setOpenMenuId(null);
                            }}
                          >
                            Tax Report
                          </button>
                          <button
                            className="dropdown-action-btn"
                            style={{ color: '#e63a27' }}
                            onClick={() => handleAction('delete', investor)}
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

export default InvestmentTable;
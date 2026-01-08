// src/components/AdminDashboard/AdminDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useAdminApi from '../services/AdminApiService';
import InvestmentTable from './InvestmentTable';
import TransactionModal from './TransactionModal';
import TransactionForm from './TransactionForm';
import ROIPolicyTable from './ROIPolicyTable';
// import NotificationPanel from './NotificationPanel';
import KYCVerificationModal from './KYCVerificationModal';
import ActivityLog from './ActivityLog';
import Profile from './Profile';
import InvestorProfile from './InvestorProfile';
import CompanySettings from './CompanySettings';
import WithdrawalHistoryTable from './WithdrawalHistoryTable';
import StaffTable from './StaffTable';
import StaffProfile from './StaffProfile';
import EditStaffModal from './EditStaffModal';
import EditPolicyModal from './EditPolicyModal';
import TaxReportModal from './TaxReportModal';
import PotentialInvestors from './PotentialInvestors';
import AddUser from './AddUser';
import ActivityDashboard from './ActivityDashboard'; // ADD THIS IMPORT
import Loader from '../Loader';
import './AdminDashboard.css';
import WithdrawalManagement from './WithdrawalManagement';
import { calculateWHT, calculateInvestmentTaxes, formatCurrency } from '../../utils/nigerianTaxCalculator';


const AdminDashboard = () => {
  const { isAuthenticated, isLoading: authLoading, user, tenantData, logout } = useAuth();

  // console.log(user)
  // console.log(tenantData)
  const { fetchUsers, fetchActivityDashboard, deleteUser, fetchDashboard } = useAdminApi();
  const [activities, setActivities] = useState([]);
  const [activitiesLoading, setActivitiesLoading] = useState(true);

  const [activeSection, setActiveSection] = useState('Overview');
  const [showProfile, setShowProfile] = useState(false);
  const [showInvestorDetail, setShowInvestorDetail] = useState(false);
  const [showStaffDetail, setShowStaffDetail] = useState(false);
  const [selectedInvestor, setSelectedInvestor] = useState(null);
  const [selectedStaff, setSelectedStaff] = useState(null);
  const [isKYCModalOpen, setIsKYCModalOpen] = useState(false);
  const [isTransactionModalOpen, setIsTransactionModalOpen] = useState(false);
  const [isWithdrawalActionModalOpen, setIsWithdrawalActionModalOpen] = useState(false);
  const [isEditStaffModalOpen, setIsEditStaffModalOpen] = useState(false);
  const [isEditPolicyModalOpen, setIsEditPolicyModalOpen] = useState(false);
  const [isTaxReportModalOpen, setIsTaxReportModalOpen] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [selectedPolicy, setSelectedPolicy] = useState(null);
  const [selectedInvestorForTax, setSelectedInvestorForTax] = useState(null);
  const [investors, setInvestors] = useState([]);
  const [staff, setStaff] = useState([]);
  const [potentialInvestors, setPotentialInvestors] = useState([]);
  const [dashboardMetrics, setDashboardMetrics] = useState(null);
  const [notifications, setNotifications] = useState([
    {
      type: 'investment',
      message: 'New investment of ₦500,000 by Chinedu Okafor',
      details: `Investment Date: 2024-01-15 | Plan: Standard`,
      status: 'Successful',
      timestamp: '2024-01-15 09:00',
    },
    {
      type: 'roi',
      message: 'ROI of ₦16,500 available for Aisha Mohammed',
      details: `ROI Date: 2024-02-01 | Period: 1 Month`,
      status: 'Available',
      timestamp: '2024-02-01 10:00',
    },
  ]);
  const [usersLoading, setUsersLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);
  const [loggingOut, setLoggingOut] = useState(false);

  // Utility to create structured notifications
  const createNotification = (type, message, details, status) => ({
    type,
    message,
    details,
    status,
    timestamp: new Date().toISOString().slice(0, 16).replace('T', ' '),
  });

  // Fetch users and sort into categories - EXTRACTED TO SERVICE
  useEffect(() => {
    const loadUsers = async () => {
      if (!isAuthenticated) {
        setUsersLoading(false);
        return;
      }

      try {
        setUsersLoading(true);
        const { staff: sortedStaff, investors: sortedInvestors, potentialInvestors: sortedPotentialInvestors } = await fetchUsers();

        setStaff(sortedStaff);
        setInvestors(sortedInvestors);
        setPotentialInvestors(sortedPotentialInvestors);
      } catch (err) {
        console.error('Error in loadUsers:', err);
      } finally {
        setUsersLoading(false);
      }
    };

    loadUsers();
  }, [isAuthenticated, fetchUsers, refreshTrigger]);

  // Load activities for the sidebar ActivityLog
  useEffect(() => {
    let mounted = true;
    const loadActivities = async () => {
      if (!isAuthenticated) {
        if (mounted) {
          setActivities([]);
          setActivitiesLoading(false);
        }
        return;
      }

      setActivitiesLoading(true);
      try {
        const data = await fetchActivityDashboard('7d');
        if (!mounted) return;
        // API returns either { results: [...] } or an array — normalize to array of items
        const items = data?.activities || data?.results || data || [];
        setActivities(Array.isArray(items) ? items : []);
      } catch (err) {
        console.error('Error loading activities for sidebar:', err);
        if (mounted) setActivities([]);
      } finally {
        if (mounted) setActivitiesLoading(false);
      }
    };

    loadActivities();
    const interval = setInterval(loadActivities, 30000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [isAuthenticated, fetchActivityDashboard]);

  // Fetch dashboard metrics
  useEffect(() => {
    const loadDashboardMetrics = async () => {
      if (!isAuthenticated) {
        setDashboardMetrics(null);
        return;
      }

      try {
        const data = await fetchDashboard();
        setDashboardMetrics(data);
      } catch (err) {
        console.error('Error loading dashboard metrics:', err);
        setDashboardMetrics(null);
      }
    };

    loadDashboardMetrics();
  }, [isAuthenticated, fetchDashboard]);

  // Diagnostic logs for responsiveness
  useEffect(() => {
    const logScreenSize = () => {
      // console.log('AdminDashboard screen size:', window.innerWidth, 'x', window.innerHeight);
      // console.log('Active section:', activeSection);
    };

    logScreenSize();
    window.addEventListener('resize', logScreenSize);
    return () => window.removeEventListener('resize', logScreenSize);
  }, [activeSection]);

  if (authLoading || usersLoading) {
    return <Loader message="Loading dashboard data..." />;
  }

  // Don't render anything if not authenticated
  if (!isAuthenticated) {
    return null;
  }

  const handleTransaction = (transaction) => {
    const investorId = parseInt(transaction.investorId);
    const amount = parseFloat(transaction.amount);

    // Calculate taxes for ROI payouts
    let taxInfo = null;
    if (transaction.type === 'ROI Payout') {
      const investor = investors.find((i) => i.id === investorId);
      const annualIncome = investor?.annualIncome || 0;
      taxInfo = calculateInvestmentTaxes(amount, annualIncome);
    }

    setInvestors((prev) =>
      prev.map((investor) =>
        investor.id === investorId
          ? {
              ...investor,
              investments:
                transaction.type === 'Deposit'
                  ? [...investor.investments, { amount, date: new Date().toISOString().split('T')[0] }]
                  : investor.investments,
              withdrawals:
                transaction.type === 'Withdrawal'
                  ? [
                      ...investor.withdrawals,
                      {
                        amount,
                        date: new Date().toISOString().split('T')[0],
                        status: 'Pending',
                        reason: null,
                        taxInfo: null, // Regular withdrawals don't have tax calculations here
                      },
                    ]
                  : transaction.type === 'ROI Payout'
                  ? [
                      ...investor.withdrawals,
                      {
                        amount,
                        date: new Date().toISOString().split('T')[0],
                        status: 'Approved',
                        reason: 'ROI payout processed',
                        taxInfo, // Include tax information for ROI payouts
                      },
                    ]
                  : investor.withdrawals,
              roiDue: transaction.type === 'ROI Payout' ? investor.roiDue - amount : investor.roiDue,
              roiDueDate: transaction.type === 'Deposit' ? new Date().toISOString().split('T')[0] : investor.roiDueDate,
            }
          : investor
      )
    );

    const investor = investors.find((i) => i.id === investorId);

    // Create notification with tax information if applicable
    let notificationMessage = `New ${transaction.type.toLowerCase()} of ₦${amount.toLocaleString()} recorded for ${investor?.name}`;
    let notificationDetails = '';

    if (transaction.type === 'Deposit') {
      notificationDetails = `Investment Date: ${new Date().toISOString().split('T')[0]} | Plan: Standard`;
    } else if (transaction.type === 'Withdrawal') {
      notificationDetails = `Withdrawal Date: ${new Date().toISOString().split('T')[0]} | Method: Bank Transfer`;
    } else if (transaction.type === 'ROI Payout' && taxInfo) {
      notificationDetails = `ROI Date: ${new Date().toISOString().split('T')[0]} | Gross: ${formatCurrency(amount)} | WHT: ${formatCurrency(taxInfo.wht.whtAmount)} | Net: ${formatCurrency(taxInfo.netAfterAllTaxes)}`;
      notificationMessage += ` (After Tax Deductions)`;
    }

    setNotifications((prev) => [
      ...prev,
      createNotification(
        transaction.type === 'Deposit' ? 'investment' : transaction.type === 'Withdrawal' ? 'withdrawal' : 'roi',
        notificationMessage,
        notificationDetails,
        transaction.type === 'ROI Payout' ? 'Approved' : transaction.type === 'Withdrawal' ? 'Pending' : 'Successful'
      ),
    ]);
    setIsTransactionModalOpen(false);
  };

  const handleKYCUpdate = (investorId, status, notes) => {
    setInvestors((prev) =>
      prev.map((investor) => (investor.id === investorId ? { ...investor, kycStatus: status } : investor))
    );
    const investor = investors.find((i) => i.id === investorId);
    setNotifications((prev) => [
      ...prev,
      createNotification(
        'kyc',
        `KYC ${status.toLowerCase()} for ${investor?.name}`,
        `Submission Date: ${new Date().toISOString().split('T')[0]} | Notes: ${notes || 'No notes'}`,
        status
      ),
    ]);
    setIsKYCModalOpen(false);
  };

  const handleWithdrawalAction = (investorId, withdrawalIndex, action, reason) => {
    setInvestors((prev) =>
      prev.map((investor) =>
        investor.id === investorId
          ? {
              ...investor,
              withdrawals: investor.withdrawals.map((wd, idx) =>
                idx === withdrawalIndex
                  ? {
                      ...wd,
                      status: action,
                      reason: reason || (action === 'Approved' ? 'Approved per policy terms' : 'No reason provided'),
                    }
                  : wd
              ),
            }
          : investor
      )
    );
    const investor = investors.find((i) => i.id === investorId);
    setNotifications((prev) => [
      ...prev,
      createNotification(
        'withdrawal',
        `Withdrawal of ₦${investor.withdrawals[withdrawalIndex].amount} for ${investor.name} ${action.toLowerCase()}`,
        `Withdrawal Date: ${investor.withdrawals[withdrawalIndex].date} | Method: Bank Transfer | Reason: ${reason || 'No reason provided'}`,
        action
      ),
    ]);
    setIsWithdrawalActionModalOpen(false);
    setSelectedWithdrawal(null);
  };

  const handleStaffUpdate = (staffId, updatedData) => {
    setStaff((prev) =>
      prev.map((staffMember) =>
        staffMember.id === staffId ? { ...staffMember, ...updatedData } : staffMember
      )
    );
    setNotifications((prev) => [
      ...prev,
      createNotification('general', `Staff profile for ${updatedData.name} updated`, `Update Date: ${new Date().toISOString().split('T')[0]}`, 'Info'),
    ]);
    setIsEditStaffModalOpen(false);
  };

  const handlePotentialInvestorUpdate = (updatedInvestor) => {
    // Remove from potential investors
    setPotentialInvestors(prev => prev.filter(p => p.id !== updatedInvestor.id));
    // Add or update in investors
    setInvestors(prev => {
      const existingIndex = prev.findIndex(i => i.id === updatedInvestor.id);
      if (existingIndex > -1) {
        return prev.map((i, index) => index === existingIndex ? updatedInvestor : i);
      } else {
        return [...prev, updatedInvestor];
      }
    });
  };

  const handleEditPolicy = (policy) => {
    setSelectedPolicy(policy);
    setIsEditPolicyModalOpen(true);
  };

  const handlePolicyUpdate = (updatedPolicy) => {
    // Update the policy in the investors state
    setInvestors(prev => prev.map(investor => {
      if (investor.investments && investor.investments.length > 0) {
        const updatedInvestments = investor.investments.map(investment =>
          investment.id === updatedPolicy.id ? { ...investment, ...updatedPolicy } : investment
        );
        return { ...investor, investments: updatedInvestments };
      }
      return investor;
    }));

    setNotifications(prev => [
      ...prev,
      createNotification('general', `Policy ${updatedPolicy.policy_number} updated successfully`, '', 'Success'),
    ]);

    setIsEditPolicyModalOpen(false);
    setSelectedPolicy(null);
  };

  const handleDeleteInvestor = async (investorId) => {
    try {
      await deleteUser(investorId);
      // Remove from investors state
      setInvestors(prev => prev.filter(investor => investor.id !== investorId));
      // Add success notification
      const investor = investors.find(i => i.id === investorId);
      setNotifications(prev => [
        ...prev,
        createNotification('general', `Investor "${investor?.name}" deleted successfully`, '', 'Success'),
      ]);
    } catch (error) {
      console.error('Failed to delete investor:', error);
      // Add error notification
      setNotifications(prev => [
        ...prev,
        createNotification('error', 'Failed to delete investor', error.message, 'Error'),
      ]);
    }
  };

  const handleDeleteStaff = async (staffId) => {
    try {
      await deleteUser(staffId);
      // Remove from staff state
      setStaff(prev => prev.filter(staffMember => staffMember.id !== staffId));
      // Add success notification
      const staffMember = staff.find(s => s.id === staffId);
      setNotifications(prev => [
        ...prev,
        createNotification('general', `Staff "${staffMember?.name}" deleted successfully`, '', 'Success'),
      ]);
    } catch (error) {
      console.error('Failed to delete staff:', error);
      // Add error notification
      setNotifications(prev => [
        ...prev,
        createNotification('error', 'Failed to delete staff', error.message, 'Error'),
      ]);
    }
  };

  const openKYCModal = (investor) => {
    setSelectedInvestor(investor);
    setIsKYCModalOpen(true);
  };

  const openTransactionModal = (investor) => {
    setSelectedInvestor(investor);
    setIsTransactionModalOpen(true);
  };

  const openWithdrawalActionModal = (investor, withdrawalIndex) => {
    setSelectedInvestor(investor);
    setSelectedWithdrawal({ investorId: investor.id, withdrawalIndex });
    setIsWithdrawalActionModalOpen(true);
  };

  const openEditStaffModal = (staffMember) => {
    setSelectedStaff(staffMember);
    setIsEditStaffModalOpen(true);
  };

  const handleInvestorNameClick = (investor) => {
    setSelectedInvestor(investor);
    setShowInvestorDetail(true);
  };

  const handleTaxReportClick = (investor) => {
    setSelectedInvestorForTax(investor);
    setIsTaxReportModalOpen(true);
  };

  const handleStaffNameClick = (staffMember) => {
    setSelectedStaff(staffMember);
    setShowStaffDetail(true);
  };

  const handleBackToList = () => {
    setShowInvestorDetail(false);
    setShowStaffDetail(false);
    setSelectedInvestor(null);
    setSelectedStaff(null);
  };

  const handleLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setLoggingOut(false);
    }
  };

  const handleUserAdded = () => {
    setRefreshTrigger(prev => prev + 1);
  };

  const companyName = tenantData?.tenant_name || 'Rodrimine';

  // Helper function to format large numbers
  const formatNumber = (num) => {
    if (num >= 1000000000) {
      return (num / 1000000000).toFixed(2) + 'B';
    } else if (num >= 1000000) {
      return (num / 1000000).toFixed(2) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    } else {
      return num.toLocaleString();
    }
  };

  return (
    <div className="dashboard-container" style={{ backgroundImage: "url('https://images.unsplash.com/photo-1556742049-0cfed4f6a45d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80')" }}>
      <div style={{ display: 'flex', width: '100%' }}>
        <div className="sidebar">
          <div className="sidebar-header">
            <img src="https://rodrimine.com/assets/images/logo.jpg" alt="Company Logo" className="sidebar-logo" />
            <span className="sidebar-brand">{companyName.charAt(0).toUpperCase() + companyName.slice(1)} Admin</span>
          </div>
          <nav className="sidebar-nav">
            <ul>
              <li className={activeSection === 'Overview' ? 'active' : ''} onClick={() => setActiveSection('Overview')}>
                <span className="material-icons">dashboard</span> Overview
              </li>
              {/* ADD ACTIVITY DASHBOARD NAVIGATION ITEM */}
              <li className={activeSection === 'ActivityDashboard' ? 'active' : ''} onClick={() => setActiveSection('ActivityDashboard')}>
                <span className="material-icons">analytics</span> Activity Dashboard
              </li>

              <li className={activeSection === 'WithdrawalManagement' ? 'active' : ''} onClick={() => setActiveSection('WithdrawalManagement')}>
                <span className="material-icons">account_balance_wallet</span> Withdrawal Management
              </li>
              <li className={activeSection === 'Investors' ? 'active' : ''} onClick={() => setActiveSection('Investors')}>
                <span className="material-icons">people</span> Investors ({investors.length})
              </li>
              <li className={activeSection === 'Staff' ? 'active' : ''} onClick={() => setActiveSection('Staff')}>
                <span className="material-icons">group</span> Staff ({staff.length})
              </li>
              <li className={activeSection === 'AddUsers' ? 'active' : ''} onClick={() => setActiveSection('AddUsers')}>
                <span className="material-icons">person_add</span> Add Users
              </li>
              <li className={activeSection === 'Transactions' ? 'active' : ''} onClick={() => setActiveSection('Transactions')}>
                <span className="material-icons">swap_horiz</span> Transactions
              </li>
              <li className={activeSection === 'Statements' ? 'active' : ''} onClick={() => setActiveSection('Statements')}>
                <span className="material-icons">description</span> Statements
              </li>
              <li className={activeSection === 'WithdrawalHistory' ? 'active' : ''} onClick={() => setActiveSection('WithdrawalHistory')}>
                <span className="material-icons">account_balance_wallet</span> Withdrawal History
              </li>
              <li className={activeSection === 'PotentialInvestors' ? 'active' : ''} onClick={() => setActiveSection('PotentialInvestors')}>
                <span className="material-icons">person_add</span> Potential Investors ({potentialInvestors.length})
              </li>
              {/* <li className={activeSection === 'Notifications' ? 'active' : ''} onClick={() => setActiveSection('Notifications')}>
                <span className="material-icons">notifications</span> Notifications
              </li> */}
              <li className={activeSection === 'TaxReports' ? 'active' : ''} onClick={() => setActiveSection('TaxReports')}>
                <span className="material-icons">receipt</span> Tax Reports
              </li>
              <li className={activeSection === 'CompanySettings' ? 'active' : ''} onClick={() => setActiveSection('CompanySettings')}>
                <span className="material-icons">settings</span> Company Settings
              </li>
              
              {/* Logout option in sidebar */}
              <li 
                onClick={loggingOut ? undefined : handleLogout}
                style={{ 
                  marginTop: 'auto', 
                  borderTop: '1px solid rgba(0, 0, 0, 0.1)',
                  background: 'rgba(255, 98, 0, 0.1)',
                  cursor: loggingOut ? 'not-allowed' : 'pointer',
                  opacity: loggingOut ? 0.7 : 1,
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.35rem'
                }}
                aria-disabled={loggingOut}
              >
                {loggingOut ? (
                  <>
                    <span className="material-icons logout-spinner" style={{ color: '#ff6200' }}>autorenew</span>
                    <span style={{ color: '#ff6200', fontWeight: '600' }}>Logging out...</span>
                  </>
                ) : (
                  <>
                    <span className="material-icons" style={{ color: '#ff6200' }}>logout</span> 
                    <span style={{ color: '#ff6200', fontWeight: '500' }}>Log Out</span>
                  </>
                )}
              </li>
            </ul>
          </nav>
        </div>
        <div className="dashboard-main">
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <header className="dashboard-header">
              <img src="https://rodrimine.com/assets/images/logo.jpg" alt="Company Logo" className="dashboard-logo" />
              <span className="dashboard-brand">{companyName.charAt(0).toUpperCase() + companyName.slice(1)} Admin Dashboard</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginLeft: 'auto' }}>
                <div className="dashboard-profile" style={{ cursor: 'pointer' }} onClick={() => setShowProfile(true)}>
                  <span className="material-icons">account_circle</span>
                  <span>Admin</span>
                </div>
             
              </div>
            </header>
            <main className="dashboard-content">
              {activeSection === 'Overview' && (
                <>
                  <div className="dashboard-stats">
                    <div className="stat-card clickable" onClick={() => setActiveSection('Investors')} title="View Investors">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>people</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>Total Investors</h3>
                      <p style={{ fontSize: '0.9rem', margin: '0' }}>{investors.length}</p>
                    </div>
                    <div className="stat-card clickable" onClick={() => setActiveSection('Investors')} title="View Policy Amount">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>account_balance</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>POLICY AMOUNT</h3>
                      <p style={{ fontSize: '0.8rem', textAlign: 'center', margin: '0' }}>₦{formatNumber(dashboardMetrics?.metrics?.total_policy_amount || investors.reduce((sum, inv) => sum + (inv.investmentAmount || 0), 0))}</p>
                    </div>
                    <div className="stat-card clickable" onClick={() => setActiveSection('Statements')} title="View ROI Policy">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>trending_up</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>ROI POLICY</h3>
                      <p style={{ fontSize: '0.8rem', textAlign: 'center', margin: '0' }}>₦{formatNumber(dashboardMetrics?.metrics?.monthly_roi_liability || investors.reduce((sum, inv) => sum + (inv.roiDue || 0), 0))}</p>
                    </div>
                    <div className="stat-card clickable" onClick={() => setActiveSection('Staff')} title="View Staff">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>group</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>Staff Members </h3>
                      <p style={{ fontSize: '0.9rem', margin: '0' }}>{staff.length}</p>
                    </div>
                    <div className="stat-card clickable" onClick={() => setActiveSection('WithdrawalHistory')} title="View Withdrawal History">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>account_balance_wallet</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>Pending Withdrawals</h3>
                      <p style={{ fontSize: '0.9rem', margin: '0' }}>{investors.reduce((count, inv) => count + (inv.withdrawals?.filter((w) => w.status === 'Pending').length || 0), 0)}</p>
                    </div>
                    <div className="stat-card clickable" onClick={() => setActiveSection('PotentialInvestors')} title="View Potential Investors">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>person_add</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>Potential Investors</h3>
                      <p style={{ fontSize: '0.9rem', margin: '0' }}>{potentialInvestors.length}</p>
                    </div>
                    <div className="stat-card clickable" onClick={() => setActiveSection('AddUsers')} title="Add New User">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>add</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>Add New User</h3>
                    </div>
                    {/* <div className="stat-card clickable" onClick={() => setActiveSection('Notifications')} title="View Notifications">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>notifications</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>Notifications</h3>
                      <p style={{ fontSize: '0.9rem', margin: '0' }}>{notifications.length}</p>
                    </div> */}
                    {/* ADD ACTIVITY DASHBOARD STAT CARD */}
                    <div className="stat-card clickable" onClick={() => setActiveSection('ActivityDashboard')} title="View Activity Dashboard">
                      <span className="material-icons" style={{ fontSize: '1.2rem' }}>analytics</span>
                      <h3 style={{ fontSize: '0.7rem', margin: '0.5rem 0' }}>Activity Analytics</h3>
                    </div>
                    {/* END ADDITION */}
                  </div>
                  <section className="dashboard-section">
                    <h2 className="dashboard-section-title">
                      <span className="material-icons">people</span> Investors ({investors.length})
                    </h2>
                    {!showInvestorDetail ? (
                      <InvestmentTable
                        investors={investors}
                        onVerifyKYC={openKYCModal}
                        onRecordTransaction={openTransactionModal}
                        onInvestorNameClick={handleInvestorNameClick}
                        onDelete={handleDeleteInvestor}
                        onEditPolicy={handleEditPolicy}
                        onTaxReport={handleTaxReportClick}
                      />
                    ) : (
                      <InvestorProfile investor={selectedInvestor} onBack={handleBackToList} />
                    )}
                  </section>
                </>
              )}

              {/* ADD ACTIVITY DASHBOARD SECTION */}
              {activeSection === 'ActivityDashboard' && (
                <section className="dashboard-section">
                  <ActivityDashboard />
                </section>
              )}
              {/* END ADDITION */}

              {activeSection === 'WithdrawalManagement' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">account_balance_wallet</span> Withdrawal Management
                  </h2>
                  <WithdrawalManagement />
                </section>
              )}
              {activeSection === 'PotentialInvestors' && (
                <section className="dashboard-section">
                  <PotentialInvestors 
                    potentialInvestors={potentialInvestors} 
                    onInvestorUpdate={handlePotentialInvestorUpdate}
                  />
                </section>
              )}
              {activeSection === 'AddUsers' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">person_add</span> Add New User
                  </h2>
                  <AddUser onUserAdded={handleUserAdded} />
                </section>
              )}
              {/* {activeSection === 'Notifications' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">notifications</span> Notifications
                  </h2>
                  <NotificationPanel notifications={notifications} />
                </section>
              )} */}
              {activeSection === 'Investors' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">people</span> Investors ({investors.length})
                  </h2>
                  {!showInvestorDetail ? (
                    <InvestmentTable
                      investors={investors}
                      onVerifyKYC={openKYCModal}
                      onRecordTransaction={openTransactionModal}
                      onInvestorNameClick={handleInvestorNameClick}
                      onDelete={handleDeleteInvestor}
                      onEditPolicy={handleEditPolicy}
                      onTaxReport={handleTaxReportClick}
                    />
                  ) : (
                    <InvestorProfile investor={selectedInvestor} onBack={handleBackToList} />
                  )}
                </section>
              )}
              {activeSection === 'Staff' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">group</span> Staff ({staff.length})
                  </h2>
                  {!showStaffDetail ? (
                    <StaffTable staff={staff} onStaffNameClick={handleStaffNameClick} onDelete={handleDeleteStaff} />
                  ) : (
                    <StaffProfile staff={selectedStaff} onBack={handleBackToList} onEdit={() => openEditStaffModal(selectedStaff)} />
                  )}
                </section>
              )}
              {activeSection === 'Transactions' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">swap_horiz</span> Transactions
                  </h2>
                  <TransactionForm investors={investors} onSubmit={handleTransaction} />
                </section>
              )}
              {activeSection === 'Statements' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">description</span> Statements
                  </h2>
                  {!showInvestorDetail ? (
                    <ROIPolicyTable investors={investors} onInvestorNameClick={handleInvestorNameClick} />
                  ) : (
                    <InvestorProfile investor={selectedInvestor} onBack={handleBackToList} />
                  )}
                </section>
              )}
              {activeSection === 'WithdrawalHistory' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">account_balance_wallet</span> Withdrawal History
                  </h2>
                  {!showInvestorDetail ? (
                    <WithdrawalHistoryTable
                      investors={investors}
                      onInvestorNameClick={handleInvestorNameClick}
                      onWithdrawalAction={openWithdrawalActionModal}
                    />
                  ) : (
                    <InvestorProfile investor={selectedInvestor} onBack={handleBackToList} />
                  )}
                </section>
              )}
              {activeSection === 'TaxReports' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">receipt</span> Tax Reports
                  </h2>
                  <div className="tax-reports-content">
                    <p>Select an investor from the table below to generate their tax report:</p>
                    <InvestmentTable
                      investors={investors}
                      onVerifyKYC={openKYCModal}
                      onRecordTransaction={openTransactionModal}
                      onInvestorNameClick={handleInvestorNameClick}
                      onDelete={handleDeleteInvestor}
                      onEditPolicy={handleEditPolicy}
                      onTaxReport={handleTaxReportClick}
                    />
                  </div>
                </section>
              )}
              {activeSection === 'CompanySettings' && (
                <section className="dashboard-section">
                  <h2 className="dashboard-section-title">
                    <span className="material-icons">settings</span> Company Settings
                  </h2>
                  <CompanySettings />
                </section>
              )}
              {isKYCModalOpen && (
                <KYCVerificationModal investor={selectedInvestor} onClose={() => setIsKYCModalOpen(false)} onSubmit={handleKYCUpdate} />
              )}
              {isTransactionModalOpen && (
                <TransactionModal
                  investors={investors}
                  selectedInvestor={selectedInvestor}
                  onClose={() => setIsTransactionModalOpen(false)}
                  onSubmit={handleTransaction}
                />
              )}
              {isWithdrawalActionModalOpen && (
                <WithdrawalActionModal
                  investor={selectedInvestor}
                  withdrawal={selectedWithdrawal}
                  onClose={() => {
                    setIsWithdrawalActionModalOpen(false);
                    setSelectedWithdrawal(null);
                  }}
                  onSubmit={handleWithdrawalAction}
                />
              )}
              {isEditStaffModalOpen && (
                <EditStaffModal
                  staff={selectedStaff}
                  onClose={() => setIsEditStaffModalOpen(false)}
                  onSubmit={handleStaffUpdate}
                />
              )}
              {isEditPolicyModalOpen && (
                <EditPolicyModal
                  policy={selectedPolicy}
                  onClose={() => {
                    setIsEditPolicyModalOpen(false);
                    setSelectedPolicy(null);
                  }}
                  onUpdate={handlePolicyUpdate}
                />
              )}
              {isTaxReportModalOpen && (
                <TaxReportModal
                  investor={selectedInvestorForTax}
                  onClose={() => {
                    setIsTaxReportModalOpen(false);
                    setSelectedInvestorForTax(null);
                  }}
                />
              )}
            </main>
          </div>
          <ActivityLog activities={activities} />
        </div>
      </div>
      {showProfile && (
        <div
          className="profile-modal-overlay"
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.25)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              background: '#fff',
              borderRadius: 10,
              padding: 24,
              minWidth: 350,
              maxWidth: '95vw',
              maxHeight: '95vh',
              overflowY: 'auto',
              position: 'relative',
            }}
          >
            <button
              style={{
                position: 'absolute',
                top: 10,
                right: 10,
                background: 'transparent',
                border: 'none',
                fontSize: 22,
                cursor: 'pointer',
              }}
              onClick={() => setShowProfile(false)}
              aria-label="Close"
            >
              <span className="material-icons">close</span>
            </button>
            
            <div style={{ marginBottom: '1rem', textAlign: 'right' }}>
              <button 
                onClick={handleLogout}
                style={{
                  background: '#ff6200',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '0.5rem 1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.9rem'
                }}
              >
                <span className="material-icons" style={{ fontSize: '1.2rem' }}>logout</span>
                Log Out
              </button>
            </div>
            
            <Profile />
          </div>
        </div>
      )}
      <link href="https://fonts.googleapis.com/icon?family=Material+Icons" rel="stylesheet" />
    </div>
  );
};

export default AdminDashboard;
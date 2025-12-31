import React, { useState } from 'react';
import './UserDashboard.css';
import InvestmentOverview from './InvestmentOverview';
import ROIManagement from './ROIManagement';
import WithdrawalRequests from './WithdrawalRequests';
import StatementPage from './StatementPage';
import TaxReportModal from './TaxReportModal';
import NotificationPanel from './NotificationPanel';
import ProfilePage from './ProfilePage';
import { useAuth } from '../../contexts/AuthContext';

const pages = [
  { key: 'overview', label: 'Overview', component: <InvestmentOverview /> },
  { key: 'roi', label: 'ROI Management', component: <ROIManagement /> },
  { key: 'withdrawals', label: 'Withdrawal Requests', component: <WithdrawalRequests /> },
  { key: 'statements', label: 'Statements', component: <StatementPage /> },
  { key: 'tax', label: 'Tax Management', component: <TaxReportModal /> },
  { key: 'notifications', label: 'Notifications', component: <NotificationPanel /> },
  { key: 'profile', label: 'Profile', component: <ProfilePage /> },
];

const UserDashboard = () => {
  const [selected, setSelected] = useState('overview');
  const [showTaxModal, setShowTaxModal] = useState(false);
  const { logout, isAuthenticated, isLoading } = useAuth();

  // Don't render anything if not authenticated or still loading
  if (isLoading) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        fontSize: '1.2rem',
        color: '#666'
      }}>
        Loading...
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const handleNavigation = (key) => {
    if (key === 'tax') {
      setShowTaxModal(true);
    } else {
      setSelected(key);
      setShowTaxModal(false);
    }
  };

  const handleLogout = async () => {
    try {
      await logout();
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  const CurrentPage = pages.find(p => p.key === selected)?.component || <InvestmentOverview />;

  return (
    <div className="user-dashboard">
      <aside className="user-sidebar">
        <nav>
          {pages.map(page => (
            <button
              key={page.key}
              className={`nav-link ${selected === page.key ? 'active' : ''}`}
              onClick={() => handleNavigation(page.key)}
            >
              {page.label}
            </button>
          ))}
        </nav>
      </aside>
      <main className="user-main">
        <header className="user-header">
          <div className="header-content">
            <h1 className="dashboard-title">Investment Dashboard</h1>
            <button
              className="logout-btn-top"
              onClick={handleLogout}
            >
              {/* <span className="material-icons">logout</span> */}
             Logout
            </button>
          </div>
        </header>
        <div className="user-content">
          {CurrentPage}
        </div>
      </main>

      <TaxReportModal
        isOpen={showTaxModal}
        onClose={() => setShowTaxModal(false)}
      />
    </div>
  );
};

export default UserDashboard;
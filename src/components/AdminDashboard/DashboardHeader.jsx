import React from 'react';

const DashboardHeader = ({ onMenuToggle, currentView }) => {
  const viewTitles = {
    overview: 'Dashboard Overview',
    activities: 'Activity Logs',
    security: 'Security Monitoring',
    reports: 'Analytics Reports'
  };

  return (
    <header className="dashboard-header">
      <div className="header-left">
        <button 
          className="sidebar-toggle mobile"
          onClick={onMenuToggle}
          aria-label="Toggle menu"
        >
          <span className="material-icons">menu</span>
        </button>
        <div className="header-brand">
          <img src="/logo.png" alt="Logo" className="dashboard-logo" />
          <h1 className="dashboard-brand">Admin Dashboard</h1>
        </div>
        <h2 className="current-view-title">{viewTitles[currentView]}</h2>
      </div>
      
      <div className="dashboard-profile">
        <span className="material-icons">account_circle</span>
        <div className="profile-info">
          <span className="profile-name">Admin User</span>
          <span className="profile-role">System Administrator</span>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
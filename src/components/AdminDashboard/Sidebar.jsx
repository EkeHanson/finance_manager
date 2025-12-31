import React from 'react';

const Sidebar = ({ activeView, onViewChange, isOpen, onClose }) => {
  const menuItems = [
    { id: 'overview', label: 'Dashboard Overview', icon: 'dashboard' },
    { id: 'activities', label: 'Activity Logs', icon: 'list_alt' },
    { id: 'security', label: 'Security Monitoring', icon: 'security' },
    { id: 'reports', label: 'Analytics Reports', icon: 'analytics' },
    { id: 'investors', label: 'Investors', icon: 'people' },
    { id: 'staff', label: 'Staff', icon: 'group' },
    { id: 'transactions', label: 'Transactions', icon: 'swap_horiz' },
    { id: 'withdrawals', label: 'Withdrawal History', icon: 'account_balance_wallet' },
    { id: 'settings', label: 'Company Settings', icon: 'settings' }
  ];

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && (
        <div 
          className="sidebar-overlay"
          onClick={onClose}
        />
      )}
      
      <div className={`sidebar ${isOpen ? 'open' : ''}`}>
        <div className="sidebar-header">
          <img src="https://rodrimine.com/assets/images/logo.jpg" alt="Logo" className="sidebar-logo" />
          <span className="sidebar-brand">Rodrimine Admin</span>
          <button className="sidebar-toggle" onClick={onClose}>
            <span className="material-icons">close</span>
          </button>
        </div>
        
        <nav className="sidebar-nav">
          <ul>
            {menuItems.map(item => (
              <li 
                key={item.id}
                className={activeView === item.id ? 'active' : ''}
                onClick={() => {
                  onViewChange(item.id);
                  onClose();
                }}
              >
                <span className="material-icons">{item.icon}</span>
                {item.label}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </>
  );
};

export default Sidebar;
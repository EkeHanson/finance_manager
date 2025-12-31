import React, { useState } from 'react';
import './ActivityLog.css';

const ActivityLog = ({ activities = [] }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;


  // Map technical actions to user-friendly labels and descriptions
  const actionMap = {
    login: {
      label: 'Logged in',
      description: 'User logged in successfully.'
    },
    logout: {
      label: 'Logged out',
      description: 'User logged out.'
    },
    user_created: {
      label: 'Registered',
      description: 'A new user account was created.'
    },
    user_updated: {
      label: 'Profile Updated',
      description: 'User profile information was updated.'
    },
    password_reset_request: {
      label: 'Password Reset Requested',
      description: 'A password reset was requested.'
    },
    investment_created: {
      label: 'Investment Added',
      description: 'A new investment was created.'
    },
    withdrawal_requested: {
      label: 'Withdrawal Requested',
      description: 'A withdrawal was requested.'
    },
    document_uploaded: {
      label: 'Document Uploaded',
      description: 'A document was uploaded.'
    },
    api_request: {
      label: 'Viewed Data',
      description: 'User viewed or requested information.'
    },
    assignment: {
      label: 'Assignment Action',
      description: 'An assignment-related action occurred.'
    },
    edit: {
      label: 'Profile Edited',
      description: 'Profile or settings were edited.'
    },
    // Add more mappings as needed
  };

  const getActivityType = (action) => {
    // Hide 'Viewed Data' for api_request
    if (action === 'api_request') return '';
    return actionMap[action]?.label || 'Other Activity';
  };

  const getActivityDescription = (activity) => {
    const user = getActivityEmail(activity);
    let actionDesc = '';
    if (activity.action === 'api_request' && activity.details && activity.details.path) {
      if (activity.details.path.includes('/api/investments/policies')) {
        actionDesc = 'viewed investment policies';
      } else if (activity.details.path.includes('/api/user/users')) {
        actionDesc = 'viewed the user list';
      } else if (activity.details.path.includes('/api/investments/dashboard')) {
        actionDesc = 'viewed the investment dashboard';
      }
    }
    if (!actionDesc) {
      actionDesc = (actionMap[activity.action]?.description || 'performed an activity').replace(/\.$/, '').toLowerCase();
    }
    return `User ${user} ${actionDesc}.`;
  };

  const getActivityIcon = (action) => {
    const icons = {
      login: 'login',
      logout: 'logout',
      user_created: 'person_add',
      user_updated: 'edit',
      password_reset_request: 'vpn_key',
      investment_created: 'account_balance_wallet',
      withdrawal_requested: 'payment',
      document_uploaded: 'description'
    };
    return icons[action] || 'assignment';
  };

  const formatTime = (timestamp) => {
    if (!timestamp) return 'Unknown time';
    const date = new Date(timestamp);
    if (isNaN(date.getTime())) return timestamp;
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    return date.toLocaleString();
  };

  // Prefer explicit email fields returned by the API, fall back to nested objects or 'System'
  const getActivityEmail = (activity) => {
    if (!activity) return 'System';
    if (activity.user_email) return activity.user_email;
    if (typeof activity.user === 'object' && activity.user?.email) return activity.user.email;
    if (activity.performed_by_email) return activity.performed_by_email;
    if (typeof activity.performed_by === 'object' && activity.performed_by?.email) return activity.performed_by.email;
    return 'System';
  };

  const activityTypes = ['All', ...new Set(activities.map(a => getActivityType(a.action)).filter(Boolean))];


  // Remove duplicates: same action, user, and timestamp (to the minute)
  const dedupedActivities = [];
  const seen = new Set();
  for (const activity of activities) {
    const user = getActivityEmail(activity);
    const action = activity.action;
    const timestamp = activity.timestamp ? new Date(activity.timestamp) : null;
    // Use ISO string to the minute for deduplication
    const timeKey = timestamp ? timestamp.getFullYear() + '-' + (timestamp.getMonth()+1) + '-' + timestamp.getDate() + ' ' + timestamp.getHours() + ':' + timestamp.getMinutes() : '';
    const key = `${user}|${action}|${timeKey}`;
    if (!seen.has(key)) {
      seen.add(key);
      dedupedActivities.push(activity);
    }
  }


  // Filter after deduplication, then paginate
  const filteredActivities = dedupedActivities.filter(activity => {
    const matchesSearch = searchTerm === '' || 
      getActivityEmail(activity).toLowerCase().includes(searchTerm.toLowerCase()) ||
      getActivityType(activity.action).toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterType === 'All' || getActivityType(activity.action) === filterType;
    return matchesSearch && matchesFilter;
  });

  const totalPages = Math.ceil(filteredActivities.length / pageSize);
  const paginatedActivities = filteredActivities.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize
  );

  // Group activities by date (e.g., Today, Yesterday, or date string)
  const groupByDate = (activities) => {
    const groups = {};
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);
    const isSameDay = (d1, d2) => d1.getFullYear() === d2.getFullYear() && d1.getMonth() === d2.getMonth() && d1.getDate() === d2.getDate();
    activities.forEach((activity) => {
      const date = new Date(activity.timestamp);
      let label = date.toLocaleDateString();
      if (isSameDay(date, today)) label = 'Today';
      else if (isSameDay(date, yesterday)) label = 'Yesterday';
      if (!groups[label]) groups[label] = [];
      groups[label].push(activity);
    });
    return groups;
  };

  const groupedActivities = groupByDate(paginatedActivities);

  const handlePrev = () => setCurrentPage(prev => Math.max(prev - 1, 1));
  const handleNext = () => setCurrentPage(prev => Math.min(prev + 1, totalPages));
  const handlePageClick = (page) => setCurrentPage(page);

  return (
    <aside className="activity-log">
      <div className="activity-log-header">
        <h3 className="activity-log-title">
          <span className="material-icons">notifications</span>
          Live Activity Feed
        </h3>
        <span className="activity-count">{filteredActivities.length}</span>
      </div>

      <div className="activity-log-controls">
        <input
          type="text"
          placeholder="Search activities ..."
          value={searchTerm}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setCurrentPage(1);
          }}
          className="activity-search-input"
        />
        <select
          value={filterType}
          onChange={(e) => {
            setFilterType(e.target.value);
            setCurrentPage(1);
          }}
          className="activity-filter-select"
        >
          {activityTypes.map(type => (
            <option key={type} value={type}>{type}</option>
          ))}
        </select>
      </div>
      

      <div className="activity-log-list">
        {Object.keys(groupedActivities).length === 0 && (
          <div className="activity-log-empty">
            <span className="material-icons">notifications_off</span>
            <p>No activities match the current filters.</p>
          </div>
        )}
        {Object.entries(groupedActivities).map(([dateLabel, activities]) => (
          <div key={dateLabel} className="activity-log-date-group">
            <div className="activity-log-date-label">{dateLabel}</div>
            {activities.map((activity) => (
              <div
                key={activity.id ?? `${activity.action}-${Math.random()}`}
                className={`activity-log-item compact ${activity.success ? 'success' : 'failed'}`}
                style={{ boxShadow: '0 1px 3px 0 rgba(30,41,59,0.04)', border: 'none', marginBottom: '0.5rem', borderRadius: '8px', background: '#fff', padding: '0.6rem 0.4rem', minHeight: 'unset', alignItems: 'center' }}
              >
                <div className="activity-log-icon">
                  <span className="material-icons" style={{ fontSize: '1.5rem', background: activity.success ? '#e7fbe9' : '#fee2e2', color: activity.success ? '#22c55e' : '#ef4444', borderRadius: '50%', padding: '0.2rem' }}>{getActivityIcon(activity.action)}</span>
                </div>
                <div className="activity-log-content">
                  {getActivityType(activity.action) && (
                    <div className="activity-log-type" style={{ fontWeight: 600, fontSize: '0.97rem', color: '#003087', marginBottom: '0.03rem' }}>{getActivityType(activity.action)}</div>
                  )}
                  <div className="activity-log-description" style={{ color: '#475569', fontSize: '0.89rem', marginBottom: '0.05rem' }}>{getActivityDescription(activity)}</div>
                  <div className="activity-log-time" style={{ fontSize: '0.75rem', color: '#b0b7c3', marginTop: '0.03rem' }}>{formatTime(activity.timestamp)}</div>
                  {/* Tenant name removed for compactness and to hide 'appbrew' */}
                </div>
                {/* Status tick removed for compactness */}
              </div>
            ))}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <div className="activity-pagination">
          <button 
            className="pagination-btn" 
            onClick={handlePrev} 
            disabled={currentPage === 1}
          >
            &lt;
          </button>
          {[...Array(totalPages)].map((_, i) => (
            <button
              key={i}
              className={`pagination-btn ${currentPage === i + 1 ? 'active' : ''}`}
              onClick={() => handlePageClick(i + 1)}
            >
              {i + 1}
            </button>
          ))}
          <button 
            className="pagination-btn" 
            onClick={handleNext} 
            disabled={currentPage === totalPages}
          >
            &gt;
          </button>
        </div>
      )}
    </aside>
  );
};

export default ActivityLog;
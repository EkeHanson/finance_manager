import React, { useState } from 'react';

const UserActivityTable = ({ activities, title, showViewAll = false, showFilters = false, paginated = false }) => {
  const [filter, setFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const getActionIcon = (action) => {
    const icons = {
      login: 'login',
      logout: 'logout',
      user_created: 'person_add',
      user_updated: 'edit',
      document_uploaded: 'upload',
      password_reset_request: 'vpn_key',
      investment_created: 'attach_money',
      withdrawal_requested: 'money_off'
    };
    return icons[action] || 'info';
  };

  const getStatusColor = (success) => {
    return success ? '#00a86b' : '#dc3545';
  };

  const filteredActivities = activities?.filter(activity => {
    if (filter === 'all') return true;
    if (filter === 'success') return activity.success;
    if (filter === 'failed') return !activity.success;
    return activity.action === filter;
  }) || [];

  const paginatedActivities = paginated 
    ? filteredActivities.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
    : filteredActivities.slice(0, 10);

  const totalPages = Math.ceil(filteredActivities.length / itemsPerPage);

  return (
    <div className="user-activity-table">
      <div className="table-header">
        <h3 className="dashboard-section-title">
          <span className="material-icons">list_alt</span>
          {title || 'User Activities'}
        </h3>
        
        {showFilters && (
          <div className="table-filters">
            <select 
              value={filter} 
              onChange={(e) => setFilter(e.target.value)}
              className="filter-select"
            >
              <option value="all">All Activities</option>
              <option value="success">Successful</option>
              <option value="failed">Failed</option>
              <option value="login">Logins</option>
              <option value="user_created">User Creation</option>
            </select>
          </div>
        )}
        
        {showViewAll && (
          <button className="btn btn-outline">
            View All Activities
            <span className="material-icons">arrow_forward</span>
          </button>
        )}
      </div>

      <div className="table-container">
        <table className="activity-table">
          <thead>
            <tr>
              <th>Action</th>
              <th>User</th>
              <th>Timestamp</th>
              <th>IP Address</th>
              <th>Status</th>
              <th>Details</th>
            </tr>
          </thead>
          <tbody>
            {paginatedActivities.map((activity, index) => (
              <tr key={index} className="activity-row">
                <td>
                  <div className="action-cell">
                    <span className="material-icons action-icon">
                      {getActionIcon(activity.action)}
                    </span>
                    {activity.action.replace(/_/g, ' ')}
                  </div>
                </td>
                <td>
                  {activity.user?.email || 
                   activity.performed_by?.email || 
                   'System'}
                </td>
                <td>
                  {new Date(activity.timestamp).toLocaleString()}
                </td>
                <td>{activity.ip_address || 'N/A'}</td>
                <td>
                  <span 
                    className="status-badge"
                    style={{ backgroundColor: getStatusColor(activity.success) }}
                  >
                    {activity.success ? 'Success' : 'Failed'}
                  </span>
                </td>
                <td>
                  <button 
                    className="btn-icon"
                    title="View Details"
                    onClick={() => console.log('View details:', activity)}
                  >
                    <span className="material-icons">visibility</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {paginatedActivities.length === 0 && (
          <div className="empty-state">
            <span className="material-icons">inbox</span>
            <p>No activities found</p>
          </div>
        )}
      </div>

      {paginated && totalPages > 1 && (
        <div className="table-pagination">
          <button 
            disabled={currentPage === 1}
            onClick={() => setCurrentPage(currentPage - 1)}
            className="pagination-btn"
          >
            Previous
          </button>
          
          <span className="pagination-info">
            Page {currentPage} of {totalPages}
          </span>
          
          <button 
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage(currentPage + 1)}
            className="pagination-btn"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
};

export default UserActivityTable;
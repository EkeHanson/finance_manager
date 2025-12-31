import React from 'react';

const SystemHealth = ({ healthData }) => {
  if (!healthData) return null;

  const getStatusIcon = (status) => {
    const icons = {
      healthy: 'check_circle',
      degraded: 'info',
      unhealthy: 'error'
    };
    return icons[status] || 'help';
  };

  const getStatusColor = (status) => {
    const colors = {
      healthy: '#00a86b',
      degraded: '#ffc107',
      unhealthy: '#dc3545'
    };
    return colors[status] || '#6c757d';
  };

  return (
    <div className="system-health">
      <h3 className="dashboard-section-title">
        <span className="material-icons">monitor_heart</span>
        System Health
      </h3>
      
      <div className="health-status-card">
        <div 
          className="health-status-header"
          style={{ borderLeftColor: getStatusColor(healthData.system_status) }}
        >
          <span 
            className="material-icons status-icon"
            style={{ color: getStatusColor(healthData.system_status) }}
          >
            {getStatusIcon(healthData.system_status)}
          </span>
          <div className="status-info">
            <h4>System Status: {healthData.system_status}</h4>
            <p>Last updated: {new Date(healthData.timestamp).toLocaleString()}</p>
          </div>
        </div>
        
        <div className="health-metrics">
          <div className="health-metric">
            <span className="metric-label">Error Rate</span>
            <span 
              className="metric-value"
              style={{ 
                color: healthData.metrics.recent_error_rate > 10 ? '#dc3545' : '#00a86b'
              }}
            >
              {healthData.metrics.recent_error_rate}%
            </span>
          </div>
          <div className="health-metric">
            <span className="metric-label">Login Failure Rate</span>
            <span 
              className="metric-value"
              style={{ 
                color: healthData.metrics.login_failure_rate > 30 ? '#dc3545' : '#00a86b'
              }}
            >
              {healthData.metrics.login_failure_rate}%
            </span>
          </div>
          <div className="health-metric">
            <span className="metric-label">Activity Trend</span>
            <span className="metric-value">{healthData.metrics.activity_trend}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SystemHealth;
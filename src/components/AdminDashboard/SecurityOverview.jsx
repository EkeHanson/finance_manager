import React from 'react';

const SecurityOverview = ({ securityEvents, stats, expanded = false }) => {
  // Debug logging
  // console.log('🔍 SecurityOverview props:', { 
  //   securityEvents, 
  //   stats,
  //   hasSecurityEvents: !!securityEvents,
  //   securityEventsLength: securityEvents?.length 
  // });

  const getSecurityLevel = (failureRate) => {
    if (failureRate < 5) return { level: 'low', label: 'Secure', color: '#00a86b' };
    if (failureRate < 15) return { level: 'medium', label: 'Moderate', color: '#ffc107' };
    return { level: 'high', label: 'At Risk', color: '#dc3545' };
  };

  const securityLevel = getSecurityLevel(stats?.summary_metrics?.login_failure_rate || 0);

  // Handle case where securityEvents might be undefined or null
  const safeSecurityEvents = securityEvents || [];

  return (
    <div className="security-overview">
      <h3 className="dashboard-section-title">
        <span className="material-icons">security</span>
        Security Overview
        {safeSecurityEvents.length > 0 && (
          <span className="event-count">({safeSecurityEvents.length} events)</span>
        )}
      </h3>
      
      <div className="security-status">
        <div className="security-level" style={{ color: securityLevel.color }}>
          <span className="material-icons">shield</span>
          <span>Security Status: {securityLevel.label}</span>
        </div>
        <div className="security-metrics">
          <div className="security-metric">
            <span className="metric-value">{stats?.summary_metrics?.failed_logins || 0}</span>
            <span className="metric-label">Failed Logins</span>
          </div>
          <div className="security-metric">
            <span className="metric-value">{stats?.summary_metrics?.security_events || 0}</span>
            <span className="metric-label">Security Events</span>
          </div>
        </div>
      </div>

      {expanded && safeSecurityEvents.length > 0 ? (
        <div className="security-events-list">
          <h4>Recent Security Events</h4>
          {safeSecurityEvents.slice(0, 10).map((event, index) => (
            <div key={event.id || index} className="security-event-item">
              <div className="event-type">{event.action}</div>
              <div className="event-user">{event.user_email || event.performed_by_email || 'System'}</div>
              <div className="event-time">
                {new Date(event.timestamp).toLocaleDateString()}
              </div>
              <div className={`event-status ${event.success ? 'success' : 'failed'}`}>
                {event.success ? 'Success' : 'Failed'}
              </div>
            </div>
          ))}
        </div>
      ) : expanded && safeSecurityEvents.length === 0 ? (
        <div className="no-events-message">
          No security events found for the selected period.
        </div>
      ) : null}
    </div>
  );
};

export default SecurityOverview;
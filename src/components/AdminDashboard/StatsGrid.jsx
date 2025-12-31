import React from 'react';
import StatCard from './StatCard';

const StatsGrid = ({ stats, timeRange, onTimeRangeChange }) => {
  const timeRangeOptions = [
    { value: '24h', label: '24 Hours' },
    { value: '7d', label: '7 Days' },
    { value: '30d', label: '30 Days' },
    { value: '90d', label: '90 Days' }
  ];

  if (!stats) return null;

  const { summary_metrics, activities_by_type = [] } = stats;

  const statCards = [
    {
      title: 'Total Activities',
      value: summary_metrics?.total_activities || 0,
      icon: 'activity',
      trend: '+12%',
      color: '#003087'
    },
    {
      title: 'Success Rate',
      value: `${summary_metrics?.success_rate || 0}%`,
      icon: 'check_circle',
      trend: '+2%',
      color: '#00a86b'
    },
    {
      title: 'Active Users',
      value: summary_metrics?.active_users || 0,
      icon: 'people',
      trend: '+5%',
      color: '#ff6200'
    },
    {
      title: 'Security Events',
      value: summary_metrics?.security_events || 0,
      icon: 'security',
      trend: '-3%',
      color: '#dc3545'
    },
    {
      title: 'Failed Logins',
      value: summary_metrics?.failed_logins || 0,
      icon: 'warning',
      trend: '+8%',
      color: '#ffc107'
    },
    {
      title: 'Top Action',
      value: activities_by_type[0]?.action || 'N/A',
      icon: 'trending_up',
      subtitle: `${activities_by_type[0]?.count || 0} times`,
      color: '#6f42c1'
    }
  ];

  return (
    <div className="stats-section">
      <div className="section-header">
        <h2 className="dashboard-section-title">
          <span className="material-icons">insights</span>
          Key Metrics
        </h2>
        <div className="time-range-selector">
          {timeRangeOptions.map(option => (
            <button
              key={option.value}
              className={`time-range-btn ${timeRange === option.value ? 'active' : ''}`}
              onClick={() => onTimeRangeChange(option.value)}
            >
              {option.label}
            </button>
          ))}
        </div>
      </div>
      
      <div className="dashboard-stats">
        {statCards.map((stat, index) => (
          <StatCard
            key={index}
            title={stat.title}
            value={stat.value}
            icon={stat.icon}
            trend={stat.trend}
            subtitle={stat.subtitle}
            color={stat.color}
          />
        ))}
      </div>
    </div>
  );
};

export default StatsGrid;
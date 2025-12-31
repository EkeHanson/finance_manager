import React from 'react';

const StatCard = ({ title, value, icon, trend, subtitle, color }) => {
  const getIcon = (iconName) => {
    const icons = {
      activity: 'show_chart',
      check_circle: 'check_circle',
      people: 'people',
      security: 'security',
      warning: 'warning',
      trending_up: 'trending_up'
    };
    return icons[icon] || 'info';
  };

  const isPositiveTrend = trend?.startsWith('+');
  const isNegativeTrend = trend?.startsWith('-');

  return (
    <div className="stat-card clickable" style={{ borderLeft: `4px solid ${color}` }}>
      <div className="stat-card-header">
        <span className="material-icons" style={{ color }}>
          {getIcon(icon)}
        </span>
        {trend && (
          <span className={`trend-indicator ${
            isPositiveTrend ? 'positive' : isNegativeTrend ? 'negative' : 'neutral'
          }`}>
            {trend}
          </span>
        )}
      </div>
      
      <div className="stat-card-content">
        <h3 className="stat-value" style={{ color }}>
          {value}
        </h3>
        <p className="stat-title">{title}</p>
        {subtitle && <p className="stat-subtitle">{subtitle}</p>}
      </div>
    </div>
  );
};

export default StatCard;
import React from 'react';

const ActivityCharts = ({ data, timeRange }) => {
  if (!data) return null;

  const { daily_activity_trend = [], activities_by_type = [] } = data;

  // Simple chart implementation - in real app, use Chart.js or similar
  const renderBarChart = (items, title) => {
    const maxValue = Math.max(...items.map(item => item.count || 0));
    
    return (
      <div className="chart-container">
        <h4>{title}</h4>
        <div className="bar-chart">
          {items.slice(0, 8).map((item, index) => (
            <div key={index} className="bar-item">
              <div className="bar-label">
                {item.action ? item.action.replace('_', ' ') : item.date}
              </div>
              <div className="bar-track">
                <div 
                  className="bar-fill"
                  style={{ 
                    width: `${((item.count || 0) / maxValue) * 100}%`,
                    backgroundColor: getColorForIndex(index)
                  }}
                ></div>
              </div>
              <div className="bar-value">{item.count || 0}</div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const getColorForIndex = (index) => {
    const colors = ['#003087', '#ff6200', '#00a86b', '#6f42c1', '#ffc107', '#dc3545', '#20c997', '#0dcaf0'];
    return colors[index % colors.length];
  };

  return (
    <div className="activity-charts">
      <h3 className="dashboard-section-title">
        <span className="material-icons">bar_chart</span>
        Activity Analytics
      </h3>
      
      <div className="charts-grid">
        <div className="chart-card">
          {renderBarChart(activities_by_type, 'Activities by Type')}
        </div>
        
        <div className="chart-card">
          {renderBarChart(daily_activity_trend, 'Daily Activity Trend')}
        </div>
      </div>
    </div>
  );
};

export default ActivityCharts;
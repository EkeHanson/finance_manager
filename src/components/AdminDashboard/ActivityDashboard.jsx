import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import useAdminApi from '../services/AdminApiService';
import StatsGrid from './StatsGrid';
import ActivityCharts from './ActivityCharts';
import SecurityOverview from './SecurityOverview';
import SystemHealth from './SystemHealth';
import UserActivityTable from './UserActivityTable.jsx';
import './ActivityDashboard.css';

const ActivityDashboard = () => {
  const { fetchActivityDashboard } = useAdminApi();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');
  const [error, setError] = useState(null);

  const loadDashboard = async () => {
    setLoading(true);
    setError(null);
    // console.log('🔄 Loading dashboard data for time range:', timeRange);
    
    try {
      const data = await fetchActivityDashboard(timeRange);
      // console.log('📊 Dashboard data loaded successfully');
      // console.log('🔒 Security events:', data?.security);
      // console.log('📈 Stats:', data?.stats);
      // console.log('📋 Activities:', data?.activities);
      // console.log('❤️ Health:', data?.health);
      
      // Check if we got actual data or mock data
      if (data && data.stats && data.stats.summary_metrics) {
        // console.log('✅ Using real API data');
      } else {
        console.log('⚠️ Using mock data - API might have failed');
      }
      
      setDashboardData(data);
    } catch (err) {
      console.error('❌ Failed to load dashboard data:', err);
      setError(err.message || 'Failed to load dashboard data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadDashboard();

    const interval = setInterval(loadDashboard, 30000); // Poll every 30 seconds for real-time updates

    return () => clearInterval(interval);
  }, [timeRange, fetchActivityDashboard]);

  const handleRetry = () => {
    loadDashboard();
  };

  if (loading) {
    return (
      <div className="loading-container">
        <div className="loading-spinner"></div>
        <p>Loading activity data...</p>
        <p className="loading-subtext">Fetching from security overview endpoint...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="error-container">
        <div className="error-icon">⚠️</div>
        <h3>Failed to Load Dashboard</h3>
        <p>{error}</p>
        <button onClick={handleRetry} className="retry-button">
          Retry Loading
        </button>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="error-container">
        <div className="error-icon">📊</div>
        <h3>No Data Available</h3>
        <p>Unable to load dashboard data. Please check your connection and try again.</p>
        <button onClick={handleRetry} className="retry-button">
          Try Again
        </button>
      </div>
    );
  }

  return (
    <div className="activity-dashboard">
      <div className="dashboard-header">
        <h2>Activity Dashboard</h2>
        <div className="dashboard-controls">
          <span>Time Range: </span>
          <select 
            value={timeRange} 
            onChange={(e) => setTimeRange(e.target.value)}
            className="time-range-select"
          >
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
          </select>
          <button onClick={loadDashboard} className="refresh-button">
            <span className="material-icons">refresh</span>
            Refresh
          </button>
        </div>
      </div>

      <StatsGrid 
        stats={dashboardData?.stats} 
        timeRange={timeRange}
        onTimeRangeChange={setTimeRange}
      />
      
      <div className="charts-row">
        <ActivityCharts 
          data={dashboardData?.stats} 
          timeRange={timeRange}
        />
        <SecurityOverview 
          securityEvents={dashboardData?.security}
          stats={dashboardData?.stats}
          expanded={true}
        />
      </div>
      
      <SystemHealth healthData={dashboardData?.health} />
      
      <UserActivityTable 
        activities={dashboardData?.activities}
        title="Recent Activities"
        showViewAll={true}
      />

      {/* Debug information - only show in development */}
      {process.env.NODE_ENV === 'development' && (
        <div className="debug-panel" style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: '#f5f5f5', 
          borderRadius: '8px',
          fontSize: '12px'
        }}>
          <h4>Debug Information</h4>
          <div><strong>Time Range:</strong> {timeRange}</div>
          <div><strong>Security Events Count:</strong> {dashboardData?.security?.length || 0}</div>
          <div><strong>Activities Count:</strong> {dashboardData?.activities?.length || 0}</div>
          <div><strong>Has Stats:</strong> {dashboardData?.stats ? 'Yes' : 'No'}</div>
          <div><strong>Has Health:</strong> {dashboardData?.health ? 'Yes' : 'No'}</div>
          <button 
            onClick={() => {
              console.log('Full dashboard data:', dashboardData);
              console.log('Security events detail:', dashboardData?.security);
            }}
            style={{ 
              marginTop: '10px', 
              padding: '5px 10px', 
              background: '#007bff', 
              color: 'white', 
              border: 'none', 
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            Log Full Data to Console
          </button>
        </div>
      )}
    </div>
  );
};

export default ActivityDashboard;
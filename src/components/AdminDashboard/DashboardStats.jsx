import React, { useState, useEffect } from 'react';
import Sidebar from './Sidebar';
import ActivityLog from './ActivityLog';
import DashboardHeader from './DashboardHeader';
import StatsGrid from './StatsGrid';
import ActivityCharts from './ActivityCharts';
import SecurityOverview from './SecurityOverview';
import UserActivityTable from './UserActivityTable.jsx';
import SystemHealth from './SystemHealth';
import './Dashboard.css';

const Dashboard = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState('overview');
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('7d');

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('authToken');
      
      const [statsRes, activitiesRes, securityRes, healthRes] = await Promise.all([
        fetch(`/api/user/user-activities/dashboard-stats/?days=${getDaysFromRange(timeRange)}`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/user/user-activities/?limit=10&ordering=-timestamp`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/user/user-activities/security-events/?days=7&limit=5`, {
          headers: { 'Authorization': `Bearer ${token}` }
        }),
        fetch(`/api/user/user-activities/system-health/`, {
          headers: { 'Authorization': `Bearer ${token}` }
        })
      ]);

      const [stats, activities, security, health] = await Promise.all([
        statsRes.json(),
        activitiesRes.json(),
        securityRes.json(),
        healthRes.json()
      ]);

      setDashboardData({
        stats,
        activities: activities.results || activities,
        security: security.results || security,
        health
      });
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const getDaysFromRange = (range) => {
    const ranges = {
      '24h': 1,
      '7d': 7,
      '30d': 30,
      '90d': 90
    };
    return ranges[range] || 7;
  };

  const renderMainContent = () => {
    if (loading) {
      return (
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Loading dashboard data...</p>
        </div>
      );
    }

    switch (activeView) {
      case 'overview':
        return (
          <div className="overview-content">
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
              />
            </div>
            <SystemHealth healthData={dashboardData?.health} />
            <UserActivityTable 
              activities={dashboardData?.activities}
              title="Recent Activities"
              showViewAll={true}
            />
          </div>
        );
      
      case 'activities':
        return (
          <div className="activities-view">
            <div className="view-header">
              <h2>Activity Logs</h2>
              <div className="view-actions">
                <button className="btn btn-primary">
                  <span className="material-icons">download</span>
                  Export
                </button>
              </div>
            </div>
            <UserActivityTable 
              activities={dashboardData?.activities}
              showFilters={true}
              paginated={true}
            />
          </div>
        );
      
      case 'security':
        return (
          <div className="security-view">
            <div className="view-header">
              <h2>Security Monitoring</h2>
            </div>
            <SecurityOverview 
              securityEvents={dashboardData?.security}
              stats={dashboardData?.stats}
              expanded={true}
            />
          </div>
        );
      
      case 'reports':
        return (
          <div className="reports-view">
            <div className="view-header">
              <h2>Analytics Reports</h2>
            </div>
            <div className="reports-grid">
              <div className="report-card">
                <h3>User Activity Report</h3>
                <p>Detailed analysis of user behavior and system usage</p>
                <button className="btn btn-outline">Generate Report</button>
              </div>
              <div className="report-card">
                <h3>Security Audit</h3>
                <p>Comprehensive security events and threat analysis</p>
                <button className="btn btn-outline">Generate Report</button>
              </div>
            </div>
          </div>
        );
      
      default:
        return <div>Select a view from the sidebar</div>;
    }
  };

  return (
    <div className="dashboard-container">
      <Sidebar 
        activeView={activeView}
        onViewChange={setActiveView}
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      />
      
      <main className="dashboard-main">
        <DashboardHeader 
          onMenuToggle={() => setSidebarOpen(!sidebarOpen)}
          currentView={activeView}
        />
        
        <div className="dashboard-content">
          {renderMainContent()}
        </div>
      </main>

      <ActivityLog activities={dashboardData?.activities} />
    </div>
  );
};

export default Dashboard;
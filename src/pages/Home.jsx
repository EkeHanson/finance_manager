
import React, { useState, useEffect } from 'react';
import './Home.css';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';

const Home = () => {
  const [user, setUser] = useState({
    name: 'Investor',
    role: 'Investor',
    investment: 500000,
    roi: 16500,
    withdrawals: 10000,
    notifications: ['New investment recorded', 'ROI available: ₦16,500']
  });

  useEffect(() => {
    const role = localStorage.getItem('userRole') || 'Investor';
    setUser(prev => ({ ...prev, role }));
  }, []);

  const navigate = useNavigate();
  const handleAction = (action) => {
    if (action === 'Book Demo') {
      navigate('/demo');
      return;
    }
    alert(`Initiating ${action}...`);
    // Integrate with backend API here
  };

  const isAdmin = user.role === 'Admin';

  return (

    <div className="home-container" role="main" aria-label="appBrew Home">
      <Navbar/>
      <header className="home-header" style={{ backgroundImage: 'url(https://images.unsplash.com/photo-1552664730-d307ca884978?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80)' }}>
        <h1 className="home-title">Welcome to appBrew</h1>
        <p className="home-subtitle">Empowering Loan Management with Innovative Solutions</p>
        <button className="home-cta" onClick={() => handleAction('Get Started')} aria-label="Get Started">
          Get Started
        </button>
      </header>
      <section className="home-services" aria-label="Our Services">
        <h2>How We Help You Succeed</h2>
        <div className="service-cards">
          <div className="service-card" onClick={() => handleAction('Investor Onboarding')}>
            <h3>Investor Onboarding</h3>
            <p>Streamlined form and auto-account creation.</p>
          </div>
          <div className="service-card" onClick={() => handleAction('Investment Management')}>
            <h3>Investment Management</h3>
            <p>Track deposits, withdrawals, and ROI payouts.</p>
          </div>
          <div className="service-card" onClick={() => handleAction('ROI Calculation')}>
            <h3>ROI Calculation</h3>
            <p>Accurate 3.3% monthly and 40% annual ROI.</p>
          </div>
        </div>
      </section>
      <section className="home-benefits" aria-label="Why Choose Us">
        <h2>Why Trust appBrew</h2>
        <ul className="benefit-list">
          <li>Seamless Integration with rodrimine.com</li>
          <li>Secure and User-Friendly Interface</li>
          <li>Automated Reports and Notifications</li>
          <li>Comprehensive Audit Trail</li>
        </ul>
      </section>
      <section className="home-dashboard" aria-label="Investment Dashboard">
        <h2>Your Control Center</h2>
        <div className="dashboard-stats">
          <div className="stat-card">
            <span>Total Investment</span>
            <p>₦{user.investment.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <span>Accrued ROI</span>
            <p>₦{user.roi.toLocaleString()}</p>
          </div>
          <div className="stat-card">
            <span>Withdrawals</span>
            <p>₦{user.withdrawals.toLocaleString()}</p>
          </div>
        </div>
      </section>
      <section className="home-footer" aria-label="Notifications and Actions">
        <div className="home-footer-inner">
          <div className="home-notifications">
            <h2>Stay Informed</h2>
            <ul className="notification-list">
              {user.notifications.map((msg, index) => (
                <li key={index} className="notification-item">{msg}</li>
              ))}
            </ul>
          </div>
          <div className="home-actions">
            <h2>Take Action Now</h2>
            <div className="action-buttons">
              <button onClick={() => handleAction('Book Demo')} aria-label="Book Demo Session">Book a Demo Session</button>
              {isAdmin && <button onClick={() => handleAction('Admin Dashboard')} aria-label="Admin Dashboard">Admin Dashboard</button>}
              <button onClick={() => handleAction('View Statement')} aria-label="View Statement">View Statement</button>
              <button onClick={() => handleAction('Contact Us')} aria-label="Contact Us">Contact Us</button>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;

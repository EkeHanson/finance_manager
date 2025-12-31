import React, { useState, useEffect } from 'react';
import './NotificationPanel.css';

const mockFetchNotifications = () =>
  new Promise(resolve => {
    setTimeout(() => {
      resolve([
        {
          id: 1,
          type: 'ROI Update',
          message: 'ROI of ₦3,333.33 has been accrued for policy 200000',
          date: '2025-09-20',
          status: 'Unread',
        },
        {
          id: 2,
          type: 'Withdrawal Status',
          message: 'Your withdrawal request WR001 for ₦2,000 (ROI) is now approved',
          date: '2025-09-19',
          status: 'Read',
        },
        {
          id: 3,
          type: 'KYC Status',
          message: 'Your KYC submission KYC001 is under review',
          date: '2025-09-18',
          status: 'Unread',
        },
        {
          id: 4,
          type: 'Investment Reminder',
          message: 'Next ROI due date for policy 200001 is approaching',
          date: '2025-09-15',
          status: 'Read',
        },
      ]);
    }, 400);
  });

const NotificationPanel = () => {
  const [notifications, setNotifications] = useState(null);
  const [message, setMessage] = useState('');

  useEffect(() => {
    mockFetchNotifications().then(data => setNotifications(data));
  }, []);

  const handleMarkAsRead = (id) => {
    setNotifications(prev =>
      prev.map(notif =>
        notif.id === id ? { ...notif, status: 'Read' } : notif
      )
    );
    setMessage('Notification marked as read');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleClearAll = () => {
    setNotifications(prev => prev.filter(notif => notif.status === 'Unread'));
    setMessage('All unread notifications cleared');
    setTimeout(() => setMessage(''), 3000);
  };

  if (!notifications) {
    return <div className="loading">Loading notifications...</div>;
  }

  return (
    <section className="notification-panel">
      <h2>Notifications</h2>
      {message && <div className="message">{message}</div>}
      <div className="notification-header">
        <h3>Recent Alerts</h3>
        <button className="clear-button" onClick={handleClearAll}>
          Clear All Unread
        </button>
      </div>
      <div className="notifications-container">
        {notifications.map((notif, idx) => (
          <div key={idx} className={`notification-item ${notif.status.toLowerCase()}`}>
            <div className="notification-content">
              <strong className="notification-type">{notif.type}</strong>
              <p className="notification-message">{notif.message}</p>
              <span className="notification-date">{notif.date}</span>
            </div>
            {notif.status === 'Unread' && (
              <button
                className="read-button"
                onClick={() => handleMarkAsRead(notif.id)}
              >
                Mark as Read
              </button>
            )}
          </div>
        ))}
      </div>
    </section>
  );
};

export default NotificationPanel;
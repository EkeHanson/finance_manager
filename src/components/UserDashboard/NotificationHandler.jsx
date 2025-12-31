import React, { useContext, useEffect } from 'react';
import { NotificationContext } from './UserDashboard';
import './NotificationHandler.css';

// Mock notification data
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
        {
          id: 5,
          type: 'ROI Update',
          message: 'ROI of ₦5,000.00 has been accrued for policy 200002',
          date: '2025-09-21',
          status: 'Unread',
        },
      ]);
    }, 400);
  });

const NotificationHandler = () => {
  const {
    notifications,
    setNotifications,
    showNotificationsModal,
    setShowNotificationsModal,
    selectedNotification,
    setSelectedNotification,
    filterType,
    setFilterType,
    sortOrder,
    setSortOrder,
    message,
    setMessage,
  } = useContext(NotificationContext);

  useEffect(() => {
    // Load notifications from localStorage or fetch
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      setNotifications(JSON.parse(storedNotifications));
    } else {
      mockFetchNotifications().then(data => {
        setNotifications(data);
        localStorage.setItem('notifications', JSON.stringify(data));
      });
    }

    // Simulate real-time updates with periodic fetch (every 30 seconds)
    const interval = setInterval(() => {
      mockFetchNotifications().then(data => {
        setNotifications(prev => {
          const newNotifications = data.filter(
            newNotif => !prev.some(prevNotif => prevNotif.id === newNotif.id)
          );
          if (newNotifications.length > 0) {
            const updatedNotifications = [...prev, ...newNotifications];
            localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
            return updatedNotifications;
          }
          return prev;
        });
      });
    }, 30000);

    return () => clearInterval(interval);
  }, [setNotifications]);

  const handleMarkAsRead = (id) => {
    setNotifications(prev => {
      const updated = prev.map(notif =>
        notif.id === id ? { ...notif, status: 'Read' } : notif
      );
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setMessage('Notification marked as read');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleMarkAllAsRead = () => {
    setNotifications(prev => {
      const updated = prev.map(notif => ({ ...notif, status: 'Read' }));
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setMessage('All notifications marked as read');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleDismiss = (id) => {
    setNotifications(prev => {
      const updated = prev.filter(notif => notif.id !== id);
      localStorage.setItem('notifications', JSON.stringify(updated));
      return updated;
    });
    setMessage('Notification dismissed');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleNotificationClick = (notif) => {
    setSelectedNotification(notif);
    if (notif.status === 'Unread') {
      handleMarkAsRead(notif.id);
    }
  };

  const closeModals = () => {
    setShowNotificationsModal(false);
    setSelectedNotification(null);
  };

  const handleOverlayClick = (e) => {
    if (e.target.classList.contains('modal-overlay') && showNotificationsModal) {
      setShowNotificationsModal(false);
    }
  };

  if (!notifications) {
    return null;
  }

  const unreadCount = notifications.filter(n => n.status === 'Unread').length;
  const filteredNotifications =
    filterType === 'All'
      ? notifications
      : notifications.filter(n => n.type === filterType);
  const sortedNotifications = [...filteredNotifications].sort((a, b) => {
    const dateA = new Date(a.date);
    const dateB = new Date(b.date);
    return sortOrder === 'desc' ? dateB - dateA : dateA - dateB;
  });

  return (
    <>
      <div className="notification-icon" onClick={() => setShowNotificationsModal(true)}>
        <span role="img" aria-label="Notifications">🔔</span>
        {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
      </div>

      {showNotificationsModal && (
        <div className="modal-overlay" onClick={handleOverlayClick}>
          <div className="notifications-modal">
            <div className="modal-header">
              <h3>Notifications</h3>
              <button className="close-button" onClick={closeModals}>×</button>
            </div>
            <div className="modal-controls">
              <select
                value={filterType}
                onChange={e => setFilterType(e.target.value)}
                className="filter-select"
              >
                <option value="All">All Types</option>
                <option value="ROI Update">ROI Update</option>
                <option value="Withdrawal Status">Withdrawal Status</option>
                <option value="KYC Status">KYC Status</option>
                <option value="Investment Reminder">Investment Reminder</option>
              </select>
              <select
                value={sortOrder}
                onChange={e => setSortOrder(e.target.value)}
                className="filter-select"
              >
                <option value="desc">Newest First</option>
                <option value="asc">Oldest First</option>
              </select>
              <button className="mark-all-button" onClick={handleMarkAllAsRead}>
                Mark All as Read
              </button>
            </div>
            <div className="notifications-list">
              {sortedNotifications.length > 0 ? (
                sortedNotifications.map((notif, idx) => (
                  <div
                    key={idx}
                    className={`notification-item ${notif.status.toLowerCase()}`}
                  >
                    <div
                      className="notification-content"
                      onClick={() => handleNotificationClick(notif)}
                    >
                      <strong className="notification-type">{notif.type}</strong>
                      <p className="notification-message">{notif.message}</p>
                      <span className="notification-date">{notif.date}</span>
                    </div>
                    <button
                      className="dismiss-button"
                      onClick={() => handleDismiss(notif.id)}
                    >
                      Dismiss
                    </button>
                  </div>
                ))
              ) : (
                <p className="no-notifications">No notifications found</p>
              )}
            </div>
          </div>
        </div>
      )}

      {selectedNotification && (
        <div className="modal-overlay">
          <div className="notification-details-modal">
            <div className="modal-header">
              <h3>{selectedNotification.type}</h3>
              <button className="close-button" onClick={closeModals}>×</button>
            </div>
            <div className="notification-details-content">
              <p><strong>Message:</strong> {selectedNotification.message}</p>
              <p><strong>Date:</strong> {selectedNotification.date}</p>
              <p><strong>Status:</strong> {selectedNotification.status}</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default NotificationHandler;
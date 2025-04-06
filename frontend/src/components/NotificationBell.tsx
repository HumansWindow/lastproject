import React, { useEffect, useState } from 'react';
import { BellIcon } from './icons/BellIcon'; 
import { Dropdown } from 'react-bootstrap';
import { notificationService, AppNotification } from '../services/notification-service';
import { useObservable } from '../hooks/useObservable';

/**
 * Notification bell component with dropdown for displaying real-time notifications
 */
const NotificationBell: React.FC = () => {
  const notifications = useObservable(notificationService.getNotifications(), []);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showDropdown, setShowDropdown] = useState(false);

  // Initialize notification service when component mounts
  useEffect(() => {
    notificationService.initialize();
  }, []);

  // Update unread count whenever notifications change
  useEffect(() => {
    setUnreadCount(notifications.filter(n => !n.read).length);
  }, [notifications]);

  // Mark notifications as seen when dropdown is opened
  useEffect(() => {
    if (showDropdown && notifications.length > 0) {
      const unseenIds = notifications
        .filter(n => !n.seen)
        .map(n => n.id);
      
      if (unseenIds.length > 0) {
        notificationService.markAsSeen(unseenIds);
      }
    }
  }, [showDropdown, notifications]);

  /**
   * Handle clicking the "Mark all as read" button
   */
  const handleMarkAllRead = () => {
    notificationService.markAllAsRead();
  };

  /**
   * Handle clicking on a notification item
   */
  const handleNotificationClick = (notification: AppNotification) => {
    notificationService.markAsRead(notification.id);
    
    // Navigate if there's a link
    if ('link' in notification && notification.link) {
      window.location.href = notification.link;
    }
    
    setShowDropdown(false);
  };

  /**
   * Format notification timestamp
   */
  const formatTimestamp = (timestamp: string | number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return 'Yesterday';
    return date.toLocaleDateString();
  };

  /**
   * Get category-specific styles for a notification
   */
  const getNotificationStyles = (category: string) => {
    switch (category) {
      case 'success':
        return {
          icon: '✅',
          bgColor: 'bg-green-100',
          textColor: 'text-green-800',
        };
      case 'warning':
        return {
          icon: '⚠️',
          bgColor: 'bg-yellow-100',
          textColor: 'text-yellow-800',
        };
      case 'error':
        return {
          icon: '❌',
          bgColor: 'bg-red-100',
          textColor: 'text-red-800',
        };
      case 'info':
      default:
        return {
          icon: 'ℹ️',
          bgColor: 'bg-blue-100',
          textColor: 'text-blue-800',
        };
    }
  };

  return (
    <div className="notification-bell relative">
      <Dropdown
        show={showDropdown}
        onToggle={(isOpen) => setShowDropdown(isOpen)}
        align="end"
      >
        <Dropdown.Toggle
          as="div"
          id="notification-dropdown"
          className="cursor-pointer relative"
        >
          <BellIcon className="h-6 w-6 text-gray-600 hover:text-gray-800" />
          
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Dropdown.Toggle>

        <Dropdown.Menu className="w-80 max-h-96 overflow-y-auto py-0">
          <div className="p-3 border-b flex justify-between items-center">
            <h6 className="m-0 font-semibold">Notifications</h6>
            <button
              onClick={handleMarkAllRead}
              className="text-sm text-blue-600 hover:text-blue-800"
            >
              Mark all as read
            </button>
          </div>
          
          {notifications.length > 0 ? (
            notifications.map((notification) => {
              const styles = getNotificationStyles(notification.category);
              
              return (
                <Dropdown.Item
                  key={notification.id}
                  onClick={() => handleNotificationClick(notification)}
                  className={`border-b p-3 ${
                    !notification.read ? 'bg-gray-50' : ''
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className={`${styles.bgColor} p-2 rounded-full`}>
                      <span>{styles.icon}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between">
                        <h6 className={`font-medium mb-1 ${styles.textColor}`}>
                          {notification.title}
                        </h6>
                        <span className="text-gray-400 text-xs">
                          {formatTimestamp(notification.timestamp)}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 m-0">
                        {notification.message}
                      </p>
                      {!notification.read && (
                        <span className="inline-block h-2 w-2 bg-blue-500 rounded-full mt-2"></span>
                      )}
                    </div>
                  </div>
                </Dropdown.Item>
              );
            })
          ) : (
            <div className="p-4 text-center text-gray-500">
              No notifications yet
            </div>
          )}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default NotificationBell;
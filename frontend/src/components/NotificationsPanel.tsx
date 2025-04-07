import React, { useEffect, useState } from 'react';
import { realtimeService } from '../services/realtime/websocket/realtime-service';
import { ConnectionStatus } from '../services/realtime/websocket/websocket-manager';
import { NotificationEvent } from '../types/api-types';
import WebSocketStatus from './WebSocketStatus';

interface NotificationsPanelProps {
  maxNotifications?: number;
}

const NotificationsPanel: React.FC<NotificationsPanelProps> = ({ maxNotifications = 5 }) => {
  const [notifications, setNotifications] = useState<NotificationEvent[]>([]);
  
  useEffect(() => {
    // Subscribe to notifications via WebSocket
    const unsubscribe = realtimeService.subscribeToNotifications((notification) => {
      setNotifications((prev: NotificationEvent[]) => {
        // Add new notification and limit to maxNotifications
        const updated = [notification as NotificationEvent, ...prev].slice(0, maxNotifications);
        return updated;
      });
    });
    
    // Clean up subscription when component unmounts
    return () => {
      unsubscribe();
    };
  }, [maxNotifications]);

  const getNotificationColor = (category: string) => {
    switch (category) {
      case 'success': return 'bg-green-100 border-green-500 text-green-700';
      case 'warning': return 'bg-yellow-100 border-yellow-500 text-yellow-700';
      case 'error': return 'bg-red-100 border-red-500 text-red-700';
      default: return 'bg-blue-100 border-blue-500 text-blue-700';
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-lg font-semibold text-gray-800 dark:text-white">Real-time Notifications</h2>
        <WebSocketStatus showDetails />
      </div>
      
      {notifications.length === 0 ? (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <p>No notifications yet</p>
          <p className="text-sm mt-2">Notifications will appear here in real-time</p>
        </div>
      ) : (
        <div className="space-y-3">
          {notifications.map((notification, index) => (
            <div 
              key={`${notification.timestamp}-${index}`}
              className={`border-l-4 p-3 rounded ${getNotificationColor(notification.category)}`}
            >
              <div className="flex justify-between">
                <p className="font-medium">{notification.title}</p>
                <span className="text-xs">
                  {new Date(notification.timestamp).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm mt-1">{notification.message}</p>
            </div>
          ))}
        </div>
      )}
      <div className="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
        <button 
          className="text-sm text-blue-600 dark:text-blue-400 hover:underline"
          onClick={() => setNotifications([])}
        >
          Clear notifications
        </button>
      </div>
    </div>
  );
};

export default NotificationsPanel;
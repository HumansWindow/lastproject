import { realtimeService } from "../realtime";
import { apiClient } from "../api/apiClient";

export interface GameNotification {
  id: string;
  title: string;
  message: string;
  category: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  sentAt: Date;
  data?: Record<string, any>;
}

export interface GameNotificationCountSummary {
  total: number;
  unread: number;
}

class GameNotificationService {
  private unsubscribeNotifications: (() => void) | null = null;
  private unsubscribeNotificationCount: (() => void) | null = null;
  private onNotificationCallbacks: Set<(notification: GameNotification) => void> = new Set();
  private onCountUpdateCallbacks: Set<(count: number) => void> = new Set();
  private userId: string | null = null;
  private unreadCount: number = 0;

  /**
   * Initialize the notification service for a specific user
   * @param userId User ID
   */
  public init(userId: string): void {
    // Clean up any existing subscriptions
    this.cleanup();
    
    this.userId = userId;
    
    // Subscribe to notifications
    this.unsubscribeNotifications = realtimeService.subscribe(
      'game:notifications',
      this.handleNotification.bind(this)
    );
    
    // Subscribe to notification count updates
    this.unsubscribeNotificationCount = realtimeService.subscribe(
      `game:notifications:count:${userId}`,
      this.handleCountUpdate.bind(this)
    );
    
    // Get initial unread count
    this.fetchUnreadCount();
  }

  /**
   * Alias for init method to maintain backward compatibility
   * @param userId User ID
   */
  public initialize(userId: string): void {
    return this.init(userId);
  }

  /**
   * Clean up all subscriptions
   */
  public cleanup(): void {
    if (this.unsubscribeNotifications) {
      this.unsubscribeNotifications();
      this.unsubscribeNotifications = null;
    }
    
    if (this.unsubscribeNotificationCount) {
      this.unsubscribeNotificationCount();
      this.unsubscribeNotificationCount = null;
    }
    
    this.userId = null;
  }

  /**
   * Register a callback for new notifications
   * @param callback Function to call when a new notification is received
   * @returns Function to unregister the callback
   */
  public onNotification(callback: (notification: GameNotification) => void): () => void {
    this.onNotificationCallbacks.add(callback);
    
    return () => {
      this.onNotificationCallbacks.delete(callback);
    };
  }

  /**
   * Register a callback for notification count updates
   * @param callback Function to call when the notification count changes
   * @returns Function to unregister the callback
   */
  public onCountUpdate(callback: (count: number) => void): () => void {
    this.onCountUpdateCallbacks.add(callback);
    
    // Immediately call with current count
    callback(this.unreadCount);
    
    return () => {
      this.onCountUpdateCallbacks.delete(callback);
    };
  }

  /**
   * Get all notifications for the current user
   * @param page Page number (1-indexed)
   * @param limit Number of items per page
   * @param onlyUnread Whether to only fetch unread notifications
   * @returns Promise with notifications and total count
   */
  public async getNotifications(
    page: number = 1,
    limit: number = 20,
    onlyUnread: boolean = false
  ): Promise<{ notifications: GameNotification[]; total: number }> {
    try {
      const response = await apiClient.get('/game/notifications', {
        params: { page, limit, onlyUnread }
      });
      
      return {
        notifications: response.data.notifications.map(this.formatNotification),
        total: response.data.total
      };
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
      return { notifications: [], total: 0 };
    }
  }

  /**
   * Get notification counts (total and unread)
   * @returns Promise with notification counts
   */
  public getNotificationCounts(): { subscribe: (callback: (counts: GameNotificationCountSummary) => void) => { unsubscribe: () => void } } {
    return {
      subscribe: (callback: (counts: GameNotificationCountSummary) => void) => {
        const handler = () => {
          callback({
            total: this.unreadCount, // This should be fixed if you track total count separately
            unread: this.unreadCount
          });
        };
        
        this.onCountUpdateCallbacks.add(handler);
        handler(); // Call immediately with current state
        
        return {
          unsubscribe: () => {
            this.onCountUpdateCallbacks.delete(handler);
          }
        };
      }
    };
  }

  /**
   * Mark a notification as read
   * @param notificationId Notification ID
   * @returns Promise resolving to true if successful
   */
  public async markAsRead(notificationId: string): Promise<boolean> {
    try {
      await apiClient.post(`/game/notifications/${notificationId}/read`);
      
      // Update local unread count
      this.unreadCount = Math.max(0, this.unreadCount - 1);
      this.notifyCountUpdate();
      
      return true;
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
      return false;
    }
  }

  /**
   * Mark all notifications as read
   * @returns Promise resolving to true if successful
   */
  public async markAllAsRead(): Promise<boolean> {
    try {
      await apiClient.post('/game/notifications/read-all');
      
      // Update local unread count
      this.unreadCount = 0;
      this.notifyCountUpdate();
      
      return true;
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
      return false;
    }
  }

  /**
   * Get the current unread notification count
   * @returns Current unread count
   */
  public getUnreadCount(): number {
    return this.unreadCount;
  }

  /**
   * Handle incoming notification
   * @param data Notification data from WebSocket
   */
  private handleNotification(data: any): void {
    // Format notification
    const notification: GameNotification = {
      id: data.data?.notificationId || `temp-${Date.now()}`,
      title: data.title,
      message: data.message,
      category: data.category || 'info',
      isRead: false,
      sentAt: new Date(data.timestamp),
      data: data.data
    };
    
    // Increment unread count
    this.unreadCount++;
    this.notifyCountUpdate();
    
    // Notify subscribers
    this.onNotificationCallbacks.forEach(callback => {
      try {
        callback(notification);
      } catch (error) {
        console.error('Error in notification callback:', error);
      }
    });
  }

  /**
   * Handle notification count update
   * @param data Count data from WebSocket
   */
  private handleCountUpdate(data: any): void {
    if (typeof data.unreadCount === 'number') {
      this.unreadCount = data.unreadCount;
      this.notifyCountUpdate();
    }
  }

  /**
   * Fetch unread notification count from API
   */
  private async fetchUnreadCount(): Promise<void> {
    if (!this.userId) return;
    
    try {
      const response = await apiClient.get('/game/notifications/count');
      this.unreadCount = response.data.unreadCount || 0;
      this.notifyCountUpdate();
    } catch (error) {
      console.error('Failed to fetch unread notification count:', error);
    }
  }

  /**
   * Notify all count update subscribers
   */
  private notifyCountUpdate(): void {
    this.onCountUpdateCallbacks.forEach(callback => {
      try {
        callback(this.unreadCount);
      } catch (error) {
        console.error('Error in count update callback:', error);
      }
    });
  }

  /**
   * Format API notification data
   * @param notification Notification data from API
   * @returns Formatted notification
   */
  private formatNotification(notification: any): GameNotification {
    return {
      id: notification.id,
      title: notification.title,
      message: notification.body || notification.message,
      category: notification.category || 'info',
      isRead: notification.isRead,
      sentAt: new Date(notification.sentAt || notification.createdAt),
      data: notification.additionalData || notification.data || {}
    };
  }
}

// Export singleton instance
export const gameNotificationService = new GameNotificationService();
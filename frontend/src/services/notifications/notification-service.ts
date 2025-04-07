import { BehaviorSubject } from 'rxjs';
import { realtimeService } from '../realtime/websocket/realtime-service';
// Define our own version of NotificationEvent to avoid import errors
// This is a simplified version of what we expect from realtime service
export interface RealtimeNotificationEvent {
  id?: string;
  title: string;
  message: string;
  type?: string;
  timestamp?: number;
  link?: string;
  data?: Record<string, any>;
}

/**
 * Interface for notification objects
 */
export interface AppNotification {
  id: string;
  title: string;
  message: string;
  category: 'info' | 'success' | 'warning' | 'error';
  timestamp: number;
  read: boolean;
  seen: boolean;
  link?: string;
  data?: Record<string, any>;
}

/**
 * Service for managing application notifications
 */
class NotificationService {
  private notifications$ = new BehaviorSubject<AppNotification[]>([]);
  private isInitialized = false;
  private unsubscribe: (() => void) | null = null;
  private storageKey = 'app_notifications';

  /**
   * Initialize the notification service
   */
  public initialize(): void {
    if (this.isInitialized) return;
    
    // Load stored notifications
    this.loadNotifications();
    
    // Subscribe to real-time notifications if WebSocket is available
    if (realtimeService) {
      this.unsubscribe = realtimeService.subscribeToNotifications(
        (data: any) => this.handleNotification(data as RealtimeNotificationEvent)
      );
    }
    
    this.isInitialized = true;
  }

  /**
   * Clean up notification service
   */
  public dispose(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    
    this.isInitialized = false;
  }

  /**
   * Get observable of notifications
   * @returns Observable of notifications
   */
  public getNotifications() {
    return this.notifications$.asObservable();
  }

  /**
   * Add a new notification
   * @param notification Notification to add
   */
  public addNotification(notification: Partial<AppNotification>): void {
    const newNotification: AppNotification = {
      id: notification.id || `notif_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: notification.title || 'Notification',
      message: notification.message || '',
      category: notification.category || 'info',
      timestamp: notification.timestamp || Date.now(),
      read: false,
      seen: false,
      link: notification.link,
      data: notification.data
    };
    
    const currentNotifications = this.notifications$.getValue();
    const updatedNotifications = [
      newNotification,
      ...currentNotifications.filter(n => n.id !== newNotification.id)
    ];
    
    this.notifications$.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  /**
   * Mark a notification as read
   * @param id Notification ID
   */
  public markAsRead(id: string): void {
    const currentNotifications = this.notifications$.getValue();
    const updatedNotifications = currentNotifications.map(notification => 
      notification.id === id
        ? { ...notification, read: true }
        : notification
    );
    
    this.notifications$.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  /**
   * Mark all notifications as read
   */
  public markAllAsRead(): void {
    const currentNotifications = this.notifications$.getValue();
    const updatedNotifications = currentNotifications.map(notification => ({
      ...notification,
      read: true
    }));
    
    this.notifications$.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  /**
   * Mark notifications as seen (viewed but not necessarily read)
   * @param ids Notification IDs to mark as seen
   */
  public markAsSeen(ids: string[]): void {
    const currentNotifications = this.notifications$.getValue();
    const updatedNotifications = currentNotifications.map(notification => 
      ids.includes(notification.id)
        ? { ...notification, seen: true }
        : notification
    );
    
    this.notifications$.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  /**
   * Remove a notification
   * @param id Notification ID
   */
  public removeNotification(id: string): void {
    const currentNotifications = this.notifications$.getValue();
    const updatedNotifications = currentNotifications.filter(
      notification => notification.id !== id
    );
    
    this.notifications$.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  /**
   * Clear all notifications
   */
  public clearAll(): void {
    this.notifications$.next([]);
    this.saveNotifications([]);
  }
  
  /**
   * Clear old notifications
   * @param maxAgeMs Maximum age in milliseconds
   */
  public clearOld(maxAgeMs: number): void {
    const currentTime = Date.now();
    
    const currentNotifications = this.notifications$.getValue();
    const updatedNotifications = currentNotifications.filter(
      notification => currentTime - notification.timestamp < maxAgeMs
    );
    
    this.notifications$.next(updatedNotifications);
    this.saveNotifications(updatedNotifications);
  }

  /**
   * Handle new notifications from WebSocket
   * @param event Notification event
   */
  private handleNotification(event: RealtimeNotificationEvent): void {
    // Generate ID if not provided in the event
    const notificationId = event.id || `ws_${Date.now()}`;
    
    this.addNotification({
      id: notificationId,
      title: event.title,
      message: event.message,
      category: event.type as 'info' | 'success' | 'warning' | 'error' || 'info',
      timestamp: event.timestamp || Date.now(),
      read: false,
      seen: false,
      link: event.link,
      data: event.data
    });
  }

  /**
   * Handle creating notifications from any source (for WebSocketDemo compatibility)
   */
  public handleNewNotification(notification: Partial<AppNotification>): void {
    this.addNotification(notification);
  }

  /**
   * Load notifications from storage
   */
  private loadNotifications(): void {
    try {
      const storedData = localStorage.getItem(this.storageKey);
      
      if (storedData) {
        const parsedData = JSON.parse(storedData) as AppNotification[];
        this.notifications$.next(parsedData);
      }
    } catch (error) {
      console.error('Failed to load notifications from storage:', error);
      // If loading fails, start with an empty array
      this.notifications$.next([]);
    }
  }

  /**
   * Save notifications to storage
   * @param notifications Notifications to save
   */
  private saveNotifications(notifications: AppNotification[]): void {
    try {
      // Limit to 50 notifications to avoid storage issues
      const limitedNotifications = notifications.slice(0, 50);
      localStorage.setItem(this.storageKey, JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }
}

// Create singleton instance
export const notificationService = new NotificationService();

// Default export
export default notificationService;
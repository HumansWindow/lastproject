# Notification and Real-time System File Structure

This document outlines the complete file structure needed to implement the notification and real-time system in both backend and frontend. This structure aligns with the existing implementation found in the codebase.

## Core Configuration Files

These configuration files are essential for the real-time system:

```
/frontend/src/services/realtime/
  ├── config.ts                # WebSocket configuration (URLs, reconnection settings)
  └── index.ts                 # Exports the singleton realtimeService instance
```

## Backend Structure

```
/backend/
  ├── src/
  │   ├── notifications/
  │   │   ├── notifications.module.ts       # Notification module definition
  │   │   ├── notifications.service.ts      # Core notification service
  │   │   ├── notifications.controller.ts   # REST endpoints for notifications
  │   │   ├── notifications.gateway.ts      # WebSocket gateway for real-time notifications
  │   │   ├── dto/
  │   │   │   ├── create-notification.dto.ts  # DTO for creating notifications
  │   │   │   ├── update-notification.dto.ts  # DTO for updating notifications
  │   │   │   └── notification-query.dto.ts   # DTO for querying notifications
  │   │   ├── entities/
  │   │   │   └── notification.entity.ts      # Notification database entity
  │   │   └── interfaces/
  │   │       └── notification.interface.ts   # Notification interface definitions
  │   │
  │   ├── websockets/
  │   │   ├── websockets.module.ts          # WebSocket module definition
  │   │   ├── decorators/
  │   │   │   └── ws-user.decorator.ts      # Decorator to extract user from WebSocket
  │   │   ├── filters/
  │   │   │   └── ws-exception.filter.ts    # Exception filter for WebSockets
  │   │   ├── guards/
  │   │   │   └── ws-auth.guard.ts          # Authentication guard for WebSockets
  │   │   └── interfaces/
  │   │       └── websocket-client.interface.ts  # WebSocket client interface
  │   │
  │   └── blockchain/                      # Example of domain-specific WebSocket
  │       └── gateways/
  │           └── websocket.gateway.ts     # WebSocket gateway for blockchain events
```

## Frontend Structure

```
/frontend/
  ├── src/
  │   ├── contexts/
  │   │   └── websocket.context.tsx        # WebSocket React context provider
  │   │
  │   ├── hooks/
  │   │   ├── useWebSocket.ts              # WebSocket custom hook
  │   │   └── useNotifications.ts          # Notifications custom hook
  │   │
  │   ├── services/
  │   │   ├── realtime/
  │   │   │   ├── websocket/
  │   │   │   │   ├── websocket-manager.ts  # Core WebSocket connection manager
  │   │   │   │   └── realtime-service.ts   # Higher-level WebSocket service
  │   │   │   ├── config.ts                 # WebSocket configuration
  │   │   │   └── index.ts                  # Service exports
  │   │   │
  │   │   └── notification/
  │   │       ├── notification-service.ts   # Notification management service
  │   │       ├── notification-storage.ts   # Local storage for notifications
  │   │       └── index.ts                  # Service exports
  │   │
  │   ├── components/
  │   │   ├── WebSocketStatus.tsx          # Connection status indicator
  │   │   ├── WebSocketIndicator.tsx       # Minimal status indicator
  │   │   ├── NotificationBell.tsx         # Notification bell with counter
  │   │   ├── NotificationList.tsx         # List of user notifications
  │   │   ├── NotificationItem.tsx         # Individual notification item
  │   │   └── NotificationCenter.tsx       # Full notification management UI
  │   │
  │   ├── types/
  │   │   ├── websocket.ts                 # WebSocket type definitions
  │   │   └── notification.ts              # Notification type definitions
  │   │
  │   └── pages/                          # Example pages using real-time features
  │       ├── WebSocketDemo.tsx            # WebSocket demonstration page
  │       └── NotificationsPage.tsx        # Notifications management page
```

## Shared Structure (for monorepo setups)

```
/shared/
  ├── api-client/
  │   └── src/
  │       ├── services/
  │       │   └── realtime-service.ts      # Shared real-time service
  │       │
  │       └── notification/
  │           └── notification.service.ts  # Shared notification service
  │
  └── types/
      ├── websocket.types.ts               # Shared WebSocket type definitions
      └── notification.types.ts            # Shared notification type definitions
```

## Implementation Example Files

### Backend Implementation

**notification.entity.ts:**
```typescript
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  JoinColumn,
  Index
} from 'typeorm';
import { User } from '../../users/entities/user.entity';

export type NotificationCategory = 'info' | 'success' | 'warning' | 'error';

@Entity('notifications')
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ 
    type: 'enum', 
    enum: ['info', 'success', 'warning', 'error'],
    default: 'info' 
  })
  category: NotificationCategory;

  @Column({ default: false })
  isRead: boolean;

  @Column({ type: 'jsonb', nullable: true })
  data: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}
```

**notifications.service.ts:**
```typescript
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationCategory } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { WebsocketGateway } from '../websockets/websocket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private websocketGateway: WebsocketGateway,
  ) {}

  /**
   * Create a new notification
   */
  async create(createNotificationDto: CreateNotificationDto): Promise<Notification> {
    const notification = this.notificationsRepository.create(createNotificationDto);
    const saved = await this.notificationsRepository.save(notification);
    
    // Send real-time notification via WebSocket
    this.websocketGateway.sendNotificationToUser(
      saved.userId,
      saved.title,
      saved.message,
      saved.category,
      saved.data
    );
    
    return saved;
  }

  /**
   * Create and send a notification in one step
   */
  async sendNotification(
    userId: string,
    title: string,
    message: string,
    category: NotificationCategory = 'info',
    data?: Record<string, any>
  ): Promise<Notification> {
    return this.create({
      userId,
      title,
      message,
      category,
      data,
      isRead: false
    });
  }

  /**
   * Get all notifications for a user
   */
  async findAllForUser(userId: string, includeRead = false): Promise<Notification[]> {
    const query = this.notificationsRepository.createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC');
    
    if (!includeRead) {
      query.andWhere('notification.is_read = :isRead', { isRead: false });
    }
    
    return query.getMany();
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.notificationsRepository.findOne({
      where: { id, userId }
    });
    
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  /**
   * Mark all notifications as read for a user
   */
  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  /**
   * Delete a notification
   */
  async remove(id: string, userId: string): Promise<void> {
    await this.notificationsRepository.delete({ id, userId });
  }

  /**
   * Delete all notifications for a user
   */
  async removeAllForUser(userId: string): Promise<void> {
    await this.notificationsRepository.delete({ userId });
  }
}
```

### Frontend Implementation

**notification-service.ts:**
```typescript
import { BehaviorSubject, Observable } from 'rxjs';
import { map, filter } from 'rxjs/operators';
import { realtimeService } from '../realtime';
import { notificationStorage } from './notification-storage';

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: 'info' | 'success' | 'warning' | 'error';
  isRead: boolean;
  data?: Record<string, any>;
  timestamp: number;
}

class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  
  constructor() {
    // Load notifications from storage on init
    this.loadFromStorage();
    
    // Subscribe to real-time notifications
    this.setupWebSocketListener();
  }
  
  /**
   * Set up WebSocket listener for notifications
   */
  private setupWebSocketListener(): void {
    realtimeService.subscribe('notifications', (notification: Notification) => {
      this.addNotification(notification);
    });
  }
  
  /**
   * Load notifications from local storage
   */
  private loadFromStorage(): void {
    const storedNotifications = notificationStorage.getNotifications();
    this.notifications.next(storedNotifications);
  }
  
  /**
   * Save notifications to local storage
   */
  private saveToStorage(): void {
    notificationStorage.saveNotifications(this.notifications.value);
  }
  
  /**
   * Add a new notification
   */
  addNotification(notification: Notification): void {
    const current = this.notifications.value;
    const updated = [notification, ...current];
    this.notifications.next(updated);
    this.saveToStorage();
  }
  
  /**
   * Mark notification as read
   */
  markAsRead(id: string): void {
    const current = this.notifications.value;
    const updated = current.map(notification =>
      notification.id === id ? { ...notification, isRead: true } : notification
    );
    this.notifications.next(updated);
    this.saveToStorage();
  }
  
  /**
   * Mark all notifications as read
   */
  markAllAsRead(): void {
    const current = this.notifications.value;
    const updated = current.map(notification => ({ ...notification, isRead: true }));
    this.notifications.next(updated);
    this.saveToStorage();
  }
  
  /**
   * Remove a notification
   */
  removeNotification(id: string): void {
    const current = this.notifications.value;
    const updated = current.filter(notification => notification.id !== id);
    this.notifications.next(updated);
    this.saveToStorage();
  }
  
  /**
   * Remove all notifications
   */
  clearAllNotifications(): void {
    this.notifications.next([]);
    this.saveToStorage();
  }
  
  /**
   * Get all notifications as an observable
   */
  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }
  
  /**
   * Get unread notifications as an observable
   */
  getUnreadNotifications(): Observable<Notification[]> {
    return this.notifications.pipe(
      map(notifications => notifications.filter(notification => !notification.isRead))
    );
  }
  
  /**
   * Get unread count as an observable
   */
  getUnreadCount(): Observable<number> {
    return this.getUnreadNotifications().pipe(
      map(notifications => notifications.length)
    );
  }
  
  /**
   * Get notifications for a specific category
   */
  getNotificationsByCategory(category: string): Observable<Notification[]> {
    return this.notifications.pipe(
      map(notifications => notifications.filter(notification => notification.category === category))
    );
  }
}

export const notificationService = new NotificationService();
```

**NotificationBell.tsx:**
```tsx
import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notification';

interface NotificationBellProps {
  onClick?: () => void;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ onClick }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const subscription = notificationService.getUnreadCount().subscribe(count => {
      setUnreadCount(count);
    });
    
    return () => subscription.unsubscribe();
  }, []);
  
  return (
    <div className="notification-bell" onClick={onClick}>
      <i className="icon bell"></i>
      {unreadCount > 0 && (
        <span className="notification-badge">{unreadCount}</span>
      )}
    </div>
  );
};
```

## Required Changes to Other Files

### Integration in App Component

```tsx
// In frontend/src/pages/_app.tsx or App.tsx
import React from 'react';
import { WebSocketProvider } from '../contexts/websocket.context';
import { NotificationCenter } from '../components/NotificationCenter';
import { WebSocketIndicator } from '../components/WebSocketIndicator';
// ... other imports

function App() {
  return (
    <WebSocketProvider>
      <div className="app">
        <header>
          <WebSocketIndicator />
          <NotificationCenter />
          {/* Other header components */}
        </header>
        
        <main>
          {/* App content */}
        </main>
      </div>
    </WebSocketProvider>
  );
}

export default App;
```

### User Settings Integration

```typescript
// User preferences entity
// In backend/src/users/entities/user-preferences.entity.ts
import { Entity, Column, PrimaryGeneratedColumn, OneToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

@Entity('user_preferences')
export class UserPreferences {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @OneToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'user_id' })
  userId: string;

  // Notification preferences
  @Column({ default: true })
  enableNotifications: boolean;

  @Column({ default: true })
  enableEmailNotifications: boolean;

  @Column({ default: true })
  enablePushNotifications: boolean;

  @Column({ type: 'jsonb', nullable: true, default: () => "'{}'" })
  notificationSettings: {
    [key: string]: boolean;  // Enable/disable by notification type
  };

  // ... other preferences
}
```

## Implementation Steps

1. Create directory structure as outlined above
2. Implement backend notification system
   a. Create notification entity
   b. Set up notifications service
   c. Configure WebSocket gateway for real-time notifications
   d. Add notification controller for REST endpoints
3. Implement frontend notification system
   a. Set up WebSocket connections
   b. Create notification service
   c. Build UI components
   d. Integrate with application
4. Add user preferences for notification settings
5. Implement notification storage and sync mechanisms
6. Add test pages to demonstrate functionality
# Implementing Notifications

This guide provides a step-by-step approach to implementing and using notifications in the application.

## Backend Implementation

### 1. Create Notification Entity

Start by implementing the notification entity that will be stored in the database:

```typescript
// backend/src/notifications/entities/notification.entity.ts
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

### 2. Create DTOs for Notifications

Create Data Transfer Objects for creating and updating notifications:

```typescript
// backend/src/notifications/dto/create-notification.dto.ts
import { IsString, IsNotEmpty, IsOptional, IsUUID, IsBoolean, IsEnum } from 'class-validator';
import { NotificationCategory } from '../entities/notification.entity';

export class CreateNotificationDto {
  @IsUUID()
  @IsNotEmpty()
  userId: string;

  @IsString()
  @IsNotEmpty()
  title: string;

  @IsString()
  @IsNotEmpty()
  message: string;

  @IsEnum(['info', 'success', 'warning', 'error'])
  @IsOptional()
  category?: NotificationCategory;

  @IsBoolean()
  @IsOptional()
  isRead?: boolean;

  @IsOptional()
  data?: Record<string, any>;
}
```

```typescript
// backend/src/notifications/dto/update-notification.dto.ts
import { PartialType } from '@nestjs/mapped-types';
import { CreateNotificationDto } from './create-notification.dto';

export class UpdateNotificationDto extends PartialType(CreateNotificationDto) {}
```

### 3. Implement Notification Service

Create a service to handle notification logic:

```typescript
// backend/src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationCategory } from './entities/notification.entity';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';
import { WebSocketGateway } from '../websockets/websocket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationsRepository: Repository<Notification>,
    private websocketGateway: WebSocketGateway
  ) {}

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

  async findAll(userId: string, options?: { includeRead?: boolean }): Promise<Notification[]> {
    const query = this.notificationsRepository.createQueryBuilder('notification')
      .where('notification.user_id = :userId', { userId })
      .orderBy('notification.created_at', 'DESC');
    
    if (options && !options.includeRead) {
      query.andWhere('notification.is_read = :isRead', { isRead: false });
    }
    
    return query.getMany();
  }

  async findOne(id: string, userId: string): Promise<Notification> {
    return this.notificationsRepository.findOne({
      where: { id, userId }
    });
  }

  async update(id: string, userId: string, updateNotificationDto: UpdateNotificationDto): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    Object.assign(notification, updateNotificationDto);
    return this.notificationsRepository.save(notification);
  }

  async markAsRead(id: string, userId: string): Promise<Notification> {
    const notification = await this.findOne(id, userId);
    if (!notification) {
      throw new Error('Notification not found');
    }
    
    notification.isRead = true;
    return this.notificationsRepository.save(notification);
  }

  async markAllAsRead(userId: string): Promise<void> {
    await this.notificationsRepository.update(
      { userId, isRead: false },
      { isRead: true }
    );
  }

  async remove(id: string, userId: string): Promise<void> {
    await this.notificationsRepository.delete({ id, userId });
  }

  async removeAll(userId: string): Promise<void> {
    await this.notificationsRepository.delete({ userId });
  }
}
```

### 4. Create Notification Controller

Implement a controller to expose notification endpoints:

```typescript
// backend/src/notifications/notifications.controller.ts
import { 
  Controller, 
  Get, 
  Post, 
  Body, 
  Patch, 
  Param, 
  Delete, 
  UseGuards,
  Query
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { User } from '../auth/decorators/user.decorator';
import { NotificationsService } from './notifications.service';
import { CreateNotificationDto } from './dto/create-notification.dto';
import { UpdateNotificationDto } from './dto/update-notification.dto';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationsService: NotificationsService) {}

  @Post()
  create(@Body() createNotificationDto: CreateNotificationDto, @User('id') userId: string) {
    // Override userId with authenticated user for security
    createNotificationDto.userId = userId;
    return this.notificationsService.create(createNotificationDto);
  }

  @Get()
  findAll(@User('id') userId: string, @Query('includeRead') includeRead: boolean) {
    return this.notificationsService.findAll(userId, { includeRead });
  }

  @Get(':id')
  findOne(@Param('id') id: string, @User('id') userId: string) {
    return this.notificationsService.findOne(id, userId);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateNotificationDto: UpdateNotificationDto,
    @User('id') userId: string
  ) {
    return this.notificationsService.update(id, userId, updateNotificationDto);
  }

  @Patch(':id/read')
  markAsRead(@Param('id') id: string, @User('id') userId: string) {
    return this.notificationsService.markAsRead(id, userId);
  }

  @Patch('mark-all-read')
  markAllAsRead(@User('id') userId: string) {
    return this.notificationsService.markAllAsRead(userId);
  }

  @Delete(':id')
  remove(@Param('id') id: string, @User('id') userId: string) {
    return this.notificationsService.remove(id, userId);
  }

  @Delete()
  removeAll(@User('id') userId: string) {
    return this.notificationsService.removeAll(userId);
  }
}
```

### 5. Create Notification Module

Create a module to organize notification components:

```typescript
// backend/src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { Notification } from './entities/notification.entity';
import { WebSocketsModule } from '../websockets/websockets.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([Notification]),
    WebSocketsModule
  ],
  controllers: [NotificationsController],
  providers: [NotificationsService],
  exports: [NotificationsService]
})
export class NotificationsModule {}
```

## Frontend Implementation

### 1. Create Notification Types

Define TypeScript interfaces for notifications:

```typescript
// frontend/src/types/notification.ts
export type NotificationCategory = 'info' | 'success' | 'warning' | 'error';

export interface Notification {
  id: string;
  title: string;
  message: string;
  category: NotificationCategory;
  isRead: boolean;
  data?: Record<string, any>;
  timestamp: number;
  createdAt?: string;
  updatedAt?: string;
}
```

### 2. Implement Local Storage for Notifications

Create a service to manage notification storage:

```typescript
// frontend/src/services/notification/notification-storage.ts
import { Notification } from '../../types/notification';

const STORAGE_KEY = 'notifications';
const MAX_STORED_NOTIFICATIONS = 50;

class NotificationStorage {
  getNotifications(): Notification[] {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (!stored) return [];
      
      const notifications = JSON.parse(stored) as Notification[];
      return notifications;
    } catch (error) {
      console.error('Failed to retrieve notifications from storage:', error);
      return [];
    }
  }
  
  saveNotifications(notifications: Notification[]): void {
    try {
      // Limit the number of stored notifications to prevent excessive storage use
      const limitedNotifications = notifications.slice(0, MAX_STORED_NOTIFICATIONS);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedNotifications));
    } catch (error) {
      console.error('Failed to save notifications to storage:', error);
    }
  }
  
  clearNotifications(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error('Failed to clear notifications from storage:', error);
    }
  }
}

export const notificationStorage = new NotificationStorage();
```

### 3. Create Notification Service

Implement a service to manage notifications on the client side:

```typescript
// frontend/src/services/notification/notification-service.ts
import { BehaviorSubject, Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { v4 as uuidv4 } from 'uuid';
import { realtimeService } from '../realtime';
import { notificationStorage } from './notification-storage';
import { Notification, NotificationCategory } from '../../types/notification';
import { api } from '../../api';

class NotificationService {
  private notifications = new BehaviorSubject<Notification[]>([]);
  
  constructor() {
    // Load notifications from storage on init
    this.loadFromStorage();
    
    // Subscribe to real-time notifications
    this.setupWebSocketListener();
    
    // Fetch notifications from server
    this.fetchNotifications();
  }
  
  private setupWebSocketListener(): void {
    realtimeService.subscribe('notifications', (notification: Notification) => {
      // Generate ID if not provided by server
      if (!notification.id) {
        notification.id = uuidv4();
      }
      
      // Set timestamp if not provided
      if (!notification.timestamp) {
        notification.timestamp = Date.now();
      }
      
      this.addNotification(notification);
    });
  }
  
  private loadFromStorage(): void {
    const storedNotifications = notificationStorage.getNotifications();
    this.notifications.next(storedNotifications);
  }
  
  private saveToStorage(): void {
    notificationStorage.saveNotifications(this.notifications.value);
  }
  
  private async fetchNotifications(): Promise<void> {
    try {
      const response = await api.get('/notifications');
      const serverNotifications = response.data;
      
      // Convert server timestamp format if needed
      const formattedNotifications = serverNotifications.map((notification: any) => ({
        ...notification,
        timestamp: new Date(notification.createdAt).getTime()
      }));
      
      this.notifications.next(formattedNotifications);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to fetch notifications:', error);
    }
  }
  
  addNotification(notification: Notification): void {
    const current = this.notifications.value;
    const updated = [notification, ...current];
    this.notifications.next(updated);
    this.saveToStorage();
  }
  
  async markAsRead(id: string): Promise<void> {
    try {
      await api.patch(`/notifications/${id}/read`);
      
      const current = this.notifications.value;
      const updated = current.map(notification =>
        notification.id === id ? { ...notification, isRead: true } : notification
      );
      this.notifications.next(updated);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }
  
  async markAllAsRead(): Promise<void> {
    try {
      await api.patch('/notifications/mark-all-read');
      
      const current = this.notifications.value;
      const updated = current.map(notification => ({ ...notification, isRead: true }));
      this.notifications.next(updated);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to mark all notifications as read:', error);
    }
  }
  
  async removeNotification(id: string): Promise<void> {
    try {
      await api.delete(`/notifications/${id}`);
      
      const current = this.notifications.value;
      const updated = current.filter(notification => notification.id !== id);
      this.notifications.next(updated);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to remove notification:', error);
    }
  }
  
  async clearAllNotifications(): Promise<void> {
    try {
      await api.delete('/notifications');
      
      this.notifications.next([]);
      this.saveToStorage();
    } catch (error) {
      console.error('Failed to clear all notifications:', error);
    }
  }
  
  getNotifications(): Observable<Notification[]> {
    return this.notifications.asObservable();
  }
  
  getUnreadNotifications(): Observable<Notification[]> {
    return this.notifications.pipe(
      map(notifications => notifications.filter(notification => !notification.isRead))
    );
  }
  
  getUnreadCount(): Observable<number> {
    return this.getUnreadNotifications().pipe(
      map(notifications => notifications.length)
    );
  }
  
  getNotificationsByCategory(category: NotificationCategory): Observable<Notification[]> {
    return this.notifications.pipe(
      map(notifications => notifications.filter(notification => notification.category === category))
    );
  }
}

export const notificationService = new NotificationService();
```

### 4. Create Notification UI Components

#### Notification Bell Component

```tsx
// frontend/src/components/NotificationBell.tsx
import React, { useState, useEffect, useRef } from 'react';
import { notificationService } from '../services/notification/notification-service';
import { NotificationList } from './NotificationList';

interface NotificationBellProps {
  className?: string;
}

export const NotificationBell: React.FC<NotificationBellProps> = ({ className }) => {
  const [unreadCount, setUnreadCount] = useState(0);
  const [isOpen, setIsOpen] = useState(false);
  const bellRef = useRef<HTMLDivElement>(null);
  
  useEffect(() => {
    const subscription = notificationService.getUnreadCount().subscribe(count => {
      setUnreadCount(count);
    });
    
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    
    return () => {
      subscription.unsubscribe();
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  const toggleNotifications = () => {
    setIsOpen(!isOpen);
  };
  
  return (
    <div ref={bellRef} className={`notification-bell ${className || ''}`}>
      <div className="bell-icon" onClick={toggleNotifications}>
        <i className="icon bell" />
        {unreadCount > 0 && (
          <span className="notification-badge">{unreadCount}</span>
        )}
      </div>
      
      {isOpen && (
        <div className="notification-dropdown">
          <NotificationList 
            onClose={() => setIsOpen(false)}
            onMarkAllRead={() => notificationService.markAllAsRead()}
          />
        </div>
      )}
    </div>
  );
};
```

#### Notification List Component

```tsx
// frontend/src/components/NotificationList.tsx
import React, { useState, useEffect } from 'react';
import { notificationService } from '../services/notification/notification-service';
import { Notification } from '../types/notification';
import { NotificationItem } from './NotificationItem';

interface NotificationListProps {
  onClose?: () => void;
  onMarkAllRead?: () => void;
  maxHeight?: string;
  showControls?: boolean;
}

export const NotificationList: React.FC<NotificationListProps> = ({
  onClose,
  onMarkAllRead,
  maxHeight = '400px',
  showControls = true
}) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  
  useEffect(() => {
    const subscription = notificationService.getNotifications().subscribe(
      data => setNotifications(data)
    );
    
    return () => subscription.unsubscribe();
  }, []);
  
  const handleMarkAllRead = () => {
    onMarkAllRead?.();
  };
  
  const handleClearAll = () => {
    notificationService.clearAllNotifications();
  };
  
  return (
    <div className="notification-list">
      <div className="notification-list-header">
        <h3>Notifications</h3>
        {showControls && (
          <div className="notification-controls">
            <button onClick={handleMarkAllRead}>Mark all read</button>
            <button onClick={handleClearAll}>Clear all</button>
            {onClose && (
              <button onClick={onClose}>Close</button>
            )}
          </div>
        )}
      </div>
      
      <div className="notification-items" style={{ maxHeight }}>
        {notifications.length === 0 ? (
          <div className="empty-notifications">No notifications</div>
        ) : (
          notifications.map(notification => (
            <NotificationItem 
              key={notification.id}
              notification={notification}
              onMarkAsRead={() => notificationService.markAsRead(notification.id)}
              onRemove={() => notificationService.removeNotification(notification.id)}
            />
          ))
        )}
      </div>
    </div>
  );
};
```

#### Notification Item Component

```tsx
// frontend/src/components/NotificationItem.tsx
import React from 'react';
import { Notification } from '../types/notification';

interface NotificationItemProps {
  notification: Notification;
  onMarkAsRead: () => void;
  onRemove: () => void;
}

export const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onMarkAsRead,
  onRemove
}) => {
  const { id, title, message, category, isRead, timestamp } = notification;
  
  const formatTime = (timestamp: number): string => {
    const date = new Date(timestamp);
    return new Intl.DateTimeFormat('default', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const handleClick = () => {
    if (!isRead) {
      onMarkAsRead();
    }
  };
  
  return (
    <div 
      className={`notification-item ${category} ${isRead ? 'read' : 'unread'}`}
      onClick={handleClick}
    >
      <div className="notification-icon">
        {category === 'info' && <i className="icon info-circle" />}
        {category === 'success' && <i className="icon check-circle" />}
        {category === 'warning' && <i className="icon exclamation-triangle" />}
        {category === 'error' && <i className="icon times-circle" />}
      </div>
      
      <div className="notification-content">
        <h4 className="notification-title">{title}</h4>
        <p className="notification-message">{message}</p>
        <span className="notification-time">{formatTime(timestamp)}</span>
      </div>
      
      <div className="notification-actions">
        {!isRead && (
          <button 
            className="mark-read-button" 
            onClick={(e) => {
              e.stopPropagation();
              onMarkAsRead();
            }}
          >
            <i className="icon check" />
          </button>
        )}
        
        <button 
          className="remove-button" 
          onClick={(e) => {
            e.stopPropagation();
            onRemove();
          }}
        >
          <i className="icon trash" />
        </button>
      </div>
    </div>
  );
};
```

### 5. Create a Custom Hook for Notifications

```typescript
// frontend/src/hooks/useNotifications.ts
import { useState, useEffect } from 'react';
import { notificationService } from '../services/notification/notification-service';
import { Notification, NotificationCategory } from '../types/notification';

export function useNotifications(category?: NotificationCategory) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  
  useEffect(() => {
    const notificationsSubscription = category
      ? notificationService.getNotificationsByCategory(category).subscribe(setNotifications)
      : notificationService.getNotifications().subscribe(setNotifications);
    
    const unreadSubscription = notificationService.getUnreadCount().subscribe(setUnreadCount);
    
    return () => {
      notificationsSubscription.unsubscribe();
      unreadSubscription.unsubscribe();
    };
  }, [category]);
  
  return {
    notifications,
    unreadCount,
    markAsRead: notificationService.markAsRead.bind(notificationService),
    markAllAsRead: notificationService.markAllAsRead.bind(notificationService),
    removeNotification: notificationService.removeNotification.bind(notificationService),
    clearAllNotifications: notificationService.clearAllNotifications.bind(notificationService)
  };
}
```

## Integration

### 1. Add Notification Center to Application Layout

```tsx
// frontend/src/components/Layout.tsx
import React from 'react';
import { NotificationBell } from './NotificationBell';
import { WebSocketIndicator } from './WebSocketIndicator';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="layout">
      <header className="header">
        <div className="logo">AliveHuman</div>
        
        <div className="header-right">
          <WebSocketIndicator />
          <NotificationBell />
          {/* Other header components */}
        </div>
      </header>
      
      <main className="main">
        {children}
      </main>
      
      <footer className="footer">
        {/* Footer content */}
      </footer>
    </div>
  );
};
```

### 2. Setting Up WebSocket Provider

```tsx
// frontend/src/pages/_app.tsx
import React, { useEffect } from 'react';
import { WebSocketProvider } from '../contexts/websocket.context';
import { Layout } from '../components/Layout';
import { useAuth } from '../hooks/useAuth';
import { realtimeService } from '../services/realtime';

function MyApp({ Component, pageProps }) {
  const { token } = useAuth();
  
  useEffect(() => {
    // Connect to WebSocket when user is authenticated
    if (token) {
      realtimeService.connect(token).catch(console.error);
    }
    
    return () => {
      realtimeService.disconnect();
    };
  }, [token]);
  
  return (
    <WebSocketProvider>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </WebSocketProvider>
  );
}

export default MyApp;
```

## Usage Examples

### Creating Notifications from Services

```typescript
// Example service that creates notifications
import { Injectable } from '@nestjs/common';
import { NotificationsService } from '../notifications/notifications.service';

@Injectable()
export class TransactionService {
  constructor(private notificationsService: NotificationsService) {}
  
  async processTransaction(userId: string, transactionId: string): Promise<void> {
    try {
      // Process transaction logic...
      
      // Send success notification
      await this.notificationsService.create({
        userId,
        title: 'Transaction Complete',
        message: `Transaction ${transactionId} has been processed successfully.`,
        category: 'success',
        data: {
          transactionId,
          redirectUrl: `/transactions/${transactionId}`
        }
      });
    } catch (error) {
      // Send error notification
      await this.notificationsService.create({
        userId,
        title: 'Transaction Failed',
        message: `Transaction ${transactionId} could not be processed: ${error.message}`,
        category: 'error',
        data: {
          transactionId,
          errorCode: error.code
        }
      });
    }
  }
}
```

### Broadcasting Notifications to All Users

```typescript
// Broadcasting to all users
import { Injectable } from '@nestjs/common';
import { WebSocketGateway } from '../websockets/websocket.gateway';

@Injectable()
export class SystemService {
  constructor(private websocketGateway: WebSocketGateway) {}
  
  async scheduleMaintenance(startTime: Date, duration: number): Promise<void> {
    // Schedule maintenance logic...
    
    // Broadcast to all users
    this.websocketGateway.broadcastNotification(
      'Scheduled Maintenance',
      `The system will be unavailable for maintenance on ${startTime.toLocaleString()} for approximately ${duration} minutes.`,
      'warning',
      {
        startTime: startTime.toISOString(),
        duration
      }
    );
  }
}
```

### Creating Custom Notification Components

```tsx
// Custom notification component for specific notification types
import React from 'react';
import { Notification } from '../types/notification';

interface TransactionNotificationProps {
  notification: Notification;
  onViewTransaction: (transactionId: string) => void;
}

export const TransactionNotification: React.FC<TransactionNotificationProps> = ({
  notification,
  onViewTransaction
}) => {
  const transactionId = notification.data?.transactionId;
  
  const handleViewTransaction = () => {
    if (transactionId) {
      onViewTransaction(transactionId);
    }
  };
  
  return (
    <div className="transaction-notification">
      <h4>{notification.title}</h4>
      <p>{notification.message}</p>
      
      {transactionId && (
        <button onClick={handleViewTransaction}>
          View Transaction
        </button>
      )}
    </div>
  );
};
```
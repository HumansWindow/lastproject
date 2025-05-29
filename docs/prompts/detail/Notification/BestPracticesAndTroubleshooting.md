# Notification System Best Practices & Troubleshooting

This document outlines best practices for working with the notification system and provides troubleshooting guidance for common issues.

## Best Practices

### Backend

#### 1. Notification Creation

- Create notifications as close to the event source as possible
- Use consistent titles and messages for similar notification types
- Include relevant data in the `data` field for frontend actions
- Set appropriate notification categories based on importance

```typescript
// Good practice: Include actionable data
await notificationsService.create({
  userId,
  title: 'Account Verified',
  message: 'Your account has been successfully verified.',
  category: 'success',
  data: {
    accountId: user.id,
    verificationDate: new Date().toISOString(),
    redirectUrl: '/dashboard'
  }
});

// Bad practice: Missing useful data
await notificationsService.create({
  userId,
  title: 'Account Verified',
  message: 'Your account has been successfully verified.',
  category: 'success'
});
```

#### 2. Performance Considerations

- Use bulk operations when sending to multiple users
- Consider using a queue for high-volume notifications
- Set proper indexes on the notifications table
- Implement pagination for notification retrieval
- Clean up old notifications periodically

```typescript
// Good practice: Use batch operations
async batchCreateNotifications(
  userIds: string[],
  title: string,
  message: string,
  category: NotificationCategory,
  data?: Record<string, any>
): Promise<void> {
  const notifications = userIds.map(userId => ({
    userId,
    title,
    message,
    category,
    data,
    isRead: false
  }));
  
  await this.notificationsRepository.createQueryBuilder()
    .insert()
    .into(Notification)
    .values(notifications)
    .execute();
    
  // Send WebSocket notifications in batches
  for (const userId of userIds) {
    this.websocketGateway.sendNotificationToUser(
      userId,
      title,
      message,
      category,
      data
    );
  }
}
```

#### 3. WebSocket Security

- Always validate authentication before allowing subscriptions
- Implement channel authorization logic
- Set appropriate CORS settings
- Rate limit notification subscriptions and connections
- Implement proper error handling

```typescript
// Good practice: Validate subscription permissions
private canSubscribeToChannel(user: User, channel: string): boolean {
  // User-specific notifications
  if (channel === 'notifications') {
    return true;
  }
  
  // Balance updates for a specific address
  if (channel.startsWith('balance:')) {
    const address = channel.split(':')[1].toLowerCase();
    return user.walletAddresses.some(
      wallet => wallet.address.toLowerCase() === address
    );
  }
  
  // Default deny policy
  return false;
}
```

### Frontend

#### 1. Notification Display

- Use non-intrusive notification displays
- Implement sound or visual indicators for new notifications
- Group similar notifications to prevent notification fatigue
- Provide clear actions for notifications when applicable
- Ensure notifications are accessible

#### 2. Connection Management

- Implement proper reconnection logic
- Handle connection status changes gracefully
- Provide visual feedback for connection state
- Add offline support for notifications

```typescript
// Good practice: Reconnection with exponential backoff
private setupReconnection(): void {
  let attempt = 0;
  const maxAttempts = this.config.reconnectAttempts;
  const baseDelay = this.config.reconnectInterval;
  const maxDelay = this.config.maxReconnectInterval;
  
  this.reconnectTimer = setInterval(() => {
    if (this.status !== ConnectionStatus.DISCONNECTED) {
      return;
    }
    
    if (maxAttempts !== Infinity && attempt >= maxAttempts) {
      this.clearReconnectTimer();
      this.setStatus(ConnectionStatus.ERROR);
      return;
    }
    
    attempt++;
    const delay = Math.min(
      baseDelay * Math.pow(this.config.reconnectDecay, attempt - 1),
      maxDelay
    );
    
    setTimeout(() => {
      if (this.status === ConnectionStatus.DISCONNECTED) {
        this.connect(this.authToken).catch(console.error);
      }
    }, delay);
  }, 1000);
}
```

#### 3. Subscription Management

- Always clean up subscriptions when components unmount
- Use custom hooks to manage subscriptions
- Share notification state across components using contexts or services
- Implement proper error handling for failed API calls

```typescript
// Good practice: Using useEffect for cleanup
useEffect(() => {
  // Subscribe to notifications
  const unsubscribe = notificationService.subscribe(
    'notifications',
    handleNotification
  );
  
  // Clean up on unmount
  return () => {
    unsubscribe();
  };
}, []);

// Bad practice: No cleanup
componentDidMount() {
  notificationService.subscribe(
    'notifications',
    this.handleNotification
  );
}
// Missing cleanup in componentWillUnmount
```

#### 4. Storage Management

- Implement storage limits to prevent excessive local storage use
- Clear outdated notifications periodically
- Implement proper sync between local cache and server
- Handle storage errors gracefully

```typescript
// Good practice: Storage limits and error handling
saveNotifications(notifications: Notification[]): void {
  try {
    // Limit storage to prevent excessive use
    const limitedNotifications = notifications
      .slice(0, MAX_STORED_NOTIFICATIONS)
      // Only store essential data
      .map(notification => ({
        id: notification.id,
        title: notification.title,
        message: notification.message,
        category: notification.category,
        isRead: notification.isRead,
        data: notification.data,
        timestamp: notification.timestamp
      }));
      
    localStorage.setItem(STORAGE_KEY, JSON.stringify(limitedNotifications));
  } catch (error) {
    console.error('Failed to save notifications to storage:', error);
    
    // Try to recover by clearing storage
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch (e) {
      // Last resort, disable storage
      this.storageEnabled = false;
    }
  }
}
```

## Troubleshooting

### Common Issues

#### WebSocket Connection Issues

1. **Connection Fails to Establish**
   
   **Symptoms:**
   - WebSocket status remains in `CONNECTING` state
   - Error messages in console about connection failure
   
   **Possible Causes:**
   - Authentication token is invalid or expired
   - WebSocket server URL is incorrect
   - Server is unreachable or down
   - CORS settings are incorrect
   
   **Solutions:**
   - Verify authentication token is valid
   - Check WebSocket URL configuration
   - Ensure server is running
   - Verify CORS settings allow connection from client origin

2. **Frequent Disconnections**
   
   **Symptoms:**
   - WebSocket status fluctuates between `CONNECTED` and `DISCONNECTED`
   - Inconsistent notification delivery
   
   **Possible Causes:**
   - Unstable network connection
   - Server timeouts
   - High server load
   - Missing heartbeat/ping mechanism
   
   **Solutions:**
   - Implement heartbeat mechanism to keep connection alive
   - Increase timeout settings
   - Ensure proper reconnection logic with exponential backoff
   - Implement message buffering during disconnections

3. **WebSocket Authentication Failures**
   
   **Symptoms:**
   - Connection immediately closes after establishment
   - Authentication errors in logs
   
   **Possible Causes:**
   - JWT token is invalid or expired
   - Token is not being sent correctly in query params
   - User doesn't have permission to connect
   
   **Solutions:**
   - Ensure token is valid and not expired
   - Verify token is being sent in the correct format
   - Check permission settings for user

#### Notification Delivery Issues

1. **Notifications Not Being Delivered**
   
   **Symptoms:**
   - WebSocket is connected but notifications don't appear
   - Server logs show notifications being sent
   
   **Possible Causes:**
   - Subscription to notification channel is missing
   - Message format mismatch between server and client
   - Error in notification handling logic
   
   **Solutions:**
   - Verify subscription to the correct channel
   - Ensure consistent message format
   - Check error handling in notification processing

2. **Duplicate Notifications**
   
   **Symptoms:**
   - Same notification appears multiple times
   
   **Possible Causes:**
   - Multiple subscriptions to the same channel
   - Multiple WebSocket connections
   - Duplicate notification creation on server
   
   **Solutions:**
   - Ensure only one subscription per channel
   - Implement deduplication mechanism using notification IDs
   - Check server logic for duplicate notification creation

3. **Missing Notification Data**
   
   **Symptoms:**
   - Notifications arrive with incomplete data
   - Action buttons don't work
   
   **Possible Causes:**
   - Data field not being populated correctly
   - Type mismatch between expected and actual data
   - Server sending incomplete notification objects
   
   **Solutions:**
   - Ensure consistent data structure
   - Implement validation for notification data
   - Add default values for missing properties

#### Notification Storage Issues

1. **Notifications Disappear After Page Refresh**
   
   **Symptoms:**
   - Notifications visible but disappear after refresh
   
   **Possible Causes:**
   - Local storage not being used
   - Storage saving logic failing
   - Storage quota exceeded
   
   **Solutions:**
   - Verify storage implementation
   - Add error handling for storage operations
   - Implement storage limits and cleanup

2. **Inconsistent Read Status**
   
   **Symptoms:**
   - Notifications marked as read appear as unread
   - Unread count is incorrect
   
   **Possible Causes:**
   - Read status not syncing to server
   - Local storage not updating
   - Race conditions between API calls and WebSocket updates
   
   **Solutions:**
   - Ensure read status is updated both locally and on server
   - Implement optimistic updates with error handling
   - Add mechanisms to handle conflicting updates

## Debugging Techniques

### Backend Debugging

1. **Enable WebSocket Logging**

```typescript
// In WebSocket gateway constructor
constructor() {
  this.logger.setLogLevels(['error', 'warn', 'log', 'debug']);
}

// Add detailed debug logs
handleConnection(client: Socket) {
  this.logger.debug(`Client connecting: ${client.id}`);
  // ...
}
```

2. **Monitor WebSocket Connections**

```typescript
// Add metrics to track connections
afterInit() {
  setInterval(() => {
    const connections = this.server.sockets.sockets.size;
    const users = this.userIdToSocketId.size;
    this.logger.log(`Active connections: ${connections}, Connected users: ${users}`);
  }, 30000);
}
```

### Frontend Debugging

1. **Add Connection Status Logging**

```typescript
// In WebSocket service
private setStatus(status: ConnectionStatus): void {
  const prevStatus = this._status;
  this._status = status;
  
  console.debug(
    `WebSocket status change: ${ConnectionStatus[prevStatus]} -> ${ConnectionStatus[status]}`
  );
  
  this.statusSubject.next(status);
}
```

2. **Debug Notification Subscriptions**

```typescript
// Add debug wrapper around subscription
subscribe<T>(channel: string, callback: (data: T) => void): () => void {
  console.debug(`Subscribing to channel: ${channel}`);
  
  const wrappedCallback = (data: T) => {
    console.debug(`Received message on channel ${channel}:`, data);
    callback(data);
  };
  
  const unsubscribe = this.manager.subscribe(channel, wrappedCallback);
  
  return () => {
    console.debug(`Unsubscribing from channel: ${channel}`);
    unsubscribe();
  };
}
```

## Performance Optimization

### Backend Optimization

1. **Implement Notification Batching**

For high-volume notifications, batch notifications to multiple users:

```typescript
async batchSendNotifications(
  notifications: Array<{ userId: string; title: string; message: string; category: string; data?: any }>
): Promise<void> {
  // Group notifications by user ID for efficient WebSocket delivery
  const notificationsByUser = notifications.reduce((acc, notification) => {
    if (!acc[notification.userId]) {
      acc[notification.userId] = [];
    }
    acc[notification.userId].push(notification);
    return acc;
  }, {});
  
  // Send notifications in batches
  for (const [userId, userNotifications] of Object.entries(notificationsByUser)) {
    this.websocketGateway.sendBatchNotificationsToUser(userId, userNotifications);
  }
}
```

2. **Add Database Indexes for Notification Queries**

```typescript
@Entity('notifications')
export class Notification {
  // ...
  
  @Column({ name: 'user_id' })
  @Index()
  userId: string;

  @Column({ default: false })
  @Index()
  isRead: boolean;
  
  @CreateDateColumn({ name: 'created_at' })
  @Index()
  createdAt: Date;
  
  // ...
}
```

### Frontend Optimization

1. **Implement Virtual Scrolling for Long Notification Lists**

```tsx
import { VirtualScroll } from '../components/VirtualScroll';

export const OptimizedNotificationList: React.FC = () => {
  const { notifications } = useNotifications();
  
  return (
    <div className="notification-list">
      <VirtualScroll
        items={notifications}
        height={400}
        itemHeight={80}
        renderItem={(notification) => (
          <NotificationItem
            key={notification.id}
            notification={notification}
            onMarkAsRead={() => notificationService.markAsRead(notification.id)}
            onRemove={() => notificationService.removeNotification(notification.id)}
          />
        )}
      />
    </div>
  );
};
```

2. **Implement Notification Grouping**

```typescript
type GroupedNotifications = {
  [date: string]: Notification[];
};

function groupNotificationsByDate(notifications: Notification[]): GroupedNotifications {
  return notifications.reduce((groups, notification) => {
    const date = new Date(notification.timestamp).toLocaleDateString();
    
    if (!groups[date]) {
      groups[date] = [];
    }
    
    groups[date].push(notification);
    return groups;
  }, {} as GroupedNotifications);
}
```
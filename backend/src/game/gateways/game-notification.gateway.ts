import { WebSocketGateway, WebSocketServer, SubscribeMessage, OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit } from '@nestjs/websockets';
import { UseGuards, Logger, Injectable } from '@nestjs/common';
import { Server, Socket } from 'socket.io';
import { WsJwtAuthGuard } from '../../auth/guards/ws-auth.guard';
import { OnEvent } from '@nestjs/event-emitter';
import { GameNotificationService } from '../services/game-notification.service';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { WsUser } from '../../auth/decorators/ws-user.decorator';
import { User } from '../../users/entities/user.entity';

interface SubscribeData {
  channel: string;
}

@WebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  },
  namespace: 'game-notifications',
  path: '/game/notifications/ws'
})
@Injectable()
export class GameNotificationGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  private userSocketMap: Map<string, Set<string>> = new Map();
  private socketUserMap: Map<string, string> = new Map();
  private clientSubscriptions: Map<string, Set<string>> = new Map();
  
  private readonly logger = new Logger(GameNotificationGateway.name);

  constructor(
    private readonly notificationService: GameNotificationService,
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService
  ) {}
  
  afterInit(server: Server): void {
    this.logger.log('Game Notification WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket): Promise<void> {
    try {
      // Extract token from query params
      const token = client.handshake.query.token as string;
      
      if (!token) {
        this.logger.error(`Client ${client.id} disconnected: No token provided`);
        client.disconnect();
        return;
      }

      // Verify token and get user ID
      const userId = await this.getUserIdFromToken(token);
      
      if (!userId) {
        this.logger.error(`Client ${client.id} disconnected: Invalid token`);
        client.disconnect();
        return;
      }
      
      // Store user connection info
      this.addUserSocket(userId, client.id);
      
      // Initialize client subscriptions set
      this.clientSubscriptions.set(client.id, new Set());
      
      // Send unread notification count to connected user
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
      
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket): void {
    // Clean up user socket mappings
    const userId = this.socketUserMap.get(client.id);
    if (userId) {
      this.removeUserSocket(userId, client.id);
    }
    
    // Remove subscription data
    this.clientSubscriptions.delete(client.id);
    
    this.logger.log(`Client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @WsUser() user: User,
    client: Socket,
    data: SubscribeData
  ) {
    if (!data.channel) {
      return { error: 'No channel provided' };
    }

    // Check if user has permission to subscribe to this channel
    if (!this.canSubscribeToChannel(user.id, data.channel)) {
      this.logger.warn(`User ${user.id} attempted to subscribe to unauthorized channel ${data.channel}`);
      return { error: 'Unauthorized subscription attempt' };
    }

    // Store subscription
    const clientSubs = this.clientSubscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.add(data.channel);
    }
    
    this.logger.log(`Client ${client.id} subscribed to ${data.channel}`);
    return { success: true };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(client: Socket, data: SubscribeData) {
    if (!data.channel) {
      return { error: 'No channel provided' };
    }

    // Remove subscription
    const clientSubs = this.clientSubscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.delete(data.channel);
    }

    this.logger.log(`Client ${client.id} unsubscribed from ${data.channel}`);
    return { success: true };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('get_notifications')
  async getNotifications(client: Socket, payload: { limit?: number; offset?: number; status?: 'read' | 'unread' | 'all' }): Promise<void> {
    const userId = this.socketUserMap.get(client.id);
    if (!userId) return;
    
    try {
      const result = await this.notificationService.getUserNotifications(userId, payload);
      client.emit('notifications', result);
    } catch (error) {
      client.emit('error', { message: 'Failed to fetch notifications' });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('mark_read')
  async markNotificationsAsRead(client: Socket, payload: { ids: string[] }): Promise<void> {
    const userId = this.socketUserMap.get(client.id);
    if (!userId || !payload?.ids?.length) return;
    
    try {
      await this.notificationService.markAsReadBulk(payload.ids, userId);
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
    } catch (error) {
      client.emit('error', { message: 'Failed to mark notifications as read' });
    }
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('delete_notifications')
  async deleteNotifications(client: Socket, payload: { ids: string[] }): Promise<void> {
    const userId = this.socketUserMap.get(client.id);
    if (!userId || !payload?.ids?.length) return;
    
    try {
      await this.notificationService.deleteNotifications(payload.ids, userId);
      const unreadCount = await this.notificationService.getUnreadCount(userId);
      client.emit('unread_count', { count: unreadCount });
    } catch (error) {
      client.emit('error', { message: 'Failed to delete notifications' });
    }
  }

  @OnEvent('notification.created')
  handleNotificationCreated(payload: { userId: string; notification: any }): void {
    this.sendToUser(payload.userId, 'new_notification', {
      notification: payload.notification
    });
    
    // Also update unread count
    this.notificationService.getUnreadCount(payload.userId)
      .then(count => {
        this.sendToUser(payload.userId, 'unread_count', { count });
      })
      .catch(() => {});
  }

  @OnEvent('notification.read')
  handleNotificationRead(payload: { userId: string; notificationIds: string[] }): void {
    this.sendToUser(payload.userId, 'notifications_read', {
      ids: payload.notificationIds
    });
  }

  @OnEvent('notification.deleted')
  handleNotificationDeleted(payload: { userId: string; notificationIds: string[] }): void {
    this.sendToUser(payload.userId, 'notifications_deleted', {
      ids: payload.notificationIds
    });
  }

  /**
   * Send a notification to a specific user
   * @param userId User ID
   * @param title Notification title
   * @param message Notification message
   * @param category Notification category (info, success, warning, error)
   * @param data Additional data
   */
  public sendNotificationToUser(
    userId: string,
    title: string,
    message: string,
    category: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ): void {
    this.logger.debug(`Sending notification to user ${userId}: ${title}`);
    
    // Create notification payload
    const payload = {
      userId,
      title,
      message,
      category,
      data,
      timestamp: Date.now(),
      isRead: false
    };

    // Send to the user's notification channel
    this.sendToUser(userId, 'game:notifications', payload);
    
    // Also send to a specific notifications-only channel for listeners
    this.sendToUser(userId, `user:${userId}:notifications`, payload);
  }

  /**
   * Send a batch notification update to a user (for unread notifications count, etc.)
   * @param userId User ID
   * @param unreadCount Number of unread notifications
   */
  public sendNotificationCountUpdate(
    userId: string,
    unreadCount: number
  ): void {
    this.logger.debug(`Sending notification count update to user ${userId}: ${unreadCount} unread`);
    
    const payload = {
      unreadCount,
      timestamp: Date.now()
    };

    // Send to the user's notification count channel
    this.sendToUser(userId, `user:${userId}:notifications:count`, payload);
    this.sendToUser(userId, 'unread_count', { count: unreadCount });
  }

  /**
   * Send a module unlock notification
   * @param userId User ID
   * @param moduleId Module ID
   * @param moduleTitle Module title
   * @param unlockType Type of unlock
   */
  public sendModuleUnlockNotification(
    userId: string,
    moduleId: string,
    moduleTitle: string,
    unlockType: 'timer_completed' | 'expedited' | 'admin_action'
  ): void {
    let title: string;
    let message: string;
    let category: 'info' | 'success' = 'success';
    
    switch (unlockType) {
      case 'expedited':
        title = 'Module Unlocked Early!';
        message = `You've expedited access to "${moduleTitle}". You can start learning right now!`;
        break;
      case 'admin_action':
        title = 'Module Unlocked by Admin';
        message = `An administrator has unlocked "${moduleTitle}" for you.`;
        category = 'info';
        break;
      case 'timer_completed':
      default:
        title = 'New Module Available';
        message = `Your waiting period is over! "${moduleTitle}" is now available to start.`;
        break;
    }
    
    // Send the notification
    this.sendNotificationToUser(
      userId,
      title,
      message,
      category,
      {
        moduleId,
        moduleTitle,
        unlockType,
        action: 'start_module'
      }
    );
    
    // Also send to module-specific channel
    this.sendToChannel(`module:${moduleId}:unlock`, {
      userId,
      moduleId,
      moduleTitle,
      unlockType,
      timestamp: Date.now()
    });
  }

  /**
   * Send a waiting period update notification
   */
  public sendWaitingPeriodUpdateNotification(
    userId: string,
    moduleId: string,
    moduleTitle: string,
    remainingHours: number,
    totalWaitHours: number
  ): void {
    // Calculate percentage complete
    const percentComplete = Math.round(((totalWaitHours - remainingHours) / totalWaitHours) * 100);
    const isHalfway = percentComplete >= 50;
    const isAlmostDone = percentComplete >= 75;
    
    let title: string;
    let message: string;
    
    if (isAlmostDone) {
      title = 'Almost There!';
      message = `"${moduleTitle}" is almost ready! Just ${remainingHours} hours left until you can start.`;
    } else if (isHalfway) {
      title = 'Halfway There!';
      message = `You're halfway through the waiting period for "${moduleTitle}". ${remainingHours} hours to go!`;
    } else {
      title = 'Module Unlocking Soon';
      message = `${remainingHours} hours remaining until "${moduleTitle}" unlocks.`;
    }
    
    this.sendNotificationToUser(
      userId,
      title,
      message,
      'info',
      {
        moduleId,
        moduleTitle,
        remainingHours,
        totalWaitHours,
        percentComplete,
        action: 'view_module_status'
      }
    );
  }
  
  /**
   * Send an achievement notification
   */
  public sendAchievementNotification(
    userId: string,
    achievementId: string,
    achievementTitle: string,
    moduleId?: string,
    xpEarned?: number
  ): void {
    const title = 'Achievement Unlocked!';
    let message = `You've earned the "${achievementTitle}" achievement!`;
    
    if (xpEarned) {
      message += ` (+${xpEarned} XP)`;
    }
    
    this.sendNotificationToUser(
      userId,
      title,
      message,
      'success',
      {
        achievementId,
        achievementTitle,
        moduleId,
        xpEarned,
        action: 'view_achievement'
      }
    );
    
    // Also broadcast to achievement channel for any listeners
    this.sendToChannel(`achievements:${userId}`, {
      userId,
      achievementId,
      achievementTitle,
      moduleId,
      xpEarned,
      timestamp: Date.now()
    });
  }

  /**
   * Send XP earned notification
   */
  public sendXpEarnedNotification(
    userId: string,
    xpAmount: number,
    reason: string,
    moduleId?: string
  ): void {
    // Only send as general notification for significant XP gains (> 10)
    if (xpAmount > 10) {
      const title = 'XP Earned';
      const message = `You've earned ${xpAmount} XP for ${reason}!`;
      
      this.sendNotificationToUser(userId, title, message, 'success', {
        xpAmount,
        reason,
        moduleId,
        action: moduleId ? 'view_module_status' : undefined
      });
    }
    
    // Send to user's XP channel regardless of amount
    this.sendToChannel(`xp:${userId}`, {
      userId,
      xpAmount,
      reason,
      moduleId,
      timestamp: Date.now()
    });
  }

  // Helper methods to manage user-socket mappings
  private addUserSocket(userId: string, socketId: string): void {
    // Add to user->sockets mapping
    const userSockets = this.userSocketMap.get(userId) || new Set();
    userSockets.add(socketId);
    this.userSocketMap.set(userId, userSockets);
    
    // Add to socket->user mapping
    this.socketUserMap.set(socketId, userId);
  }
  
  private removeUserSocket(userId: string, socketId: string): void {
    // Remove from socket->user mapping
    this.socketUserMap.delete(socketId);
    
    // Remove from user->sockets mapping
    const userSockets = this.userSocketMap.get(userId);
    if (userSockets) {
      userSockets.delete(socketId);
      if (userSockets.size === 0) {
        this.userSocketMap.delete(userId);
      } else {
        this.userSocketMap.set(userId, userSockets);
      }
    }
  }
  
  /**
   * Send a message to a specific user across all their connected sockets
   */
  private sendToUser(userId: string, event: string, data: any): void {
    const userSockets = this.userSocketMap.get(userId);
    if (userSockets) {
      userSockets.forEach(socketId => {
        this.server.to(socketId).emit(event, data);
      });
    }
  }
  
  /**
   * Send a message to all subscribed clients for a specific channel
   */
  private sendToChannel(channel: string, data: any): void {
    for (const [clientId, channels] of this.clientSubscriptions.entries()) {
      if (channels.has(channel)) {
        this.server.to(clientId).emit(channel, data);
      }
    }
  }
  
  /**
   * Check if user can subscribe to a channel
   */
  private canSubscribeToChannel(userId: string, channel: string): boolean {
    // Users can subscribe to their own notification channels
    if (channel === 'game:notifications' || 
        channel === `user:${userId}:notifications` ||
        channel === `user:${userId}:notifications:count`) {
      return true;
    }
    
    // Users can subscribe to their own module channels
    if (channel.startsWith('module:') && channel.includes(`:user:${userId}`)) {
      return true;
    }
    
    // Users can subscribe to their own achievements channel
    if (channel === `achievements:${userId}`) {
      return true;
    }
    
    // Users can subscribe to their own XP channel
    if (channel === `xp:${userId}`) {
      return true;
    }
    
    // Add more channel permission logic here if needed
    
    // Default to false for any other channels
    return false;
  }
  
  /**
   * Verify JWT token and extract user ID
   */
  private async getUserIdFromToken(token: string): Promise<string | null> {
    try {
      // Verify the JWT token
      const payload = await this.jwtService.verifyAsync(token, {
        secret: this.configService.get<string>('JWT_SECRET')
      });
      
      if (!payload || !payload.sub) {
        this.logger.warn('Invalid token payload');
        return null;
      }
      
      // Validate that user exists
      const user = await this.usersService.findOne(payload.sub);
      
      if (!user) {
        this.logger.warn(`User not found for ID ${payload.sub}`);
        return null;
      }
      
      return payload.sub;
    } catch (error) {
      this.logger.error(`Token verification failed: ${error.message}`);
      return null;
    }
  }
}

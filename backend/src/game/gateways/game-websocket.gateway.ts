import {
  WebSocketGateway as NestWebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  OnGatewayInit,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Logger, UseGuards, Inject } from '@nestjs/common';
import { WsJwtAuthGuard } from '../../auth/guards/ws-auth.guard';
import { WsUser } from '@/auth/decorators/ws-user.decorator';
import { User } from '../../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';
import { Injectable } from '@nestjs/common';
import { BlockchainWebSocketGateway } from '../../blockchain/gateways/websocket.gateway';

interface SubscribeData {
  channel: string;
}

@NestWebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  },
  namespace: '/game',
  path: '/game/ws'
})
@Injectable()
export class GameWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  // Track client subscriptions
  private clientSubscriptions: Map<string, Set<string>> = new Map();
  private userIdToSocketId: Map<string, Set<string>> = new Map();
  private socketIdToUserId: Map<string, string> = new Map();

  private readonly logger = new Logger('GameWebSocketGateway');

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService,
    private readonly wsGateway: BlockchainWebSocketGateway
  ) {}

  afterInit(server: Server) {
    this.logger.log('Game WebSocket Gateway initialized');
  }

  async handleConnection(client: Socket) {
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
      this.socketIdToUserId.set(client.id, userId);
      
      if (!this.userIdToSocketId.has(userId)) {
        this.userIdToSocketId.set(userId, new Set());
      }
      this.userIdToSocketId.get(userId).add(client.id);
      
      // Initialize client subscriptions set
      this.clientSubscriptions.set(client.id, new Set());
      
      this.logger.log(`Game client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Error handling game connection: ${error.message}`);
      client.disconnect();
    }
  }

  handleDisconnect(client: Socket) {
    // Clean up client subscription data
    const userId = this.socketIdToUserId.get(client.id);
    
    if (userId) {
      const userSockets = this.userIdToSocketId.get(userId);
      if (userSockets) {
        userSockets.delete(client.id);
        if (userSockets.size === 0) {
          this.userIdToSocketId.delete(userId);
        }
      }
      this.socketIdToUserId.delete(client.id);
    }
    
    this.clientSubscriptions.delete(client.id);
    this.logger.log(`Game client disconnected: ${client.id}`);
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('subscribe')
  handleSubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribeData,
    @WsUser() user: User
  ) {
    if (!data.channel) {
      return { error: 'No channel provided' };
    }

    // Check if user has permission to subscribe to this channel
    if (!this.canSubscribeToChannel(user, data.channel)) {
      this.logger.warn(`User ${user.id} attempted to subscribe to unauthorized game channel ${data.channel}`);
      return { error: 'Unauthorized subscription attempt' };
    }

    // Store subscription
    const clientSubs = this.clientSubscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.add(data.channel);
    }
    
    this.logger.log(`Game client ${client.id} subscribed to ${data.channel}`);
    return { success: true };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('unsubscribe')
  handleUnsubscribe(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: SubscribeData
  ) {
    if (!data.channel) {
      return { error: 'No channel provided' };
    }

    // Remove subscription
    const clientSubs = this.clientSubscriptions.get(client.id);
    if (clientSubs) {
      clientSubs.delete(data.channel);
    }

    this.logger.log(`Game client ${client.id} unsubscribed from ${data.channel}`);
    return { success: true };
  }

  @UseGuards(WsJwtAuthGuard)
  @SubscribeMessage('ping')
  handlePing() {
    return { type: 'pong', timestamp: Date.now() };
  }

  /**
   * Send a message to all clients subscribed to a specific channel
   * @param channel The channel name
   * @param message The message payload
   */
  public sendToChannel(channel: string, message: any): void {
    // Combine the channel and message into proper format
    const formattedMessage = {
      type: channel,
      payload: message,
      timestamp: Date.now()
    };
    
    let clientsSent = 0;
    
    // Send to all subscribed clients
    for (const [clientId, channels] of this.clientSubscriptions.entries()) {
      if (channels.has(channel)) {
        this.server.to(clientId).emit('message', formattedMessage);
        clientsSent++;
      }
    }
    
    this.logger.debug(`Sent game ${channel} event to ${clientsSent} clients`);
  }
  
  /**
   * Send a message to a specific user by user ID
   * @param userId User ID
   * @param channel Channel name
   * @param message Message payload
   */
  public sendToUser(userId: string, channel: string, message: any): void {
    const socketIds = this.userIdToSocketId.get(userId);
    
    if (!socketIds || socketIds.size === 0) {
      this.logger.debug(`No active game connections for user ${userId}`);
      return;
    }
    
    const formattedMessage = {
      type: channel,
      payload: message,
      timestamp: Date.now()
    };
    
    // Send to all user's connections
    socketIds.forEach(socketId => {
      this.server.to(socketId).emit('message', formattedMessage);
    });
    
    this.logger.debug(`Sent game ${channel} event to user ${userId} (${socketIds.size} connections)`);
  }

  /**
   * Send a notification to a user about game-related events
   * @param userId User ID
   * @param title Notification title
   * @param message Notification message
   * @param category Notification category (info, success, warning, error)
   * @param data Additional data
   */
  public sendGameNotificationToUser(
    userId: string,
    title: string,
    message: string,
    category: 'info' | 'success' | 'warning' | 'error' = 'info',
    data: Record<string, any> = {}
  ): void {
    this.logger.debug(`Sending game notification to user ${userId}: ${title}`);
    
    // Use the existing WebSocket gateway to send the notification
    this.wsGateway.sendToUser(userId, 'game:notifications', {
      title,
      message,
      category,
      timestamp: Date.now(),
      ...data
    });
  }

  /**
   * Send a module unlock notification
   * @param userId User ID
   * @param moduleId Module ID
   * @param moduleTitle Module title
   * @param unlockType Type of unlock (timer_completed, expedited, admin_action)
   */
  public sendModuleUnlockNotification(
    userId: string,
    moduleId: string,
    moduleTitle: string,
    unlockType: 'timer_completed' | 'expedited' | 'admin_action'
  ): void {
    this.logger.debug(`Sending module unlock notification to user ${userId} for module ${moduleId}`);
    
    // Use the user-specific channel for module updates
    this.wsGateway.sendToUser(userId, `game:modules:user:${userId}`, {
      type: 'module_unlock',
      moduleId,
      moduleTitle,
      unlockType,
      timestamp: Date.now()
    });
    
    // Also send as a general notification for the notifications panel
    const category = unlockType === 'expedited' ? 'success' : 'info';
    let title = 'Module Unlocked';
    let message = `You've unlocked "${moduleTitle}"!`;
    
    if (unlockType === 'expedited') {
      title = 'Module Unlocked Early';
      message = `You've successfully expedited access to "${moduleTitle}"!`;
    }
    
    this.sendGameNotificationToUser(userId, title, message, category, {
      moduleId,
      moduleTitle,
      action: 'start_module'
    });
  }

  /**
   * Send an achievement notification
   * @param userId User ID
   * @param achievementId Achievement ID
   * @param achievementTitle Achievement title
   * @param moduleId Optional module ID
   * @param xpEarned Optional XP earned
   */
  public sendAchievementNotification(
    userId: string,
    achievementId: string,
    achievementTitle: string,
    moduleId?: string,
    xpEarned?: number
  ): void {
    this.logger.debug(`Sending achievement notification to user ${userId} for achievement ${achievementId}`);
    
    // Use the achievements channel
    this.wsGateway.sendToUser(userId, `game:achievements:${userId}`, {
      type: 'achievement_earned',
      achievementId,
      achievementTitle,
      moduleId,
      xpEarned,
      timestamp: Date.now()
    });
    
    // Also send as a general notification
    let message = `You've earned the "${achievementTitle}" achievement!`;
    if (xpEarned) {
      message += ` (+${xpEarned} XP)`;
    }
    
    this.sendGameNotificationToUser(userId, 'Achievement Unlocked!', message, 'success', {
      achievementId,
      achievementTitle,
      moduleId,
      xpEarned,
      action: 'view_achievement'
    });
  }

  /**
   * Send a waiting period update notification
   * @param userId User ID
   * @param moduleId Module ID
   * @param moduleTitle Module title
   * @param remainingHours Remaining hours
   * @param totalWaitHours Total wait hours
   */
  public sendWaitingPeriodUpdateNotification(
    userId: string,
    moduleId: string,
    moduleTitle: string,
    remainingHours: number,
    totalWaitHours: number
  ): void {
    this.logger.debug(`Sending waiting period update to user ${userId} for module ${moduleId}`);
    
    // Calculate the percentage complete
    const percentComplete = Math.floor(((totalWaitHours - remainingHours) / totalWaitHours) * 100);
    
    // Send the notification
    this.wsGateway.sendToUser(userId, `game:modules:user:${userId}`, {
      type: 'waiting_period_update',
      moduleId,
      moduleTitle,
      remainingHours,
      totalWaitHours,
      percentComplete,
      timestamp: Date.now()
    });
    
    // If we're at 50% or more, also send a general notification
    if (percentComplete >= 50) {
      const message = `${remainingHours} hours remaining until "${moduleTitle}" unlocks! (${percentComplete}% complete)`;
      
      this.sendGameNotificationToUser(userId, 'Module Unlock Progress', message, 'info', {
        moduleId,
        moduleTitle,
        remainingHours,
        totalWaitHours,
        percentComplete,
        action: 'view_module_status'
      });
    }
  }

  /**
   * Send XP earned notification
   * @param userId User ID
   * @param xpAmount XP amount
   * @param reason Reason for XP
   * @param moduleId Optional module ID
   */
  public sendXpEarnedNotification(
    userId: string,
    xpAmount: number,
    reason: string,
    moduleId?: string
  ): void {
    this.logger.debug(`Sending XP earned notification to user ${userId} for ${xpAmount} XP`);
    
    // Send to user's XP channel
    this.wsGateway.sendToUser(userId, `game:xp:${userId}`, {
      type: 'xp_earned',
      xpAmount,
      reason,
      moduleId,
      timestamp: Date.now()
    });
    
    // Only send as general notification for significant XP gains (> 10)
    if (xpAmount > 10) {
      const title = 'XP Earned';
      const message = `You've earned ${xpAmount} XP for ${reason}!`;
      
      this.sendGameNotificationToUser(userId, title, message, 'success', {
        xpAmount,
        reason,
        moduleId,
        action: moduleId ? 'view_module_status' : undefined
      });
    }
  }

  /**
   * Check if a user can subscribe to a specific channel
   * @param user User entity
   * @param channel Channel name
   * @returns Whether the user has permission to subscribe to the channel
   */
  private canSubscribeToChannel(user: User, channel: string): boolean {
    // Users can subscribe to their own module channels
    if (channel.startsWith('game:modules:user:')) {
      const userId = channel.split(':')[3];
      return user.id === userId;
    }
    
    // Users can subscribe to their own achievements channel
    if (channel.startsWith('game:achievements:')) {
      const userId = channel.split(':')[2];
      return user.id === userId;
    }
    
    // Users can subscribe to module status channels for modules they've registered for
    if (channel.startsWith('game:module:') && channel.endsWith(':status')) {
      // Module-specific permissions would be checked here
      // For now, allowing all as we'll check on the service side
      return true;
    }
    
    // Public game channels
    const publicChannels = ['game:notifications', 'game:leaderboard:updates'];
    if (publicChannels.includes(channel)) {
      return true;
    }
    
    // Default to denied
    return false;
  }

  /**
   * Verify JWT token and extract user ID
   * @param token JWT token from client
   * @returns User ID if token is valid, null otherwise
   */
  private async getUserIdFromToken(token: string): Promise<string | null> {
    try {
      // Verify the JWT token using the same service used in WsJwtAuthGuard
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
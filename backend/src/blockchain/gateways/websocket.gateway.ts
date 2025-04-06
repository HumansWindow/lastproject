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
// Fix import path for the WsUser decorator using the correct path alias
import { WsUser } from '@/auth/decorators/ws-user.decorator';
import { User } from '../../users/entities/user.entity';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { UsersService } from '../../users/users.service';

interface SubscribeData {
  channel: string;
}

@NestWebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  },
  namespace: '/ws',
  path: '/ws'
})
export class BlockchainWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  // Track client subscriptions
  private clientSubscriptions: Map<string, Set<string>> = new Map();
  private userIdToSocketId: Map<string, Set<string>> = new Map();
  private socketIdToUserId: Map<string, string> = new Map();

  private readonly logger = new Logger('BlockchainWebSocketGateway');

  constructor(
    private jwtService: JwtService,
    private configService: ConfigService,
    private usersService: UsersService
  ) {}

  afterInit(server: Server) {
    this.logger.log('WebSocket Gateway initialized');
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
      
      this.logger.log(`Client connected: ${client.id} (User: ${userId})`);
    } catch (error) {
      this.logger.error(`Error handling connection: ${error.message}`);
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
    this.logger.log(`Client disconnected: ${client.id}`);
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

    this.logger.log(`Client ${client.id} unsubscribed from ${data.channel}`);
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
    
    this.logger.debug(`Sent ${channel} event to ${clientsSent} clients`);
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
      this.logger.debug(`No active connections for user ${userId}`);
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
    
    this.logger.debug(`Sent ${channel} event to user ${userId} (${socketIds.size} connections)`);
  }

  /**
   * Send a notification to a specific user
   * @param userId User ID
   * @param title Notification title
   * @param message Notification message
   * @param category Notification category (info, success, warning, error)
   * @param data Additional data for the notification
   */
  public sendNotificationToUser(
    userId: string,
    title: string,
    message: string,
    category: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ): void {
    this.sendToUser(userId, 'notifications', {
      userId,
      title,
      message,
      category,
      isRead: false,
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Broadcast a notification to all connected clients
   * @param title Notification title
   * @param message Notification message
   * @param category Notification category (info, success, warning, error)
   * @param data Additional data for the notification
   */
  public broadcastNotification(
    title: string,
    message: string,
    category: 'info' | 'success' | 'warning' | 'error' = 'info',
    data?: Record<string, any>
  ): void {
    this.server.emit('message', {
      type: 'notifications',
      payload: {
        title,
        message,
        category,
        isRead: false,
        data,
        timestamp: Date.now()
      },
      timestamp: Date.now()
    });
  }

  /**
   * Send a balance change event to subscribed clients
   * @param address Wallet address
   * @param previousBalance Previous balance (string representation of BigNumber)
   * @param newBalance New balance (string representation of BigNumber)
   * @param formattedPreviousBalance Human-readable previous balance
   * @param formattedNewBalance Human-readable new balance
   * @param txHash Transaction hash (optional)
   * @param chainId Blockchain network ID
   * @param networkName Human-readable network name
   * @param blockNumber Block number where the transaction was included
   */
  public sendBalanceChangeEvent(
    address: string,
    previousBalance: string,
    newBalance: string,
    formattedPreviousBalance: string,
    formattedNewBalance: string,
    chainId: number,
    networkName: string,
    blockNumber: number,
    txHash?: string,
  ): void {
    const channel = `balance:${address.toLowerCase()}`;
    
    const balanceEvent = {
      address,
      previousBalance,
      newBalance,
      formattedPreviousBalance,
      formattedNewBalance,
      txHash,
      blockNumber,
      chainId,
      networkName,
      type: 'balance-change',
      timestamp: Date.now()
    };
    
    this.sendToChannel(channel, balanceEvent);
  }

  /**
   * Send an NFT transfer event to subscribed clients
   * @param tokenId The NFT token ID
   * @param contractAddress The NFT contract address
   * @param from Sender address
   * @param to Recipient address
   * @param txHash Transaction hash
   * @param blockNumber Block number where the transaction was included
   * @param chainId Blockchain network ID
   * @param networkName Human-readable network name
   * @param metadata Optional NFT metadata
   */
  public sendNftTransferEvent(
    tokenId: string,
    contractAddress: string,
    from: string,
    to: string,
    txHash: string,
    blockNumber: number,
    chainId: number,
    networkName: string,
    metadata?: {
      name?: string;
      image?: string;
      description?: string;
    }
  ): void {
    // Send to both 'from' and 'to' address channels
    const fromChannel = `nft:${from.toLowerCase()}`;
    const toChannel = `nft:${to.toLowerCase()}`;
    
    const transferEvent = {
      tokenId,
      contractAddress,
      from,
      to,
      txHash,
      blockNumber,
      chainId,
      networkName,
      metadata,
      type: 'nft-transfer',
      timestamp: Date.now()
    };
    
    // Send to both sender and receiver
    this.sendToChannel(fromChannel, transferEvent);
    this.sendToChannel(toChannel, transferEvent);
  }

  /**
   * Send a token price update event
   * @param symbol Token symbol (e.g., 'SHAHI')
   * @param price Current price
   * @param previousPrice Previous price
   * @param change24h Absolute price change in last 24h
   * @param changePercent24h Percentage change in last 24h
   * @param volume24h Trading volume in last 24h (optional)
   * @param marketCap Market capitalization (optional)
   */
  public sendTokenPriceEvent(
    symbol: string,
    price: number,
    previousPrice: number,
    change24h: number,
    changePercent24h: number,
    volume24h?: number,
    marketCap?: number
  ): void {
    const priceEvent = {
      symbol,
      price,
      previousPrice,
      change24h,
      changePercent24h,
      volume24h,
      marketCap,
      type: 'token-price',
      timestamp: Date.now()
    };
    
    this.sendToChannel('token:price', priceEvent);
  }

  /**
   * Send a staking update event
   * @param positionId Staking position ID
   * @param userId User ID
   * @param walletAddress User's wallet address
   * @param rewards Current rewards (string representation of BigNumber)
   * @param formattedRewards Human-readable reward amount
   * @param apy Current APY percentage
   * @param daysRemaining Days remaining until lock period ends
   */
  public sendStakingUpdateEvent(
    positionId: string,
    userId: string,
    walletAddress: string,
    rewards: string,
    formattedRewards: string,
    apy: number,
    daysRemaining: number
  ): void {
    const channel = `staking:${positionId}`;
    
    const stakingEvent = {
      positionId,
      userId,
      walletAddress,
      rewards,
      formattedRewards,
      apy,
      daysRemaining,
      type: 'staking-update',
      timestamp: Date.now()
    };
    
    this.sendToChannel(channel, stakingEvent);
  }

  /**
   * Check if a user can subscribe to a specific channel
   * @param user User entity
   * @param channel Channel name
   * @returns Whether the user has permission to subscribe to the channel
   */
  private canSubscribeToChannel(user: User, channel: string): boolean {
    // Users can subscribe to their own balance changes
    if (channel.startsWith('balance:')) {
      const address = channel.split(':')[1]?.toLowerCase();
      return user.walletAddress?.toLowerCase() === address;
    }
    
    // Users can subscribe to their own NFT transfers
    if (channel.startsWith('nft:')) {
      const address = channel.split(':')[1]?.toLowerCase();
      return user.walletAddress?.toLowerCase() === address;
    }
    
    // Users can subscribe to their own staking positions
    if (channel.startsWith('staking:')) {
      const positionId = channel.split(':')[1];
      // You would check if this position belongs to the user
      // This is a simplified example - implement your own logic
      return true; // Implement proper check based on your database
    }
    
    // Allow certain channels for all authenticated users
    const publicChannels = ['notifications', 'token:price'];
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
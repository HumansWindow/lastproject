import { WebSocketManager, ConnectionStatus } from '../realtime/websocket/websocket-manager';

/**
 * WebSocket URL - Using Next.js environment variables
 */
const WS_URL = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:3001';

/**
 * Event interface for balance updates
 */
export interface BalanceUpdateEvent {
  walletAddress: string;
  previousBalance: string;
  newBalance: string;
  formattedPreviousBalance: string;
  formattedNewBalance: string;
  tokenAddress?: string;
  tokenSymbol?: string;
  timestamp: number;
}

/**
 * Event interface for notifications
 */
export interface NotificationEvent {
  id: string;
  title: string;
  message: string;
  type?: 'info' | 'success' | 'warning' | 'error';
  timestamp?: number;
  link?: string;
  data?: Record<string, any>;
}

/**
 * Event interface for NFT transfers
 */
export interface NftTransferEvent {
  tokenId: string;
  contractAddress: string;
  from: string;
  to: string;
  txHash: string;
  timestamp: number;
  confirmed: boolean;
  metadata?: {
    name?: string;
    description?: string;
    imageUrl?: string;
    attributes?: Array<{
      trait_type: string;
      value: string | number;
    }>;
    [key: string]: any;
  };
}

/**
 * Event interface for token price updates
 */
export interface TokenPriceEvent {
  symbol: string;
  name: string;
  price: number;
  changePercent24h: number;
  volumeUsd24h: number;
  marketCapUsd: number;
  timestamp: number;
}

/**
 * Event interface for staking updates
 */
export interface StakingUpdateEvent {
  positionId: string;
  rewards: string;
  formattedRewards: string;
  rewardsToken: string;
  apy: number;
  totalStaked: string;
  formattedTotalStaked: string;
  startTimestamp: number;
  endTimestamp: number;
  daysRemaining: number;
  timestamp: number;
}

/**
 * Type for WebSocket message handlers
 */
type MessageHandler<T> = (data: T) => void;

/**
 * Type for WebSocket error handlers
 */
type ErrorHandler = (error: any) => void;

/**
 * RealTime Service for handling WebSocket connections and subscriptions
 */
class RealTimeService {
  private wsManager: WebSocketManager;
  private initialized = false;
  
  /**
   * Creates a new real-time service instance
   */
  constructor() {
    // Initialize WebSocket manager
    this.wsManager = new WebSocketManager(WS_URL);
    
    // Configure reconnection
    this.wsManager.setAutoReconnect(true, 10);
  }
  
  /**
   * Connect to the WebSocket server
   * @param token Authentication token
   */
  public async connect(token: string): Promise<boolean> {
    try {
      const connected = await this.wsManager.connect(token);
      this.initialized = connected;
      return connected;
    } catch (error) {
      console.error('WebSocket connection failed:', error);
      this.initialized = false;
      throw error;
    }
  }
  
  /**
   * Check if WebSocket is initialized
   */
  public isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Check if WebSocket is connected
   */
  public isConnected(): boolean {
    return this.wsManager.isConnected();
  }
  
  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    // Use the correct method name from WebSocketManager
    return this.wsManager.getStatus();
  }
  
  /**
   * Update authentication token
   * @param token New token
   */
  public updateToken(token: string): void {
    // WebSocketManager doesn't have updateToken method, so we'll disconnect and reconnect
    if (this.wsManager.isConnected()) {
      this.wsManager.disconnect();
      this.wsManager.connect(token).catch(err => {
        console.error('Failed to reconnect with new token:', err);
      });
    }
  }
  
  /**
   * Disconnect from WebSocket server
   */
  public disconnect(): void {
    this.wsManager.disconnect();
    this.initialized = false;
  }
  
  /**
   * Subscribe to connection status changes
   * @param callback Function to call on status change
   */
  public onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    return this.wsManager.onConnectionStatusChange(callback);
  }
  
  /**
   * Subscribe to WebSocket errors
   * @param callback Function to call on error
   */
  public onError(callback: ErrorHandler): () => void {
    return this.wsManager.onError(callback);
  }
  
  /**
   * Handle authentication errors
   * @param callback Function to call on authentication error
   */
  public onAuthError(callback: ErrorHandler): () => void {
    return this.wsManager.subscribe('auth_error', callback);
  }
  
  /**
   * Test connection with ping
   */
  public ping(): Promise<any> {
    // Send a ping message to the server
    return this.wsManager.send({ action: 'ping', timestamp: Date.now() });
  }
  
  /**
   * Subscribe to balance changes for a wallet
   * @param walletAddress Wallet address
   * @param callback Function to call on balance change
   */
  public subscribeToBalanceChanges(
    walletAddress: string,
    callback: MessageHandler<BalanceUpdateEvent>
  ): () => void {
    // Normalize address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    return this.wsManager.subscribe(`balance:${normalizedAddress}`, callback);
  }
  
  /**
   * Subscribe to NFT transfers for a wallet
   * @param walletAddress Wallet address
   * @param callback Function to call on NFT transfer
   */
  public subscribeToNftTransfers(
    walletAddress: string,
    callback: MessageHandler<NftTransferEvent>
  ): () => void {
    // Normalize address to lowercase
    const normalizedAddress = walletAddress.toLowerCase();
    return this.wsManager.subscribe(`nft:${normalizedAddress}`, callback);
  }
  
  /**
   * Subscribe to token price updates
   * @param callback Function to call on price update
   */
  public subscribeToTokenPrice(
    callback: MessageHandler<TokenPriceEvent>
  ): () => void {
    return this.wsManager.subscribe('token:price', callback);
  }
  
  /**
   * Subscribe to staking updates
   * @param positionId Staking position ID
   * @param callback Function to call on staking update
   */
  public subscribeToStakingUpdates(
    positionId: string,
    callback: MessageHandler<StakingUpdateEvent>
  ): () => void {
    return this.wsManager.subscribe(`staking:${positionId}`, callback);
  }
  
  /**
   * Subscribe to system notifications
   * @param callback Function to call on notification
   */
  public subscribeToNotifications(
    callback: MessageHandler<NotificationEvent>
  ): () => void {
    return this.wsManager.subscribe('notifications', callback);
  }
  
  /**
   * Get list of active subscriptions
   */
  public getActiveSubscriptions(): string[] {
    // This method doesn't exist in WebSocketManager, so we'll return an array of subscription channel names
    return Array.from(this.wsManager['subscriptions']?.keys() || []);
  }
  
  /**
   * Send a message to the server
   * @param channel Channel to send to
   * @param data Message data
   */
  public async sendMessage(channel: string, data: any): Promise<boolean> {
    // Format the message as expected by the server and use the existing send method
    const message = {
      action: 'publish',
      channel,
      data
    };
    
    return await this.wsManager.send(message);
  }
}

// Create singleton instance
export const realtimeService = new RealTimeService();

// Default export
export default realtimeService;
// Centralized exports for the realtime service
import { ConnectionStatus, BalanceUpdateEvent, NftTransferEvent, NotificationEvent, RealTimeService } from "../../types/realtimeTypes";

/**
 * WebSocket error interface
 */
export interface WebSocketError {
  code?: number;
  reason?: string;
  message: string;
}

/**
 * Message handler type
 */
export type MessageHandler<T = any> = (data: T) => void;

/**
 * Error handler type
 */
export type ErrorHandler = (error: WebSocketError | Error) => void;

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
 * Complete RealtimeService interface that includes all methods used in components
 */
export interface CompleteRealtimeService {
  // Connection methods
  connect: (token?: string) => Promise<boolean | void>;
  disconnect: () => void;
  reconnect: () => void;
  isConnected: () => boolean;
  isInitialized?: () => boolean;
  
  // Status methods
  getConnectionStatus: () => ConnectionStatus;
  getConnectionDuration: () => number;
  getConnectionFailureReason: () => string | null;
  onConnectionStatusChange: (callback: (status: ConnectionStatus) => void) => () => void;
  onStatusChange: (callback: (status: ConnectionStatus) => void) => () => void;
  onError: (callback: ErrorHandler) => () => void;
  
  // Message handling
  onMessage: (callback: MessageHandler) => () => void;
  onMessageReceived: (callback: MessageHandler) => () => void;
  send: (message: any) => void;
  
  // Subscription methods
  subscribe: (channel: string, callback: MessageHandler) => () => void;
  unsubscribe: (channel: string, callback?: MessageHandler) => void;
  unsubscribeFrom: (channel: string) => void;
  getSubscriptions: () => string[];
  getActiveSubscriptions: () => string[];
  
  // Specialized subscription methods
  subscribeToBalanceUpdates: (walletAddress: string, callback: MessageHandler<BalanceUpdateEvent>) => () => void;
  subscribeToNftTransfers: (walletAddress: string, callback: MessageHandler<NftTransferEvent>) => () => void;
  subscribeToNotifications: (callback: MessageHandler<NotificationEvent>) => () => void;
  subscribeToTokenPrice?: (callback: MessageHandler<TokenPriceEvent>) => () => void;
  subscribeToStakingUpdates?: (positionId: string, callback: MessageHandler<StakingUpdateEvent>) => () => void;
  
  // Configuration methods
  setAutoReconnect: (enabled: boolean, maxAttempts?: number) => void;
  setToken: (token: string) => void;
  updateToken?: (token: string) => void;
  reset?: () => void;
  
  // Utility methods
  ping: () => Promise<any>;
  sendPing?: () => void;
}

// Create a consistent implementation of realtimeService that conforms to our interface
class RealTimeServiceImpl implements CompleteRealtimeService {
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private connectionStartTime: number = 0;
  private failureReason: string | null = null;
  private token: string | null = null;
  private autoReconnect: boolean = false;
  private maxReconnectAttempts: number = 3;
  private subscriptions: Map<string, Set<MessageHandler>> = new Map();
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private errorListeners: Set<ErrorHandler> = new Set();
  private messageListeners: Set<MessageHandler> = new Set();
  
  constructor() {
    // Initialize in a web-safe way
    if (typeof window !== 'undefined') {
      // Check for connection status in session storage
      const savedStatus = sessionStorage.getItem('websocket_status');
      if (savedStatus) {
        this.connectionStatus = savedStatus as ConnectionStatus;
      }
      
      // Check for saved token
      this.token = sessionStorage.getItem('websocket_token');
    }
  }
  
  // Connection methods
  async connect(token?: string): Promise<boolean> {
    if (token) {
      this.token = token;
      if (typeof window !== 'undefined') {
        sessionStorage.setItem('websocket_token', token);
      }
    }
    
    // For now just simulate a successful connection
    this.connectionStatus = ConnectionStatus.CONNECTED;
    this.connectionStartTime = Date.now();
    this.notifyStatusChange(ConnectionStatus.CONNECTED);
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('websocket_status', ConnectionStatus.CONNECTED);
    }
    
    return true;
  }
  
  disconnect(): void {
    this.connectionStatus = ConnectionStatus.DISCONNECTED;
    this.connectionStartTime = 0;
    this.notifyStatusChange(ConnectionStatus.DISCONNECTED);
    
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('websocket_status', ConnectionStatus.DISCONNECTED);
    }
  }
  
  reconnect(): void {
    this.disconnect();
    this.connect(this.token || undefined);
  }
  
  isConnected(): boolean {
    return this.connectionStatus === ConnectionStatus.CONNECTED;
  }
  
  isInitialized(): boolean {
    return true; // Always initialized in this implementation
  }
  
  // Status methods
  getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }
  
  getConnectionDuration(): number {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      return 0;
    }
    return this.connectionStartTime ? Date.now() - this.connectionStartTime : 0;
  }
  
  getConnectionFailureReason(): string | null {
    return this.failureReason;
  }
  
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }
  
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    return this.onConnectionStatusChange(callback);
  }
  
  onError(callback: ErrorHandler): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }
  
  // Message handling
  onMessage(callback: MessageHandler): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }
  
  onMessageReceived(callback: MessageHandler): () => void {
    return this.onMessage(callback);
  }
  
  send(message: any): void {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      this.notifyError({
        message: 'Cannot send message: not connected'
      });
      return;
    }
    
    // In a real implementation, this would send to the WebSocket
    console.log('Sending message:', message);
  }
  
  // Subscription methods
  subscribe(channel: string, callback: MessageHandler): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    const channelSubscribers = this.subscriptions.get(channel)!;
    channelSubscribers.add(callback);
    
    return () => {
      this.unsubscribe(channel, callback);
    };
  }
  
  unsubscribe(channel: string, callback?: MessageHandler): void {
    if (!this.subscriptions.has(channel)) {
      return;
    }
    
    const channelSubscribers = this.subscriptions.get(channel)!;
    
    if (callback) {
      channelSubscribers.delete(callback);
      
      if (channelSubscribers.size === 0) {
        this.subscriptions.delete(channel);
      }
    } else {
      this.subscriptions.delete(channel);
    }
  }
  
  unsubscribeFrom(channel: string): void {
    this.unsubscribe(channel);
  }
  
  getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
  
  getActiveSubscriptions(): string[] {
    return this.getSubscriptions();
  }
  
  // Specialized subscription methods
  subscribeToBalanceUpdates(walletAddress: string, callback: MessageHandler<BalanceUpdateEvent>): () => void {
    const channel = `balances:${walletAddress}`;
    return this.subscribe(channel, callback);
  }
  
  subscribeToNftTransfers(walletAddress: string, callback: MessageHandler<NftTransferEvent>): () => void {
    const channel = `nft:transfers:${walletAddress}`;
    return this.subscribe(channel, callback);
  }
  
  subscribeToNotifications(callback: MessageHandler<NotificationEvent>): () => void {
    return this.subscribe('notifications', callback);
  }
  
  subscribeToTokenPrice(callback: MessageHandler<TokenPriceEvent>): () => void {
    return this.subscribe('token:prices', callback);
  }
  
  subscribeToStakingUpdates(positionId: string, callback: MessageHandler<StakingUpdateEvent>): () => void {
    const channel = `staking:${positionId}`;
    return this.subscribe(channel, callback);
  }
  
  // Configuration methods
  setAutoReconnect(enabled: boolean, maxAttempts?: number): void {
    this.autoReconnect = enabled;
    if (maxAttempts !== undefined) {
      this.maxReconnectAttempts = maxAttempts;
    }
  }
  
  setToken(token: string): void {
    this.token = token;
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('websocket_token', token);
    }
  }
  
  updateToken(token: string): void {
    this.setToken(token);
  }
  
  reset(): void {
    this.disconnect();
    this.subscriptions.clear();
    this.statusListeners.clear();
    this.errorListeners.clear();
    this.messageListeners.clear();
    this.token = null;
    
    if (typeof window !== 'undefined') {
      sessionStorage.removeItem('websocket_token');
      sessionStorage.removeItem('websocket_status');
    }
  }
  
  // Utility methods
  async ping(): Promise<any> {
    if (this.connectionStatus !== ConnectionStatus.CONNECTED) {
      throw new Error('Cannot ping: not connected');
    }
    
    // In a real implementation, this would send a ping to the WebSocket
    return { pong: true, timestamp: Date.now() };
  }
  
  sendPing(): void {
    this.ping().catch(error => {
      this.notifyError(error);
    });
  }
  
  // Helper methods
  private notifyStatusChange(status: ConnectionStatus): void {
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }
  
  private notifyError(error: WebSocketError | Error): void {
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (listenerError) {
        console.error('Error in error listener:', listenerError);
      }
    });
  }
}

// Create and export the realtime service instance
export const realtimeService = new RealTimeServiceImpl();

// Export types so they can be used elsewhere
export type {
  ConnectionStatus,
  BalanceUpdateEvent,
  NftTransferEvent,
  NotificationEvent,
  RealTimeService
};

import { 
  BalanceChangeEvent as ImportedBalanceChangeEvent,
  BalanceUpdateEvent as ImportedBalanceUpdateEvent, 
  NftTransferEvent as ImportedNftTransferEvent, 
  NotificationEvent as ImportedNotificationEvent 
} from "./apiTypes";
// Remove incorrect imports from websocket.ts as they don't exist
// Define WebSocketStatus here since it's used in this file
export type WebSocketStatus = 'connected' | 'connecting' | 'reconnecting' | 'disconnected' | 'error';

/**
 * Realtime service type definitions
 */

// Connection status enum
export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  RECONNECTING = 'reconnecting',  // Adding this to fix references
  DISCONNECTED = 'disconnected',
  CONNECTION_ERROR = 'error',
  ERROR = 'error'  // Adding alias for backward compatibility
}

// Connection failure reasons
export enum ConnectionFailureReason {
  NETWORK_ERROR = 'network_error',
  AUTHENTICATION_FAILED = 'authentication_failed',
  SERVER_ERROR = 'server_error',
  TIMEOUT = 'timeout',
  UNKNOWN = 'unknown'
}

// Balance update event interface
export interface BalanceUpdateEvent {
  walletAddress: string;
  tokenSymbol: string;
  previousBalance: string;
  currentBalance: string;
  newBalance: string;  // Used in WalletBalanceMonitor
  formattedBalance: string;
  formattedNewBalance: string;  // Used in WalletBalanceMonitor
  timestamp: number;
  transactionHash?: string;
  txHash?: string;  // Alternative field name used in some components
  blockNumber?: number;
  address?: string;  // Used in WalletBalanceMonitor
  chainId?: string | number;  // Used in WalletBalanceMonitor
  networkName?: string;  // Used in WalletBalanceMonitor
}

// NFT transfer event interface
export interface NftTransferEvent {
  walletAddress: string;
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
  timestamp: number;
  transactionHash: string;
  blockNumber?: number;
  txHash?: string;  // Alternative to transactionHash for backward compatibility
  metadata: {
    name?: string;
    description?: string;
    image?: string;
    [key: string]: any;
  };
}

// Notification event interface
export interface NotificationEvent {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  createdAt: number;
  read: boolean;
  link?: string;
  metadata?: Record<string, any>;
}

// Message handler type
export type MessageHandler<T = any> = (data: T) => void;

// Error handler type
export type ErrorHandler = (error: WebSocketError | Error) => void;

// WebSocket error interface
export interface WebSocketError {
  code?: number;
  reason?: string;
  message: string;
}

// Add any other realtime-related type definitions here

// Add a generic SubscriptionCallback interface
export interface SubscriptionCallback<T = any> {
  (data: T): void;
}

// Ensure this matches what's used in WalletBalanceMonitor
export interface BalanceChangeEvent extends ImportedBalanceChangeEvent {
  address: string;
  previousBalance: string;
  newBalance: string;
  formattedNewBalance?: string;
  txHash?: string;
  blockNumber: number;
  timestamp: number;
  chainId: number;
  networkName: string;
  type: 'credit' | 'debit';
}

// Define a consistent interface for the realtime service
export interface RealTimeService {
  // Connection methods
  isConnected(): boolean;
  connect(token: string): Promise<boolean>;
  disconnect(): void;
  reconnect(): void;
  
  // Status methods
  getConnectionStatus(): ConnectionStatus;
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void;
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void;
  onError(callback: (error: WebSocketError) => void): () => void;
  
  // Message handling
  onMessage(callback: (message: any) => void): () => void;
  onMessageReceived(callback: (message: any) => void): () => void;
  send(message: any): Promise<any> | void;  // Updated return type to allow for void
  
  // Subscription methods
  subscribe(channel: string, callback: (data: any) => void): () => void;
  unsubscribe(channel: string, callback?: (data: any) => void): void;
  unsubscribeFrom(channel: string): void;
  getSubscriptions(): string[];
  
  // Specialized subscription methods
  subscribeToNotifications(callback: (notification: NotificationEvent) => void): () => void;
  subscribeToBalanceUpdates(walletAddress: string, callback: (update: BalanceUpdateEvent) => void): () => void;
  subscribeToNftTransfers(walletAddress: string, callback: (event: NftTransferEvent) => void): () => void;
  
  // Configuration methods
  setAutoReconnect(enabled: boolean, maxAttempts?: number): void;
  setToken(token: string): void;
  ping(): Promise<any>;
}

export interface TokenPriceEvent {
  symbol: string;
  price: number;
  change24h: number;
}

export interface StakingUpdateEvent {
  userId: string;
  totalStaked: number;
  rewards: number;
}

export interface RealtimeServiceInterface {
  connect(token?: string): Promise<boolean>;
  disconnect(): void;
  subscribe(channel: string, callback: (data: any) => void): () => void;
  subscribeToBalanceUpdates(callback: (data: any) => void): () => void;
  subscribeToNftTransfers(callback: (data: any) => void): () => void;
  subscribeToNotifications(callback: (notification: NotificationEvent) => void): () => void;
  unsubscribeFrom(channel: string): void;
  getSubscriptions(): string[];
  getConnectionStatus(): WebSocketStatus;
  getConnectionFailureReason(): string;
  getConnectionDuration(): number;
  isConnected(): boolean;
  sendPing(): void;
  setToken(token: string): void;
  setAutoReconnect(enabled: boolean, maxAttempts?: number): void;
  reset(): void;
  onStatusChange(callback: (status: WebSocketStatus) => void): () => void;
  onError(callback: (error: WebSocketError | Error) => void): () => void;
  onMessageReceived(callback: (message: any) => void): () => void;
}

export type CompleteRealtimeService = RealtimeServiceInterface;

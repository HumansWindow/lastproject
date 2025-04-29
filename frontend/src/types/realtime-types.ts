// Rename the imported type to avoid conflict with the local declaration
import { 
  BalanceChangeEvent as ImportedBalanceChangeEvent,
  BalanceUpdateEvent as ImportedBalanceUpdateEvent, 
  NftTransferEvent as ImportedNftTransferEvent, 
  NotificationEvent as ImportedNotificationEvent 
} from './api-types';

// Define the connection status enum that will be used throughout the application
export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  RECONNECTING = 'RECONNECTING',
  ERROR = 'ERROR'
}

// Add any other realtime-related type definitions here
export interface WebSocketError {
  code: number;
  reason: string;
  message: string;
  timestamp: number;
}

// Define message handler type
export interface MessageHandler<T = any> {
  (message: T): void;
}

// Add a generic SubscriptionCallback interface
export interface SubscriptionCallback<T = any> {
  (data: T): void;
}

// NFT transfer event interface
export interface NftTransferEvent {
  tokenId: string;
  fromAddress: string;
  toAddress: string;
  from: string;
  to: string;
  contractAddress: string;
  transactionHash: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  metadata?: {
    name: string;
    description: string;
    image: string;
  };
}

// Export the BalanceUpdateEvent interface
export interface BalanceUpdateEvent {
  address: string;
  oldBalance: string;
  newBalance: string;
  difference: string;
  previousBalance: string;
  formattedNewBalance?: string;
  txHash?: string;
  blockNumber: number;
  timestamp: number;
  chainId: number;
  networkName: string;
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

// Notification event interface
export interface NotificationEvent {
  id: string;
  type: string;
  message: string;
  timestamp: number;
  read: boolean;
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

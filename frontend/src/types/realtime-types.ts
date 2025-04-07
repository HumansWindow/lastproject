// Realtime service event types
import { BalanceChangeEvent, BalanceUpdateEvent, NftTransferEvent, NotificationEvent } from './api-types';

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
  onError(callback: (error: WebSocketError) => void): () => void;
  
  // Message handling
  onMessage(callback: (message: any) => void): () => void;
  send(message: any): Promise<boolean>;
  
  // Subscription methods
  subscribe(channel: string, callback: (data: any) => void): () => void;
  unsubscribe(channel: string): void;
  
  // Specialized subscription methods
  subscribeToNotifications(callback: (notification: NotificationEvent) => void): () => void;
  subscribeToBalanceUpdates(walletAddress: string, callback: (update: BalanceUpdateEvent) => void): () => void;
  subscribeToNftTransfers(walletAddress: string, callback: (event: NftTransferEvent) => void): () => void;
  
  // Configuration methods
  setAutoReconnect(enabled: boolean, maxAttempts?: number): void;
  ping(): Promise<any>;
}

// WebSocket connection status
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// WebSocket error type
export interface WebSocketError {
  code: number;
  reason: string;
  timestamp: number;
}

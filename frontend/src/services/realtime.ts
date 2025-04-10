// Import first to avoid reference errors
import { 
  WebSocketError, 
  MessageHandler,
  NftTransferEvent,
  BalanceUpdateEvent,
  NotificationEvent,
  ConnectionStatus as ConnectionStatusType
} from '../types/realtime-types';

// Export the imported types so they can be used elsewhere
export type {
  NftTransferEvent,
  BalanceUpdateEvent,
  NotificationEvent,
  WebSocketError,
  MessageHandler
};

// Define RealtimeService interface using ConnectionStatusType 
export interface RealtimeService {
  connect(token?: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  getConnectionStatus(): ConnectionStatusType;
  
  subscribe(channel: string, callback: MessageHandler): () => void;
  unsubscribe(channel: string): void;
  
  onError(callback: (error: WebSocketError) => void): () => void;
  onMessage(callback: MessageHandler): () => void;
  
  subscribeToNftTransfers(walletAddress: string, callback: MessageHandler<NftTransferEvent>): () => void;
  subscribeToBalanceUpdates(walletAddress: string, callback: MessageHandler<BalanceUpdateEvent>): () => void;
  subscribeToNotifications(callback: MessageHandler<NotificationEvent>): () => void;
  
  ping(): Promise<void>;
  getActiveSubscriptions(): string[];
  setAutoReconnect(enabled: boolean, maxRetries?: number): void;
  
  // Additional methods used in real-time-demo.tsx
  onStatusChange(callback: (status: ConnectionStatusType) => void): () => void;
  onMessageReceived(callback: (message: any) => void): () => void;
  setToken(token: string): void;
  unsubscribeFrom(channel: string): void;
  getSubscriptions(): string[];
  sendPing(): void;
}

// Replace the incorrect import
import { realtimeService } from './realtime/websocket/realtime-service';
export { realtimeService };

export enum ConnectionStatus {
  CONNECTED = 'CONNECTED',
  CONNECTING = 'CONNECTING',
  DISCONNECTED = 'DISCONNECTED',
  ERROR = 'ERROR',
  RECONNECTING = 'RECONNECTING'
}

export interface WebSocketMessage {
  type: string;
  channel?: string;
  data?: any;
}

import { 
  ConnectionStatus, 
  MessageHandler, 
  NftTransferEvent, 
  BalanceUpdateEvent, 
  NotificationEvent, 
  WebSocketError 
} from "../../../types/realtimeTypes";

// Export the imported ConnectionStatus
export { ConnectionStatus };

export interface SubscriptionCallback {
  (data: any): void;
}

export interface IRealtimeService {
  connect(token: string): Promise<void>;
  disconnect(): void;
  subscribe(channel: string, callback: SubscriptionCallback): () => void;
  unsubscribe(channel: string, callback?: SubscriptionCallback): void;
  getConnectionStatus(): ConnectionStatus;
  onConnectionStatusChange?(callback: (status: ConnectionStatus) => void): () => void;
  onStatusChange?(callback: (status: ConnectionStatus) => void): () => void;
  onMessage?(callback: (message: any) => void): () => void;
  onError?(callback: (error: WebSocketError) => void): () => void;
}

export interface RealtimeServiceInterface {
  connect(token?: string): Promise<void>;
  disconnect(): void;
  isConnected(): boolean;
  getConnectionStatus(): ConnectionStatus;
  
  subscribe(channel: string, callback: MessageHandler): () => void;
  unsubscribe(channel: string): void;
  
  subscribeToNftTransfers(walletAddress: string, callback: MessageHandler<NftTransferEvent>): () => void;
  subscribeToBalanceUpdates(walletAddress: string, callback: MessageHandler<BalanceUpdateEvent>): () => void;
  subscribeToNotifications(userId: string, callback: MessageHandler<NotificationEvent>): () => void;
  
  onError(callback: (error: WebSocketError) => void): () => void;
  onMessage(callback: MessageHandler): () => void;
  onStatusChange(callback: (status: ConnectionStatus) => void): () => void;
  
  ping(): Promise<boolean>;
  getActiveSubscriptions(): string[];
  setAutoReconnect(enabled: boolean, maxRetries?: number): void;
  setToken(token: string): void;
}

// Configuration options interface
export interface RealTimeServiceOptions {
  url: string;
  autoReconnect?: boolean;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
  debug?: boolean;
}

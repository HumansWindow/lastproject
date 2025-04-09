// Centralized exports for the realtime service

// Import from realtime-service-interface.ts
import { ConnectionStatus as ServiceConnectionStatus } from './websocket/realtime-service-interface';

// Import from realtime-types.ts
import { ConnectionStatus as TypesConnectionStatus } from '../../types/realtime-types';

// Re-export the service instance
import { realtimeService } from './websocket/realtime-service';
export { realtimeService };

// Export ConnectionStatus from types (for use in application code)
export { TypesConnectionStatus as ConnectionStatus };

// Export the RealTimeService type (not the implementation)
export type { RealTimeService } from '../../types/realtime-types';

/**
 * Event interface for balance updates
 */
export interface BalanceUpdateEvent {
  address: string;
  oldBalance: string;
  newBalance: string;
  previousBalance: string;
  delta: string;
  token?: string;
  timestamp: number;
  formattedNewBalance?: string;
  txHash?: string;
}

/**
 * Event interface for notifications
 */
export interface NotificationEvent {
  id: string;
  type: string;
  message: string;
  title?: string;
  timestamp: number;
  read: boolean;
  data?: any;
}

/**
 * Event interface for NFT transfers
 */
export interface NftTransferEvent {
  tokenId: string;
  from: string;
  to: string;
  contractAddress: string;
  tokenUri?: string;
  timestamp: number;
  txHash: string;
  blockNumber: number;
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
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
 * RealtimeService interface that components will interact with
 */
export interface RealtimeService {
  connect(token?: string): Promise<void | boolean>;
  disconnect(): void;
  isConnected(): boolean;
  isInitialized?(): boolean;
  getConnectionStatus(): TypesConnectionStatus;
  updateToken?(token: string): void;
  
  // Subscription methods
  onConnectionStatusChange?(callback: (status: TypesConnectionStatus) => void): () => void;
  onError(callback: ErrorHandler): () => void;
  onMessage(callback: MessageHandler): () => void;
  subscribe(channel: string, callback: MessageHandler): () => void;
  
  // Specialized subscription methods
  subscribeToBalanceUpdates(walletAddress: string, callback: MessageHandler<BalanceUpdateEvent>): () => void;
  subscribeToNftTransfers(walletAddress: string, callback: MessageHandler<NftTransferEvent>): () => void;
  subscribeToTokenPrice?(callback: MessageHandler<TokenPriceEvent>): () => void;
  subscribeToStakingUpdates?(positionId: string, callback: MessageHandler<StakingUpdateEvent>): () => void;
  subscribeToNotifications?(callback: MessageHandler<NotificationEvent>): () => void;
  
  // Utility methods
  ping(): Promise<any>;
  getActiveSubscriptions(): string[];
  setAutoReconnect(enabled: boolean, maxRetries?: number): void;
  
  // Methods used in real-time-demo.tsx
  onStatusChange?(callback: (status: TypesConnectionStatus) => void): () => void;
  onMessageReceived?(callback: (message: any) => void): () => void;
  setToken?(token: string): void;
  unsubscribeFrom?(channel: string): void;
  getSubscriptions?(): string[];
  sendPing?(): Promise<any>;
}

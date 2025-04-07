import { WebSocketManager, ConnectionStatus, WebSocketError } from './websocket-manager';
import { BalanceChangeEvent, BalanceUpdateEvent, NftTransferEvent, NotificationEvent } from '../../../types/api-types';
import { RealTimeService } from './realtime-service-interface';

/**
 * Check if the code is running in browser environment
 */
const isBrowser = typeof window !== 'undefined';

/**
 * Real-time service implementation using WebSocket
 */
class RealTimeServiceImpl implements RealTimeService {
  private wsManager: WebSocketManager;
  private baseUrl: string;
  private activeSubscriptions: Set<string> = new Set();
  
  constructor(baseUrl?: string) {
    // Handle server-side rendering by providing a default URL for server
    // and only accessing window.location.hostname in the browser
    this.baseUrl = baseUrl || (
      process.env.REACT_APP_WS_URL || 
      (isBrowser ? `ws://${window.location.hostname}:3001/ws` : 'ws://localhost:3001/ws')
    );
    this.wsManager = new WebSocketManager(this.baseUrl);
  }
  
  // Connection methods
  isConnected(): boolean {
    return this.wsManager.isConnected();
  }
  
  connect(token: string): Promise<boolean> {
    return this.wsManager.connect(token);
  }
  
  disconnect(): void {
    this.wsManager.disconnect();
  }
  
  // Status methods
  getConnectionStatus(): ConnectionStatus {
    return this.wsManager.getStatus();
  }
  
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    return this.wsManager.onConnectionStatusChange(callback);
  }
  
  onError(callback: (error: WebSocketError) => void): () => void {
    return this.wsManager.onError(callback);
  }
  
  // Message handling
  onMessage(callback: (message: any) => void): () => void {
    return this.wsManager.onMessage(callback);
  }
  
  send(message: any): Promise<boolean> {
    return this.wsManager.send(message);
  }
  
  // Subscription methods
  subscribe(channel: string, callback: (data: any) => void): () => void {
    this.activeSubscriptions.add(channel);
    
    const unsubscribe = this.wsManager.subscribe(channel, callback);
    return () => {
      unsubscribe();
      this.activeSubscriptions.delete(channel);
    };
  }
  
  unsubscribe(channel: string): void {
    this.wsManager.unsubscribe(channel);
    this.activeSubscriptions.delete(channel);
  }
  
  // Get active subscriptions
  getActiveSubscriptions(): string[] {
    return Array.from(this.activeSubscriptions);
  }
  
  // Specialized subscription methods
  subscribeToNotifications(callback: (notification: NotificationEvent) => void): () => void {
    return this.subscribe('user:notifications', callback);
  }
  
  subscribeToBalanceUpdates(walletAddress: string, callback: (update: BalanceUpdateEvent) => void): () => void {
    return this.subscribe(`wallet:${walletAddress}:balance`, callback);
  }
  
  subscribeToNftTransfers(walletAddress: string, callback: (event: NftTransferEvent) => void): () => void {
    return this.subscribe(`wallet:${walletAddress}:nft`, callback);
  }
  
  // Configuration methods
  setAutoReconnect(enabled: boolean, maxAttempts?: number): void {
    this.wsManager.setAutoReconnect(enabled, maxAttempts);
  }
  
  async ping(): Promise<any> {
    try {
      await this.wsManager.send({ action: 'ping', timestamp: Date.now() });
      return { success: true, timestamp: Date.now() };
    } catch (error) {
      console.error('Ping error:', error);
      throw error;
    }
  }
}

// Create a singleton instance - only when in browser
const realtimeService = isBrowser ? new RealTimeServiceImpl() : null as unknown as RealTimeServiceImpl;

// Named exports
export { realtimeService };
export const subscribeToMessage = isBrowser ? realtimeService.onMessage.bind(realtimeService) : (() => () => {});
export const unsubscribeFromMessage = isBrowser ? ((unsubscribe: () => void) => unsubscribe()) : (() => {});

// Default export
export default realtimeService;

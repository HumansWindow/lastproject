import { ConnectionStatus, WebSocketError, RealTimeService } from "../../../types/realtimeTypes";
import { EventEmitter } from 'events';
import wsConfig from "../config";
import { i18n } from "../../../i18n";

// Define these interfaces locally if they're not exported elsewhere
interface IRealtimeService {
  connect(token?: string): Promise<void>;
  disconnect(): void;
  subscribe(channel: string, callback: SubscriptionCallback): () => void;
  unsubscribe(channel: string, callback?: SubscriptionCallback): void;
  getConnectionStatus(): ConnectionStatus;
  // ...other methods
}

// Define the SubscriptionCallback interface locally since it's not exported from realtime-types.ts
interface SubscriptionCallback {
  (data: any): void;
}

/**
 * RealtimeService - Manages WebSocket connections with the backend
 * This is the consolidated implementation that replaces WebSocketManager
 */
class RealtimeService extends EventEmitter implements IRealtimeService {
  private socket: WebSocket | null = null;
  private connected: boolean = false;
  private connecting: boolean = false;
  private token: string | null = null;
  private connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private subscriptions: Map<string, Set<SubscriptionCallback>> = new Map();
  private reconnectAttempts: number = 0;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private reconnectInterval: number = wsConfig.reconnectInterval;
  private maxReconnectInterval: number = wsConfig.maxReconnectInterval;
  private reconnectDecay: number = wsConfig.reconnectDecay;
  private maxReconnectAttempts: number = wsConfig.reconnectAttempts;
  private connectionTimeout: number = wsConfig.connectionTimeout;
  private connectionTimer: NodeJS.Timeout | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private connectionStartTime: number = 0;
  private connectionFailureReason: string | null = null;
  private statusListeners: Set<(status: ConnectionStatus) => void> = new Set();
  private messageListeners: Set<(message: any) => void> = new Set();
  private errorListeners: Set<(error: WebSocketError | Error) => void> = new Set();
  private autoReconnect: boolean = true;

  /**
   * Connect to the WebSocket server
   * @param token Authentication token
   */
  public connect(token?: string): Promise<void> {
    if (this.connected || this.connecting) {
      return Promise.resolve();
    }

    this.token = token || null;
    this.connecting = true;
    this.connectionFailureReason = null;
    this.updateConnectionStatus(ConnectionStatus.CONNECTING);
    this.connectionStartTime = Date.now();
    
    // Prepare the URL with authentication token if provided
    let url = wsConfig.url;
    if (token) {
      const separator = url.includes('?') ? '&' : '?';
      url = `${url}${separator}token=${encodeURIComponent(token)}`;
    }

    try {
      // Create WebSocket connection
      this.socket = new WebSocket(url);
      
      // Start connection timeout
      this.connectionTimer = setTimeout(() => {
        if (this.connectionStatus === ConnectionStatus.CONNECTING) {
          console.warn('WebSocket connection timeout');
          this.connectionFailureReason = 'Connection timeout';
          this.socket?.close();
        }
      }, this.connectionTimeout);

      // Set up event handlers
      this.socket.onopen = this.handleOpen.bind(this);
      this.socket.onclose = this.handleClose.bind(this);
      this.socket.onmessage = this.handleMessage.bind(this);
      this.socket.onerror = (error) => {
        console.error('WebSocket error:', error);
        this.connectionFailureReason = 'Connection error';
        this.updateConnectionStatus(ConnectionStatus.ERROR);
        this.emit('error', new Error('WebSocket connection error'));
      };
      
      return new Promise<void>((resolve, reject) => {
        // Add one-time event listeners to handle the connection promise
        this.once('connected', () => {
          resolve();
        });
        
        this.once('error', (error) => {
          reject(error);
        });
      });
    } catch (error) {
      console.error('Failed to create WebSocket connection:', error);
      this.connectionFailureReason = 'Failed to create connection';
      this.updateConnectionStatus(ConnectionStatus.ERROR);
      return Promise.reject(error);
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    this.connected = false;
    this.connecting = false;
    
    // Clear timers
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    // Only update status and close if socket exists
    if (this.socket) {
      this.updateConnectionStatus(ConnectionStatus.DISCONNECTED);
      this.socket.close();
      this.socket = null;
    }
  }

  /**
   * Subscribe to a specific channel
   * @param channel Channel name
   * @param callback Callback function to handle messages
   * @returns Unsubscribe function
   */
  public subscribe(channel: string, callback: SubscriptionCallback): () => void {
    // Create subscription set if it doesn't exist
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, new Set());
    }
    
    // Add callback to the subscription set
    const callbacks = this.subscriptions.get(channel)!;
    callbacks.add(callback);
    
    // Return unsubscribe function
    return () => {
      const callbacks = this.subscriptions.get(channel);
      if (callbacks) {
        callbacks.delete(callback);
        if (callbacks.size === 0) {
          this.subscriptions.delete(channel);
        }
      }
    };
  }

  /**
   * Unsubscribe from a specific channel
   * @param channel Channel name
   * @param callback Callback function to remove
   */
  public unsubscribe(channel: string, callback?: SubscriptionCallback): void {
    const subscribers = this.subscriptions.get(channel);
    if (!subscribers) return;
    
    if (callback) {
      subscribers.delete(callback);
      
      if (subscribers.size === 0) {
        this.subscriptions.delete(channel);
      } else {
        this.subscriptions.set(channel, subscribers);
      }
    } else {
      // If no callback specified, remove all subscriptions for this channel
      this.subscriptions.delete(channel);
    }
  }

  /**
   * Alias for unsubscribe to remove all subscriptions for a channel
   * @param channel Channel name
   */
  public unsubscribeFrom(channel: string): void {
    this.unsubscribe(channel);
  }

  /**
   * Get a list of all subscribed channels
   * @returns Array of channel names
   */
  public getSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }

  /**
   * Get active subscriptions (alias for getSubscriptions)
   * @returns Array of channel names
   */
  public getActiveSubscriptions(): string[] {
    return this.getSubscriptions();
  }

  /**
   * Get the current connection status
   * @returns Current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Check if currently connected
   * @returns True if connected
   */
  public isConnected(): boolean {
    return this.connected;
  }

  /**
   * Get the duration of the current connection in milliseconds
   * @returns Connection duration or 0 if not connected
   */
  public getConnectionDuration(): number {
    if (!this.connected || this.connectionStartTime === 0) {
      return 0;
    }
    return Date.now() - this.connectionStartTime;
  }

  /**
   * Get the failure reason if connection failed
   * @returns Failure reason or null if no failure
   */
  public getConnectionFailureReason(): string | null {
    return this.connectionFailureReason;
  }

  /**
   * Reset the connection
   * This forces a disconnect and reconnect
   */
  public reset(): Promise<void> {
    this.disconnect();
    this.reconnectAttempts = 0;
    this.connectionFailureReason = null;
    return this.connect(this.token || undefined);
  }

  /**
   * Send a ping to check connection health
   * @returns Promise resolving if pong received
   */
  public ping(): Promise<void> {
    if (!this.connected || !this.socket) {
      return Promise.reject(new Error('Not connected'));
    }
    
    return new Promise<void>((resolve, reject) => {
      try {
        // Create ping message
        const pingMessage = {
          type: 'ping',
          timestamp: Date.now()
        };
        
        // Set timeout for pong response
        const timeout = setTimeout(() => {
          this.off('pong', pongHandler);
          reject(new Error('Ping timeout'));
        }, 5000);
        
        // Handler for pong response
        const pongHandler = () => {
          clearTimeout(timeout);
          resolve();
        };
        
        // Listen for pong
        this.once('pong', pongHandler);
        
        // Send ping
        if (this.socket) {
          this.socket.send(JSON.stringify(pingMessage));
        }
      } catch (error) {
        reject(error);
      }
    });
  }

  /**
   * Send a ping message
   */
  public sendPing(): void {
    if (!this.socket || this.socket.readyState !== WebSocket.OPEN) {
      console.warn('Cannot send ping: WebSocket is not open');
      return;
    }
    
    const pingMessage = { type: 'ping', timestamp: Date.now() };
    this.socket.send(JSON.stringify(pingMessage));
  }

  /**
   * Send a message
   * @param message Message to send
   */
  public sendMessage(message: any): void {
    if (this.socket) {
      this.socket.send(JSON.stringify(message));
    }
  }

  /**
   * Subscribe to notifications
   * @param callback Callback function to handle notifications
   * @returns Unsubscribe function
   */
  public subscribeToNotifications(callback: (notification: any) => void): () => void {
    return this.subscribe('notifications', callback);
  }

  /**
   * Subscribe to balance updates for a specific wallet
   * @param walletAddress Wallet address
   * @param callback Callback function to handle balance updates
   * @returns Unsubscribe function
   */
  public subscribeToBalanceUpdates(walletAddress: string, callback: (update: any) => void): () => void {
    return this.subscribe(`balance:${walletAddress}`, callback);
  }

  /**
   * Subscribe to NFT transfer events for a specific wallet
   * @param walletAddress Wallet address
   * @param callback Callback function to handle NFT transfer events
   * @returns Unsubscribe function
   */
  public subscribeToNftTransfers(walletAddress: string, callback: (event: any) => void): () => void {
    return this.subscribe(`nft:${walletAddress}`, callback);
  }

  /**
   * Set the authentication token
   * @param token Authentication token
   */
  public setToken(token: string): void {
    this.token = token;
  }

  /**
   * Alias for onConnectionStatusChange
   * @param callback Callback function to handle status changes
   * @returns Unsubscribe function
   */
  public onStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.add(callback);
    return () => {
      this.statusListeners.delete(callback);
    };
  }

  /**
   * Add onConnectionStatusChange method as an alias
   * @param callback Callback function to handle status changes
   * @returns Unsubscribe function
   */
  public onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    return this.onStatusChange(callback);
  }

  /**
   * Add onMessage method
   * @param callback Callback function to handle messages
   * @returns Unsubscribe function
   */
  public onMessage(callback: (message: any) => void): () => void {
    this.messageListeners.add(callback);
    return () => {
      this.messageListeners.delete(callback);
    };
  }

  /**
   * Fix the onMessageReceived alias method
   * @param callback Callback function to handle messages
   * @returns Unsubscribe function
   */
  public onMessageReceived(callback: (message: any) => void): () => void {
    return this.onMessage(callback);
  }

  /**
   * Add onError implementation
   * @param callback Callback function to handle errors
   * @returns Unsubscribe function
   */
  public onError(callback: (error: WebSocketError | Error) => void): () => void {
    this.errorListeners.add(callback);
    return () => {
      this.errorListeners.delete(callback);
    };
  }

  /**
   * Add setAutoReconnect implementation
   * @param enabled Enable or disable auto-reconnect
   * @param maxAttempts Maximum reconnect attempts
   */
  public setAutoReconnect(enabled: boolean, maxAttempts?: number): void {
    this.autoReconnect = enabled;
    if (maxAttempts !== undefined) {
      this.maxReconnectAttempts = maxAttempts;
    }
  }

  /* Private helper methods */

  /**
   * Handle WebSocket open event
   */
  private handleOpen(): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    this.connected = true;
    this.connecting = false;
    this.connectionFailureReason = null;
    this.reconnectAttempts = 0;
    this.reconnectInterval = wsConfig.reconnectInterval; // Reset reconnect interval
    
    // Update connection status
    this.updateConnectionStatus(ConnectionStatus.CONNECTED);
    this.emit('connected');
    
    // Set up ping interval
    this.pingInterval = setInterval(() => {
      this.ping().catch(() => {
        // If ping fails, consider the connection unstable
        console.warn('Ping failed, connection may be unstable');
      });
    }, 30000); // Ping every 30 seconds
  }

  /**
   * Handle WebSocket close event
   * @param event Close event
   */
  private handleClose(event: CloseEvent): void {
    if (this.connectionTimer) {
      clearTimeout(this.connectionTimer);
      this.connectionTimer = null;
    }
    
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
    
    this.connected = false;
    this.connecting = false;
    
    // If was not intentional disconnection, try to reconnect
    if (this.connectionStatus !== ConnectionStatus.DISCONNECTED) {
      console.log(`WebSocket closed with code ${event.code}, reason: ${event.reason || 'No reason provided'}`);
      
      if (!this.connectionFailureReason) {
        this.connectionFailureReason = `Connection closed: ${event.reason || 'Server closed connection'}`;
      }
      
      this.attemptReconnect();
    }
  }

  /**
   * Handle incoming WebSocket message
   * @param event Message event
   */
  private handleMessage(event: MessageEvent): void {
    try {
      const message = JSON.parse(event.data);
      
      // Handle pong responses
      if (message.type === 'pong') {
        this.emit('pong', message);
        return;
      }
      
      // Get the channel and data from the message
      const { channel, data } = message;
      
      if (channel && this.subscriptions.has(channel)) {
        // Call all callbacks for this channel
        const callbacks = this.subscriptions.get(channel)!;
        callbacks.forEach(callback => {
          try {
            callback(data);
          } catch (error) {
            console.error(`Error in subscription callback for channel "${channel}":`, error);
          }
        });
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  /**
   * Attempt to reconnect to the WebSocket server
   */
  private attemptReconnect(): void {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
    }
    
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      this.updateConnectionStatus(ConnectionStatus.ERROR);
      console.error(`Max reconnect attempts (${this.maxReconnectAttempts}) reached`);
      return;
    }
    
    // Update connection status to RECONNECTING
    this.updateConnectionStatus(ConnectionStatus.RECONNECTING);
    
    // Calculate next reconnect interval with exponential backoff
    const reconnectDelay = Math.min(
      this.reconnectInterval * Math.pow(this.reconnectDecay, this.reconnectAttempts),
      this.maxReconnectInterval
    );
    
    console.log(`Attempting to reconnect in ${reconnectDelay}ms (Attempt ${this.reconnectAttempts + 1}/${this.maxReconnectAttempts})`);
    
    // Set up reconnect timeout
    this.reconnectTimeout = setTimeout(() => {
      this.reconnectAttempts++;
      // Try to reconnect
      this.connect(this.token || undefined).catch(() => {
        // If reconnect fails, it will trigger another attempt via handleClose
      });
    }, reconnectDelay);
  }

  /**
   * Update the connection status and emit events
   * @param status New connection status
   */
  private updateConnectionStatus(status: ConnectionStatus): void {
    if (status === this.connectionStatus) {
      return;
    }
    
    this.connectionStatus = status;
    
    // Emit the statusChanged event
    this.emit('statusChanged', status);
    
    // Also emit to the 'connectionStatus' channel for components that subscribe to it
    const callbacks = this.subscriptions.get('connectionStatus');
    if (callbacks) {
      const data = { 
        status, 
        timestamp: Date.now(),
        failureReason: this.connectionFailureReason,
        duration: this.getConnectionDuration()
      };
      
      callbacks.forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('Error in connectionStatus callback:', error);
        }
      });
    }
  }
}

// Export a singleton instance
export const realtimeService = new RealtimeService();
export default realtimeService;

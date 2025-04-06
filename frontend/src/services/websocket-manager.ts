import { io, Socket } from 'socket.io-client';

/**
 * Connection status enum for WebSocket connections
 */
export enum ConnectionStatus {
  CONNECTED = 'connected',
  CONNECTING = 'connecting',
  RECONNECTING = 'reconnecting',
  DISCONNECTED = 'disconnected',
  ERROR = 'error'
}

/**
 * WebSocket error event
 */
export interface WebSocketError {
  code?: string;
  message: string;
  timestamp: number;
  originalError?: any;
}

/**
 * Interface for message handlers
 */
type MessageHandler = (data: any) => void;

/**
 * Interface for error handlers
 */
type ErrorHandler = (error: WebSocketError) => void;

/**
 * WebSocket Manager for handling real-time communication with the backend
 */
export class WebSocketManager {
  private socket: Socket | null = null;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private token: string | null = null;
  private wsUrl: string;
  private reconnectAttempts: number = 0;
  private maxReconnectAttempts: number = 10;
  private reconnectInterval: number = 1000; // Base interval in ms
  private autoReconnect: boolean = true;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private subscriptions: Map<string, MessageHandler[]> = new Map();
  private errorListeners: ErrorHandler[] = [];
  private messageListeners: MessageHandler[] = [];
  private pendingMessages: Array<{ channel: string, data: any }> = [];
  private statusListeners: Array<(status: ConnectionStatus) => void> = [];
  private connectionPromise: Promise<boolean> | null = null;
  private lastActivity: number = Date.now();
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  
  /**
   * Creates a new WebSocket Manager
   * @param wsUrl Base URL for the WebSocket server
   */
  constructor(wsUrl: string) {
    this.wsUrl = wsUrl;
  }
  
  /**
   * Connects to the WebSocket server
   * @param token Authentication token
   * @returns Promise that resolves when connected
   */
  public connect(token: string): Promise<boolean> {
    if (this.connectionPromise) {
      return this.connectionPromise;
    }
    
    this.token = token;
    
    // If already connected, return immediately
    if (this.socket?.connected) {
      return Promise.resolve(true);
    }
    
    this.setStatus(ConnectionStatus.CONNECTING);
    
    this.connectionPromise = new Promise<boolean>((resolve, reject) => {
      try {
        // Close any existing socket
        if (this.socket) {
          this.socket.close();
          this.socket = null;
        }
        
        // Clear any existing reconnect timer
        if (this.reconnectTimer) {
          clearTimeout(this.reconnectTimer);
          this.reconnectTimer = null;
        }
        
        // Initialize Socket.IO connection with token
        this.socket = io(`${this.wsUrl}/ws`, {
          path: '/ws',
          query: { token },
          reconnection: false, // We'll handle reconnection ourselves
          timeout: 20000, // 20 seconds timeout
          transports: ['websocket', 'polling']
        });
        
        // Set up event listeners
        this.setupEventListeners(resolve, reject);
        
        // Start heartbeat after connection
        this.setupHeartbeat();
        
      } catch (error) {
        console.error('WebSocket connection error:', error);
        this.setStatus(ConnectionStatus.ERROR);
        this.connectionPromise = null;
        this.triggerError({
          code: 'CONNECTION_ERROR',
          message: error instanceof Error ? error.message : 'Unknown connection error',
          timestamp: Date.now(),
          originalError: error
        });
        reject(error);
      }
    });
    
    return this.connectionPromise;
  }
  
  /**
   * Configure auto-reconnect settings
   * @param enabled Whether to auto reconnect
   * @param maxAttempts Maximum reconnection attempts
   */
  public setAutoReconnect(enabled: boolean, maxAttempts: number = 10): void {
    this.autoReconnect = enabled;
    this.maxReconnectAttempts = maxAttempts;
  }
  
  /**
   * Start reconnection process with exponential backoff
   */
  public reconnect(): void {
    // Don't reconnect if already reconnecting or connected
    if (this.status === ConnectionStatus.RECONNECTING || this.status === ConnectionStatus.CONNECTING) {
      return;
    }
    
    // Reset connection promise
    this.connectionPromise = null;
    
    // Clear any existing reconnect timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    // If we've exceeded max attempts, give up
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error(`WebSocket reconnection failed after ${this.reconnectAttempts} attempts`);
      this.setStatus(ConnectionStatus.ERROR);
      this.triggerError({
        code: 'MAX_RECONNECT_ATTEMPTS',
        message: `Reconnection failed after ${this.reconnectAttempts} attempts`,
        timestamp: Date.now()
      });
      return;
    }
    
    // Increment reconnect attempts
    this.reconnectAttempts++;
    
    // Calculate backoff time with exponential backoff and jitter
    const backoffFactor = Math.min(30, Math.pow(1.5, this.reconnectAttempts - 1));
    const jitter = Math.random() * 0.5 + 0.75; // Random between 0.75 and 1.25
    const backoffTime = Math.floor(this.reconnectInterval * backoffFactor * jitter);
    
    console.log(`WebSocket reconnecting in ${backoffTime}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
    
    this.setStatus(ConnectionStatus.RECONNECTING);
    
    // Schedule reconnection attempt
    this.reconnectTimer = setTimeout(() => {
      if (this.token) {
        this.connect(this.token)
          .catch(error => {
            console.error('WebSocket reconnection attempt failed:', error);
            this.triggerError({
              code: 'RECONNECTION_FAILED',
              message: error instanceof Error ? error.message : 'Reconnection failed',
              timestamp: Date.now(),
              originalError: error
            });
            
            // Try again if auto-reconnect is enabled
            if (this.autoReconnect) {
              this.reconnect();
            }
          });
      } else {
        console.error('Cannot reconnect: no authentication token available');
        this.setStatus(ConnectionStatus.ERROR);
        this.triggerError({
          code: 'NO_TOKEN',
          message: 'Cannot reconnect: no authentication token available',
          timestamp: Date.now()
        });
      }
    }, backoffTime);
  }
  
  /**
   * Setup heartbeat to detect disconnections more quickly
   */
  private setupHeartbeat(): void {
    // Clear any existing interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    
    // Set up regular heartbeat to detect disconnections
    this.heartbeatInterval = setInterval(() => {
      if (!this.socket?.connected) return;
      
      // If no activity in 30 seconds, send ping
      if (Date.now() - this.lastActivity > 30000) {
        this.ping().catch(() => {
          console.warn('Heartbeat ping failed, connection may be lost');
          
          // Socket.io might not have detected the disconnection yet
          if (this.socket?.connected) {
            this.socket.disconnect();
          }
        });
      }
    }, 15000); // Check every 15 seconds
  }
  
  /**
   * Set up Socket.IO event listeners
   */
  private setupEventListeners(
    resolveConnection: (value: boolean) => void, 
    rejectConnection: (reason: any) => void
  ): void {
    if (!this.socket) return;
    
    // Connection established
    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.setStatus(ConnectionStatus.CONNECTED);
      this.reconnectAttempts = 0;
      this.lastActivity = Date.now();
      this.processPendingMessages();
      resolveConnection(true);
      this.connectionPromise = null;
      
      // Resubscribe to all channels
      this.resubscribeToChannels();
    });
    
    // Connection error
    this.socket.on('connect_error', (error) => {
      console.error('WebSocket connection error:', error);
      this.setStatus(ConnectionStatus.ERROR);
      this.lastActivity = Date.now();
      
      const wsError: WebSocketError = {
        code: 'CONNECT_ERROR',
        message: error instanceof Error ? error.message : 'Connection error',
        timestamp: Date.now(),
        originalError: error
      };
      
      this.triggerError(wsError);
      
      if (this.reconnectAttempts === 0) {
        // First attempt failed
        rejectConnection(error);
        this.connectionPromise = null;
        
        // Start reconnection process if enabled
        if (this.autoReconnect) {
          this.reconnect();
        }
      }
    });
    
    // Disconnection
    this.socket.on('disconnect', (reason) => {
      console.log(`WebSocket disconnected: ${reason}`);
      this.setStatus(ConnectionStatus.DISCONNECTED);
      this.lastActivity = Date.now();
      
      // If disconnected due to token expiration or authentication error
      if (reason === 'io server disconnect') {
        // Server sent disconnect - don't try to reconnect automatically
        this.triggerError({
          code: 'SERVER_DISCONNECT',
          message: 'Disconnected by server (likely authentication error)',
          timestamp: Date.now()
        });
        return;
      }
      
      if (reason === 'io client disconnect') {
        // Client intentionally disconnected
        return;
      }
      
      // Start reconnection process if enabled
      if (this.autoReconnect) {
        this.reconnect();
      }
    });
    
    // Received a message
    this.socket.on('message', (message: any) => {
      this.lastActivity = Date.now();
      this.handleMessage(message);
      
      // Notify all raw message listeners
      this.messageListeners.forEach(listener => {
        try {
          listener(message);
        } catch (error) {
          console.error('Error in message listener:', error);
        }
      });
    });
    
    // Authentication errors
    this.socket.on('auth_error', (error: any) => {
      console.error('WebSocket authentication error:', error);
      this.lastActivity = Date.now();
      
      this.triggerError({
        code: 'AUTH_ERROR',
        message: error?.message || 'Authentication error',
        timestamp: Date.now(),
        originalError: error
      });
      
      // Notify auth error subscribers
      const handlers = this.subscriptions.get('auth_error') || [];
      handlers.forEach(handler => {
        try {
          handler(error);
        } catch (e) {
          console.error('Error in auth_error handler:', e);
        }
      });
    });
    
    // Handle other server events
    this.socket.on('pong', (data: any) => {
      // Received a pong response to our ping
      this.lastActivity = Date.now();
      console.debug('Received pong response:', data);
    });
  }
  
  /**
   * After reconnection, resubscribe to all previously subscribed channels
   */
  private resubscribeToChannels(): void {
    if (!this.socket?.connected) return;
    
    // Skip special channels like 'auth_error'
    const specialChannels = ['auth_error'];
    
    // Convert the map entries to an array to avoid the MapIterator issue
    const subscriptionEntries = Array.from(this.subscriptions.entries());
    
    for (const [channel, handlers] of subscriptionEntries) {
      if (handlers.length > 0 && !specialChannels.includes(channel)) {
        this.socket.emit('subscribe', { channel });
        console.log(`Resubscribed to channel: ${channel}`);
      }
    }
  }
  
  /**
   * Handle incoming messages from the server
   * @param message Message from server
   */
  private handleMessage(message: any): void {
    try {
      const { type, payload, timestamp } = message;
      
      // Find handlers for this message type
      const handlers = this.subscriptions.get(type) || [];
      
      if (handlers.length === 0) {
        console.debug(`No handlers for message type: ${type}`);
        return;
      }
      
      // Call all handlers
      handlers.forEach(handler => {
        try {
          handler(payload);
        } catch (error) {
          console.error(`Error in message handler for ${type}:`, error);
        }
      });
    } catch (error) {
      console.error('Error processing WebSocket message:', error, message);
      this.triggerError({
        code: 'MESSAGE_PROCESSING_ERROR',
        message: 'Error processing message',
        timestamp: Date.now(),
        originalError: error
      });
    }
  }
  
  /**
   * Process any messages that were queued while disconnected
   */
  private processPendingMessages(): void {
    if (this.pendingMessages.length === 0) return;
    
    console.log(`Processing ${this.pendingMessages.length} pending messages`);
    
    this.pendingMessages.forEach(({ channel, data }) => {
      this.send(channel, data);
    });
    
    this.pendingMessages = [];
  }
  
  /**
   * Send a message to the server
   * @param channel Channel name
   * @param data Message data
   * @returns Whether the message was sent or queued
   */
  public send(channel: string, data: any): boolean {
    if (!this.socket?.connected) {
      // Queue message for later
      this.pendingMessages.push({ channel, data });
      console.debug(`WebSocket not connected, queuing message for ${channel}`);
      return false;
    }
    
    try {
      this.socket.emit(channel, data);
      this.lastActivity = Date.now();
      return true;
    } catch (error) {
      console.error(`Error sending message to ${channel}:`, error);
      this.triggerError({
        code: 'SEND_ERROR',
        message: `Error sending message to ${channel}`,
        timestamp: Date.now(),
        originalError: error
      });
      return false;
    }
  }
  
  /**
   * Subscribe to a channel
   * @param channel Channel name
   * @param callback Function to call when messages arrive
   * @returns Unsubscribe function
   */
  public subscribe(channel: string, callback: MessageHandler): () => void {
    // Initialize handler list if needed
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
      
      // Send subscription message to server if connected
      if (this.socket?.connected && channel !== 'auth_error') {
        this.socket.emit('subscribe', { channel });
      }
    }
    
    // Add the handler
    const handlers = this.subscriptions.get(channel)!;
    handlers.push(callback);
    
    // Return an unsubscribe function
    return () => {
      const index = handlers.indexOf(callback);
      if (index !== -1) {
        handlers.splice(index, 1);
        
        // If this was the last handler, unsubscribe from server
        if (handlers.length === 0 && this.socket?.connected && channel !== 'auth_error') {
          this.socket.emit('unsubscribe', { channel });
          this.subscriptions.delete(channel);
        }
      }
    };
  }
  
  /**
   * Unsubscribe from a channel
   * @param channel Channel to unsubscribe from
   * @returns Whether the unsubscription was successful
   */
  public unsubscribe(channel: string): boolean {
    if (!this.subscriptions.has(channel)) {
      return false;
    }
    
    // Remove all handlers
    this.subscriptions.delete(channel);
    
    // Send unsubscribe message to server if connected
    if (this.socket?.connected && channel !== 'auth_error') {
      this.socket.emit('unsubscribe', { channel });
    }
    
    return true;
  }
  
  /**
   * Get a list of active subscription channels
   * @returns Array of channel names
   */
  public getActiveSubscriptions(): string[] {
    return Array.from(this.subscriptions.keys());
  }
  
  /**
   * Register a handler for all messages
   * @param callback Function to call for all messages
   * @returns Unsubscribe function
   */
  public onMessage(callback: MessageHandler): () => void {
    this.messageListeners.push(callback);
    
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index !== -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Register a handler for WebSocket errors
   * @param callback Function to call on errors
   * @returns Unsubscribe function
   */
  public onError(callback: ErrorHandler): () => void {
    this.errorListeners.push(callback);
    
    return () => {
      const index = this.errorListeners.indexOf(callback);
      if (index !== -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Trigger an error event
   * @param error WebSocket error
   */
  private triggerError(error: WebSocketError): void {
    // Notify all error listeners
    this.errorListeners.forEach(listener => {
      try {
        listener(error);
      } catch (e) {
        console.error('Error in error listener:', e);
      }
    });
  }
  
  /**
   * Test the WebSocket connection with a ping
   * @returns Promise that resolves with the pong response
   */
  public ping(): Promise<any> {
    return new Promise((resolve, reject) => {
      if (!this.socket?.connected) {
        reject(new Error('WebSocket not connected'));
        return;
      }
      
      // Set up a one-time listener for the pong response
      this.socket.once('pong', (response: any) => {
        this.lastActivity = Date.now();
        resolve(response);
      });
      
      // Send ping with timeout
      this.socket.emit('ping', { timestamp: Date.now() });
      this.lastActivity = Date.now();
      
      // Set timeout to reject if no response
      setTimeout(() => {
        reject(new Error('WebSocket ping timeout'));
      }, 5000);
    });
  }
  
  /**
   * Updates the authentication token
   * @param token New token
   */
  public updateToken(token: string): void {
    this.token = token;
    
    // Update socket query params for reconnection
    if (this.socket) {
      this.socket.io.opts.query = { token };
    }
  }
  
  /**
   * Subscribe to connection status changes
   * @param callback Function to call when status changes
   * @returns Unsubscribe function
   */
  public onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    
    // Call immediately with current status
    callback(this.status);
    
    // Return unsubscribe function
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index !== -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }
  
  /**
   * Disconnect from the server
   */
  public disconnect(): void {
    // Clear heartbeat interval
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    
    // Clear reconnection timer
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
    
    this.setStatus(ConnectionStatus.DISCONNECTED);
  }
  
  /**
   * Check if connected to the WebSocket server
   */
  public isConnected(): boolean {
    return this.socket?.connected || false;
  }
  
  /**
   * Get current connection status
   */
  public getConnectionStatus(): ConnectionStatus {
    return this.status;
  }
  
  /**
   * Set connection status and notify listeners
   */
  private setStatus(status: ConnectionStatus): void {
    if (this.status === status) return;
    
    this.status = status;
    
    // Notify all status listeners
    this.statusListeners.forEach(listener => {
      try {
        listener(status);
      } catch (error) {
        console.error('Error in status listener:', error);
      }
    });
  }
}
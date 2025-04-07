// WebSocket manager implementation

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export interface WebSocketError {
  code: number;
  reason: string;
  timestamp: number;
  message: string; // Added message property
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private autoReconnect = true;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private errorListeners: ((error: WebSocketError) => void)[] = [];
  private messageListeners: ((data: any) => void)[] = [];
  private subscriptions = new Map<string, ((data: any) => void)[]>();

  constructor(url: string) {
    this.url = url;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  connect(token?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.isConnected()) {
        return resolve(true);
      }

      try {
        const fullUrl = token ? `${this.url}?token=${encodeURIComponent(token)}` : this.url;
        this.ws = new WebSocket(fullUrl);
        this.setStatus(ConnectionStatus.CONNECTING);

        this.ws.onopen = () => {
          this.setStatus(ConnectionStatus.CONNECTED);
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.ws.onclose = (event) => {
          this.setStatus(ConnectionStatus.DISCONNECTED);
          this.notifyError({
            code: event.code,
            reason: event.reason,
            message: event.reason || 'Connection closed',
            timestamp: Date.now()
          });
          
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
          
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            reject(new Error('Failed to connect'));
          }
        };

        this.ws.onerror = (error) => {
          this.setStatus(ConnectionStatus.ERROR);
          this.notifyError({
            code: 0,
            reason: 'WebSocket error',
            message: 'WebSocket error occurred',
            timestamp: Date.now()
          });
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Handle subscription messages
            if (message.channel) {
              const listeners = this.subscriptions.get(message.channel);
              if (listeners) {
                listeners.forEach(listener => listener(message.data));
              }
            }
            
            // Handle all messages
            this.notifyMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

      } catch (error) {
        this.setStatus(ConnectionStatus.ERROR);
        reject(error);
      }
    });
  }

  private reconnect(): void {
    this.setStatus(ConnectionStatus.RECONNECTING);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      this.connect().catch(() => {
        console.log(`Reconnect attempt ${this.reconnectAttempts} failed`);
      });
    }, this.reconnectTimeout * this.reconnectAttempts);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.setStatus(ConnectionStatus.DISCONNECTED);
    }
  }

  send(data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.isConnected()) {
        return reject(new Error('WebSocket not connected'));
      }

      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
      
      if (this.isConnected()) {
        this.send({ action: 'subscribe', channel }).catch(err => {
          console.error(`Failed to subscribe to ${channel}`, err);
        });
      }
    }

    const listeners = this.subscriptions.get(channel)!;
    listeners.push(callback);

    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }

      if (listeners.length === 0) {
        this.subscriptions.delete(channel);
        
        if (this.isConnected()) {
          this.send({ action: 'unsubscribe', channel }).catch(err => {
            console.error(`Failed to unsubscribe from ${channel}`, err);
          });
        }
      }
    };
  }

  unsubscribe(channel: string): void {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.delete(channel);
      
      if (this.isConnected()) {
        this.send({ action: 'unsubscribe', channel }).catch(err => {
          console.error(`Failed to unsubscribe from ${channel}`, err);
        });
      }
    }
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index !== -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  onError(callback: (error: WebSocketError) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      const index = this.errorListeners.indexOf(callback);
      if (index !== -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  onMessage(callback: (data: any) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index !== -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.notifyStatusChange();
    }
  }

  private notifyStatusChange(): void {
    this.statusListeners.forEach(listener => listener(this.status));
  }

  private notifyError(error: WebSocketError): void {
    this.errorListeners.forEach(listener => listener(error));
  }

  private notifyMessage(message: any): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  setAutoReconnect(enabled: boolean, maxAttempts?: number): void {
    this.autoReconnect = enabled;
    if (maxAttempts !== undefined) {
      this.maxReconnectAttempts = maxAttempts;
    }
  }
}

// Export a default instance
export default WebSocketManager;

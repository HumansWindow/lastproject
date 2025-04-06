import { EventEmitter } from 'events';
import { ethers } from 'ethers';
import { Logger } from '@nestjs/common';

// Add WebSocket type definition for Node.js environment
type WebSocketReadyState = 0 | 1 | 2 | 3;
interface WebSocketInterface {
  readyState: WebSocketReadyState;
  close: () => void;
  ping?: () => void;
  on: (event: string, listener: any) => void;
  removeAllListeners: (event?: string) => void;
}

interface WebSocketState {
  provider: ethers.providers.WebSocketProvider;
  url: string;
  chainId: number;
  networkName: string;
  lastConnected: Date;
  connectionAttempts: number;
  isConnecting: boolean;
  watchedAddresses: Set<string>;
}

/**
 * Monitoring service for blockchain events
 * Handles WebSocket connections with automatic reconnection logic
 * Monitors wallet balances and transactions in real-time
 */
export class MonitoringService {
  private readonly logger = new Logger(MonitoringService.name);
  private readonly events = new EventEmitter();
  private readonly wsProviders = new Map<string, WebSocketState>();
  
  // Configuration
  private readonly maxReconnectAttempts = 10;
  private readonly initialReconnectDelay = 1000; // 1 second
  private readonly maxReconnectDelay = 60000; // 1 minute
  private readonly healthCheckInterval = 30000; // 30 seconds
  private readonly healthCheckTimeoutId: NodeJS.Timeout;
  private readonly wsOpenTimeout = 10000; // 10 seconds
  private readonly emitTimeout = 5000; // 5 seconds

  constructor() {
    // Setup periodic health check for WebSocket connections
    this.healthCheckTimeoutId = setInterval(() => this.checkConnectionHealth(), this.healthCheckInterval);
    
    // Free resources when Node.js process exits
    process.on('exit', () => {
      this.cleanup();
    });
    
    this.logger.log('Monitoring service initialized');
  }

  /**
   * Set up a WebSocket connection for monitoring
   * @param url WebSocket URL
   * @param chainId Blockchain network ID
   * @param networkName Human-readable network name
   * @returns Connected provider
   */
  public async setupWebSocket(url: string, chainId: number, networkName: string): Promise<ethers.providers.WebSocketProvider> {
    if (this.wsProviders.has(url)) {
      return this.wsProviders.get(url).provider;
    }

    const wsState: WebSocketState = {
      provider: null,
      url,
      chainId,
      networkName,
      lastConnected: null,
      connectionAttempts: 0,
      isConnecting: false,
      watchedAddresses: new Set<string>(),
    };

    try {
      await this.connectWebSocket(wsState);
      this.wsProviders.set(url, wsState);
      return wsState.provider;
    } catch (error) {
      this.logger.error(`Failed to set up WebSocket connection to ${networkName}:`, error);
      throw new Error(`Failed to connect to ${networkName} WebSocket: ${error.message}`);
    }
  }

  /**
   * Connect to WebSocket with timeout
   * @param wsState WebSocket connection state
   */
  private async connectWebSocket(wsState: WebSocketState): Promise<void> {
    if (wsState.isConnecting) {
      this.logger.warn(`Already attempting to connect to ${wsState.networkName}, skipping duplicate attempt`);
      return;
    }

    wsState.isConnecting = true;
    wsState.connectionAttempts++;

    try {
      // Create a promise that resolves when the WebSocket connection is established
      const connectionPromise = new Promise<ethers.providers.WebSocketProvider>((resolve, reject) => {
        try {
          const provider = new ethers.providers.WebSocketProvider(wsState.url);

          // Add safety check for _websocket property
          if (!provider._websocket) {
            return reject(new Error(`WebSocket not initialized for ${wsState.networkName}`));
          }

          // Listen for connection open
          provider._websocket.on('open', () => {
            wsState.lastConnected = new Date();
            wsState.connectionAttempts = 0;
            wsState.isConnecting = false;
            this.logger.log(`WebSocket connected to ${wsState.networkName}`);
            resolve(provider);
          });

          // Listen for connection error
          provider._websocket.on('error', (err) => {
            this.logger.error(`WebSocket error for ${wsState.networkName}:`, err);
            reject(err);
          });

          // Set up reconnection logic
          provider._websocket.on('close', (code, reason) => {
            this.logger.warn(`WebSocket connection closed for ${wsState.networkName}: ${code} - ${reason}`);
            
            // Remove listeners to prevent memory leaks
            provider._websocket.removeAllListeners();
            
            // If we already have a reference to this provider in our state, attempt reconnection
            if (wsState.provider === provider) {
              wsState.provider = null;
              this.attemptReconnect(wsState);
            }
          });
        } catch (err) {
          reject(err);
        }
      });

      // Add a timeout to the connection promise
      const timeoutPromise = new Promise<never>((_, reject) => {
        setTimeout(() => {
          reject(new Error(`WebSocket connection to ${wsState.networkName} timed out after ${this.wsOpenTimeout}ms`));
        }, this.wsOpenTimeout);
      });

      // Race the connection against the timeout
      const provider = await Promise.race([
        connectionPromise,
        timeoutPromise,
      ]);

      wsState.provider = provider;
      wsState.isConnecting = false;
      
    } catch (error) {
      wsState.isConnecting = false;
      this.logger.error(`Failed to connect WebSocket to ${wsState.networkName}:`, error);
      
      // Attempt to reconnect if this wasn't already a reconnection attempt
      this.attemptReconnect(wsState);
      throw error;
    }
  }

  /**
   * Attempt to reconnect with exponential backoff
   * @param wsState WebSocket connection state
   */
  private attemptReconnect(wsState: WebSocketState): void {
    if (wsState.connectionAttempts > this.maxReconnectAttempts) {
      this.logger.error(`Exceeded maximum reconnection attempts (${this.maxReconnectAttempts}) for ${wsState.networkName}, giving up`);
      // Emit a critical error event that should be handled by the application
      this.events.emit('critical-error', {
        networkName: wsState.networkName,
        chainId: wsState.chainId,
        error: new Error(`Failed to connect to ${wsState.networkName} after ${this.maxReconnectAttempts} attempts`),
      });
      return;
    }

    // Calculate backoff delay using exponential backoff with jitter
    const backoffDelay = Math.min(
      this.initialReconnectDelay * Math.pow(1.5, wsState.connectionAttempts - 1),
      this.maxReconnectDelay
    );
    
    // Add random jitter (±20%) to prevent reconnection stampedes
    const jitter = backoffDelay * 0.2;
    const delay = backoffDelay + (Math.random() * jitter * 2 - jitter);
    
    this.logger.log(`Attempting to reconnect to ${wsState.networkName} in ${Math.round(delay)}ms (attempt ${wsState.connectionAttempts})`);
    
    // Schedule reconnection attempt
    setTimeout(async () => {
      try {
        await this.connectWebSocket(wsState);
        
        // Re-subscribe to all previously watched addresses
        if (wsState.watchedAddresses.size > 0) {
          this.logger.log(`Re-subscribing to ${wsState.watchedAddresses.size} addresses on ${wsState.networkName}`);
          for (const address of wsState.watchedAddresses) {
            await this.subscribeToAddressActivity(address, wsState.provider, wsState.chainId, wsState.networkName);
          }
        }
      } catch (error) {
        // Reconnection will be attempted again from the 'close' event handler
      }
    }, delay);
  }

  /**
   * Subscribe to address activity (transactions and balance changes)
   * @param address Wallet address to monitor
   * @param chainId Blockchain network ID
   */
  public async subscribeToAddress(address: string, chainId: number): Promise<void> {
    // Find the appropriate WebSocket provider for this chain
    const wsState = Array.from(this.wsProviders.values())
      .find(state => state.chainId === chainId && state.provider !== null);
    
    if (!wsState) {
      throw new Error(`No WebSocket provider available for chain ID ${chainId}`);
    }

    await this.subscribeToAddressActivity(address, wsState.provider, chainId, wsState.networkName);
    wsState.watchedAddresses.add(address);
  }

  /**
   * Set up subscription listeners for an address
   * @param address Wallet address
   * @param provider WebSocket provider
   * @param chainId Blockchain network ID
   * @param networkName Network name for logging
   */
  private async subscribeToAddressActivity(
    address: string,
    provider: ethers.providers.WebSocketProvider,
    chainId: number,
    networkName: string,
  ): Promise<void> {
    try {
      const normalizedAddress = address.toLowerCase();

      // Get initial balance
      const initialBalance = await provider.getBalance(address);
      
      // Listen for pending transactions
      provider.on('pending', async (txHash) => {
        try {
          const tx = await provider.getTransaction(txHash);
          if (!tx) return;

          // Check if transaction involves our address
          const isInvolved = (
            tx.from?.toLowerCase() === normalizedAddress || 
            tx.to?.toLowerCase() === normalizedAddress
          );

          if (isInvolved) {
            this.safeEmit('pending-transaction', {
              chainId,
              networkName,
              address: normalizedAddress,
              transaction: tx,
            });
          }
        } catch (error) {
          this.logger.warn(`Error processing pending transaction ${txHash} on ${networkName}:`, error);
        }
      });

      // Listen for confirmed blocks to check balance changes
      provider.on('block', async (blockNumber) => {
        try {
          const currentBalance = await provider.getBalance(address);
          
          if (!initialBalance.eq(currentBalance)) {
            this.safeEmit('balance-change', {
              chainId,
              networkName,
              address: normalizedAddress,
              previousBalance: initialBalance,
              newBalance: currentBalance,
              blockNumber,
            });
          }
        } catch (error) {
          this.logger.warn(`Error checking balance for ${address} on ${networkName}:`, error);
        }
      });

      this.logger.log(`Subscribed to activity for address ${address} on ${networkName}`);
      
    } catch (error) {
      this.logger.error(`Failed to subscribe to address ${address} on ${networkName}:`, error);
      throw error;
    }
  }

  /**
   * Check the health of all WebSocket connections
   */
  private async checkConnectionHealth(): Promise<void> {
    for (const [url, wsState] of this.wsProviders.entries()) {
      if (!wsState.provider) {
        this.logger.warn(`No active provider for ${wsState.networkName}, attempting to reconnect`);
        try {
          await this.connectWebSocket(wsState);
        } catch (error) {
          // Error is already logged in connectWebSocket
        }
        continue;
      }

      // Check if WebSocket is still open using the proper constant
      const OPEN = 1; // WebSocket.OPEN constant value
      if (!wsState.provider._websocket || wsState.provider._websocket.readyState !== OPEN) {
        this.logger.warn(`WebSocket for ${wsState.networkName} is not open, attempting to reconnect`);
        wsState.provider = null;
        this.attemptReconnect(wsState);
        continue;
      }

      // Send a ping to check if the connection is responsive
      try {
        const pingPromise = wsState.provider.getBlockNumber();
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Timeout')), 5000);
        });

        await Promise.race([pingPromise, timeoutPromise]);
      } catch (error) {
        this.logger.warn(`WebSocket ping failed for ${wsState.networkName}, attempting to reconnect`);
        wsState.provider = null;
        this.attemptReconnect(wsState);
      }
    }
  }

  /**
   * Safely emit an event with timeout protection
   * @param event Event name
   * @param data Event data
   */
  private safeEmit(event: string, data: any): void {
    try {
      // Set a timeout for the emit to ensure it doesn't block
      const timeoutId = setTimeout(() => {
        this.logger.warn(`Event emit for '${event}' timed out after ${this.emitTimeout}ms`);
      }, this.emitTimeout);
      
      this.events.emit(event, data);
      clearTimeout(timeoutId);
    } catch (error) {
      this.logger.error(`Error emitting event '${event}':`, error);
    }
  }

  /**
   * Subscribe to monitoring events
   * @param event Event name
   * @param listener Event handler
   */
  public on(event: string, listener: (...args: any[]) => void): void {
    this.events.on(event, listener);
  }

  // Add methods to match the interface used in hotwallet/index.ts
  public off(event: string, listener: (...args: any[]) => void): void {
    this.events.off(event, listener);
  }

  public monitorAddress(network: string, address: string, options?: any): Promise<void> {
    return this.subscribeToAddress(address, parseInt(network));
  }

  public stopMonitoring(network: string, address: string): Promise<void> {
    const wsState = Array.from(this.wsProviders.values())
      .find(state => state.chainId === parseInt(network));
    
    if (wsState && wsState.watchedAddresses.has(address)) {
      wsState.watchedAddresses.delete(address);
      if (wsState.provider) {
        wsState.provider.removeAllListeners();
      }
    }
    return Promise.resolve();
  }

  public async monitorNFTTransfers(network: string, address: string, options?: any): Promise<void> {
    const wsState = Array.from(this.wsProviders.values())
      .find(state => state.chainId === parseInt(network));
    
    if (!wsState || !wsState.provider) {
      throw new Error(`No WebSocket provider available for network ${network}`);
    }

    // Monitor NFT transfer events for the address
    const erc721Interface = new ethers.utils.Interface([
      'event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)'
    ]);

    wsState.provider.on('logs', (log) => {
      try {
        const parsedLog = erc721Interface.parseLog(log);
        if (parsedLog && (
          parsedLog.args.from.toLowerCase() === address.toLowerCase() ||
          parsedLog.args.to.toLowerCase() === address.toLowerCase()
        )) {
          this.safeEmit('nft-transfer', {
            chainId: wsState.chainId,
            networkName: wsState.networkName,
            address,
            log: parsedLog
          });
        }
      } catch (error) {
        // Ignore parsing errors for non-NFT transfer events
      }
    });
  }

  public stopMonitoringNFTs(network: string, address: string): Promise<void> {
    const wsState = Array.from(this.wsProviders.values())
      .find(state => state.chainId === parseInt(network));
    
    if (wsState && wsState.provider) {
      wsState.provider.removeAllListeners('logs');
    }
    return Promise.resolve();
  }

  public destroy(): Promise<void> {
    this.cleanup();
    return Promise.resolve();
  }

  public stop(): Promise<void> {
    this.cleanup();
    return Promise.resolve();
  }

  public removeAllListeners(event?: string): void {
    this.events.removeAllListeners(event);
  }

  /**
   * Clean up resources and close connections
   */
  public cleanup(): void {
    // Clear the health check interval
    if (this.healthCheckTimeoutId) {
      clearInterval(this.healthCheckTimeoutId);
    }

    // Close all WebSocket connections
    for (const [url, wsState] of this.wsProviders.entries()) {
      if (wsState.provider && wsState.provider._websocket) {
        try {
          wsState.provider._websocket.close();
        } catch (error) {
          // Ignore errors during cleanup
        }
      }
    }

    // Clear all event listeners
    this.events.removeAllListeners();
    
    this.logger.log('Monitoring service resources cleaned up');
  }
}

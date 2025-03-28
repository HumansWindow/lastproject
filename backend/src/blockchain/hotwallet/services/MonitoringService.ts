import EventEmitter from 'events';
import { ethers } from 'ethers';
import { Connection, PublicKey } from '@solana/web3.js';
import ChainHandlers from '../handlers/ChainHandlers';

// Type definitions
interface MonitoringConfig {
  pollingInterval?: number;
  requeryInterval?: number;
  reconnectDelay?: number;
  maxReconnectDelay?: number;
  reconnectAttempts?: number;
  healthCheckInterval?: number;
  pingTimeout?: number;
  [key: string]: any;
}

interface ConnectionStatus {
  connected: boolean;
  reconnectAttempts: number;
  lastPingTime: number;
  isReconnecting?: boolean;
}

interface ConnectionStatusMap {
  [network: string]: ConnectionStatus;
}

interface MonitoredAddress {
  trackBalance: boolean;
  tokens: string[];
  lastBalances: {
    native?: string;
    [token: string]: string | undefined;
  };
  lastChecked: number;
}

interface MonitoredNFT {
  contractAddresses: string[];
  standards: string[];
  lastChecked: number;
}

interface AddressMap {
  [network: string]: {
    [address: string]: MonitoredAddress;
  };
}

interface NFTMap {
  [network: string]: {
    [address: string]: MonitoredNFT;
  };
}

// Add Timer type definition to avoid NodeJS namespace usage
type Timer = ReturnType<typeof setTimeout> | ReturnType<typeof setInterval>;

// Update TimerMap interface to be more specific
interface TimerMap {
  [key: string]: Timer | null | {
    standard: string;
    contract: ethers.Contract;
    timer?: Timer | null;
    active?: boolean;
  };
}

interface Metrics {
  reconnections: { [network: string]: number };
  events: { [network: string]: { [type: string]: number } };
  errors: { [network: string]: { [type: string]: number } };
  latency: { [network: string]: { [operation: string]: number[] } };
}

// NFT transfer event interfaces
const ERC721_TRANSFER_EVENT = 'Transfer(address,address,uint256)';
const ERC1155_TRANSFER_SINGLE_EVENT = 'TransferSingle(address,address,address,uint256,uint256)';
const ERC1155_TRANSFER_BATCH_EVENT = 'TransferBatch(address,address,address,uint256[],uint256[])';

// Add new interfaces
interface WebSocketProvider extends ethers.providers.WebSocketProvider {
  _websocket: {
    readyState: number;
    close: () => void;
    ping?: () => void;
  };
}

interface PaginatedResponse<T> {
  results?: T[];
  data?: { items?: T[] };
  items?: T[];
}

// Create a union type for all possible provider types
type SupportedProvider = ethers.providers.Provider | WebSocketProvider | Connection;

/**
 * Service for monitoring blockchain events
 * Tracks balance changes, transactions, and NFT transfers
 */
class MonitoringService extends EventEmitter {
  private chainHandlers: ChainHandlers;
  private providers: { [network: string]: SupportedProvider };
  private config: MonitoringConfig;
  private monitoredAddresses: AddressMap = {};
  private monitoredNFTs: NFTMap = {};
  private timers: TimerMap = {};
  private connectionStatus: ConnectionStatusMap = {}; // Change from readonly to private
  private readonly heartbeatTimers: { [network: string]: Timer } = {};
  private readonly metrics: Metrics;

  constructor(chainHandlers: ChainHandlers, config: MonitoringConfig = {}) {
    super();
    this.chainHandlers = chainHandlers;
    
    // Fix providers retrieval
    const providersFromChain = chainHandlers.getProviders();
    this.providers = Object.entries(providersFromChain).reduce((acc, [network, provider]) => {
      // Convert Solana Connection to compatible provider interface if needed
      if (provider instanceof Connection) {
        acc[network] = this.wrapSolanaProvider(provider);
      } else {
        acc[network] = provider as SupportedProvider;
      }
      return acc;
    }, {} as { [network: string]: SupportedProvider });

    this.config = {
      pollingInterval: 15000, // 15 seconds
      requeryInterval: 60000, // 1 minute
      reconnectDelay: 2000, // 2 seconds initial reconnect delay
      maxReconnectDelay: 30000, // 30 seconds max reconnect delay
      reconnectAttempts: 5, // Number of reconnection attempts
      healthCheckInterval: 60000, // 1 minute health check interval
      pingTimeout: 10000, // 10 seconds ping timeout
      ...config
    };
    
    // Monitoring state
    this.monitoredAddresses = {
      // network: { address: { options } }
    };
    
    this.monitoredNFTs = {
      // network: { address: { contractAddresses: [], options } }
    };
    
    // Timer references
    this.timers = {};
    
    // Connection status tracking
    this.connectionStatus = {
      // network: { connected: true/false, reconnectAttempts: 0, lastPingTime: timestamp }
    };
    
    // Heartbeat checks for WebSocket connections
    this.heartbeatTimers = {};
    
    // Initialize metrics first with all required properties before using them
    this.metrics = {
      reconnections: {}, // network: count
      events: {}, // network: { type: count }
      errors: {}, // network: { type: count }
      latency: {}, // network: { operation: [values] }
    };
    
    // Setup reconnection logic for WebSocket providers
    this._setupProvidersReconnection();
    
    // Setup periodic health checks
    this._setupHealthChecks();
  }
  
  /**
   * Set up reconnection logic for providers
   * @private
   */
  private _setupProvidersReconnection() {
    // For each provider that supports WebSocket
    Object.entries(this.providers).forEach(([network, provider]) => {
      if (provider && this.isEvmProvider(provider)) {
        // Initialize connection status
        this.connectionStatus[network] = {
          connected: true,
          reconnectAttempts: 0,
          lastPingTime: Date.now()
        };
        
        // Initialize metrics for this network
        this.metrics.reconnections[network] = 0;
        this.metrics.events[network] = {};
        this.metrics.errors[network] = {};
        this.metrics.latency[network] = {};
        
        // Handle errors
        provider.on('error', (error) => {
          console.error(`WebSocket error for ${network}:`, error);
          // Track error
          this.metrics.errors[network].websocket = (this.metrics.errors[network].websocket || 0) + 1;
          
          // Mark as disconnected
          if (this.connectionStatus[network]) {
            this.connectionStatus[network].connected = false;
          }
          
          this._reconnectProvider(network);
        });
        
        // Handle disconnections
        provider.on('disconnect', (code, reason) => {
          console.warn(`WebSocket disconnected for ${network}:`, code, reason);
          // Track disconnection
          this.metrics.errors[network].disconnect = (this.metrics.errors[network].disconnect || 0) + 1;
          
          // Mark as disconnected
          if (this.connectionStatus[network]) {
            this.connectionStatus[network].connected = false;
          }
          
          this._reconnectProvider(network);
        });
        
        // Add connected handler for confirmation
        if (provider.on) {
          provider.on('connect', () => {
            console.log(`WebSocket connected for ${network}`);
            if (this.connectionStatus[network]) {
              this.connectionStatus[network].connected = true;
              this.connectionStatus[network].reconnectAttempts = 0;
              this.connectionStatus[network].lastPingTime = Date.now();
            }
          });
        }
        
        // Start heartbeat check
        this._setupHeartbeat(network, provider);
      }
    });
  }
  
  /**
   * Set up heartbeat mechanism to detect broken connections
   * @private
   * @param {string} network - Network identifier
   * @param {Object} provider - Provider instance
   */
  private _setupHeartbeat(network: string, provider: ethers.providers.Provider) {
    if (!provider || !this.isWebSocketProvider(provider)) return;
    
    // Clear existing heartbeat timer
    if (this.heartbeatTimers[network]) {
      clearInterval(this.heartbeatTimers[network]);
    }
    
    // Set up new heartbeat check
    this.heartbeatTimers[network] = setInterval(() => {
      // Only check WebSocket providers
      if (provider._websocket) {
        try {
          // Send a ping request
          const startTime = Date.now();
          
          // Track last ping time
          if (this.connectionStatus[network]) {
            this.connectionStatus[network].lastPingTime = startTime;
          }
          
          // Check if we have ping method available
          if (provider._websocket.ping) {
            provider._websocket.ping();
          } else {
            // Fallback - check if we can get the block number
            provider.getBlockNumber().then(() => {
              // Track latency
              const latency = Date.now() - startTime;
              if (!this.metrics.latency[network].ping) {
                this.metrics.latency[network].ping = [];
              }
              
              this.metrics.latency[network].ping.push(latency);
              // Keep only last 100 measurements
              if (this.metrics.latency[network].ping.length > 100) {
                this.metrics.latency[network].ping.shift();
              }
              
              // Update last successful ping time
              if (this.connectionStatus[network]) {
                this.connectionStatus[network].lastPingTime = Date.now();
                this.connectionStatus[network].connected = true;
              }
            }).catch(error => {
              console.warn(`Ping failed for ${network}:`, error.message);
              // Track error
              this.metrics.errors[network].ping = (this.metrics.errors[network].ping || 0) + 1;
              
              // Check if connection is timed out
              const lastPingTime = this.connectionStatus[network]?.lastPingTime || 0;
              if (Date.now() - lastPingTime > this.config.pingTimeout) {
                console.error(`Connection to ${network} is unresponsive. Reconnecting...`);
                // Mark as disconnected
                if (this.connectionStatus[network]) {
                  this.connectionStatus[network].connected = false;
                }
                this._reconnectProvider(network);
              }
            });
          }
        } catch (error) {
          console.error(`Error in heartbeat for ${network}:`, error);
        }
      }
    }, this.config.healthCheckInterval);
  }
  
  /**
   * Set up periodic health checks for all connections
   * @private
   */
  private _setupHealthChecks() {
    // Skip timer creation in test environment
    if (process.env.NODE_ENV === 'test') {
      this.timers.healthCheck = null;
      return;
    }
    
    // Set up timer for general health check
    const timer = setInterval(() => {
      // Check connection status for all networks
      Object.entries(this.connectionStatus).forEach(([network, status]) => {
        // Check for dead connections (no ping response for a while)
        if (status.connected && (Date.now() - status.lastPingTime > this.config.pingTimeout * 2)) {
          console.warn(`Connection to ${network} may be stale. Last ping: ${new Date(status.lastPingTime).toISOString()}`);
          
          // Try to reconnect if it appears to be stale
          if (Date.now() - status.lastPingTime > this.config.pingTimeout * 3) {
            console.error(`Connection to ${network} is stale. Forcing reconnection...`);
            status.connected = false;
            this._reconnectProvider(network);
          }
        }
      });
      
      // Log monitoring stats periodically
      if (process.env.NODE_ENV !== 'test') {
        const monitoredNetworks = Object.keys(this.monitoredAddresses)
          .filter(network => Object.keys(this.monitoredAddresses[network] || {}).length > 0);
          
        const nftNetworks = Object.keys(this.monitoredNFTs)
          .filter(network => Object.keys(this.monitoredNFTs[network] || {}).length > 0);
        
        console.log(`Monitoring stats: ${monitoredNetworks.length} networks with balance monitoring, ${nftNetworks.length} networks with NFT monitoring`);
        console.log(`Connection status:`, Object.fromEntries(
          Object.entries(this.connectionStatus).map(([network, status]) => [
            network, 
            { connected: status.connected, reconnectAttempts: status.reconnectAttempts }
          ])
        ));
      }
    }, this.config.healthCheckInterval);
    
    this.timers.healthCheck = timer;
  }
  
  /**
   * Attempt to reconnect a provider
   * @private
   * @param {string} network - Network identifier
   */
  private async _reconnectProvider(network: string) {
    if (!this.connectionStatus[network]) {
      this.connectionStatus[network] = {
        connected: false,
        reconnectAttempts: 0,
        lastPingTime: 0
      };
    }
    
    const status = this.connectionStatus[network];
    
    // Prevent multiple simultaneous reconnection attempts
    if (status.isReconnecting) {
      console.log(`Already attempting to reconnect to ${network}`);
      return;
    }
    
    status.isReconnecting = true;
    
    // Track reconnection attempt
    this.metrics.reconnections[network] = (this.metrics.reconnections[network] || 0) + 1;
    
    if (status.reconnectAttempts >= this.config.reconnectAttempts) {
      console.error(`Maximum reconnection attempts reached for ${network}`);
      this.emit('providerError', {
        network,
        error: 'Maximum reconnection attempts reached',
        reconnectAttempts: status.reconnectAttempts
      });
      status.isReconnecting = false;
      return;
    }
    
    // Exponential backoff for reconnection attempts with jitter
    const baseDelay = this.config.reconnectDelay;
    const expDelay = baseDelay * Math.pow(2, status.reconnectAttempts);
    const jitter = Math.random() * 0.3 * expDelay; // Add up to 30% jitter
    const delay = Math.min(expDelay + jitter, this.config.maxReconnectDelay);
    
    console.log(`Attempting to reconnect ${network} in ${Math.round(delay)}ms (attempt ${status.reconnectAttempts + 1})`);
    
    // Set up reconnection timer
    setTimeout(() => {
      try {
        // Get the config for the specific network
        const rpcUrl = this.getChainConfig(network);
        if (!rpcUrl) {
          throw new Error(`No RPC URL available for ${network}`);
        }
        
        // Check if we should try to rotate to a different endpoint
        if (this.getChainEndpoints(network).length > 1) {
          // Try rotating to another endpoint if the method is available
          if (typeof this.chainHandlers.rotateEndpoint === 'function') {
            const newEndpoint = this.chainHandlers.rotateEndpoint(network);
            console.log(`Rotating ${network} provider to ${newEndpoint}`);
          }
        }
        
        // Create a new provider instance
        let newProvider;
        const rpcUrlToUse = this.getChainConfig(network); // Get potentially updated URL
        
        if (rpcUrlToUse.startsWith('wss://')) {
          newProvider = new ethers.providers.WebSocketProvider(rpcUrlToUse);
          
          // Add event listeners for WebSocket connection
          newProvider._websocket.onopen = () => {
            console.log(`WebSocket connection established for ${network}`);
            if (this.connectionStatus[network]) {
              this.connectionStatus[network].connected = true;
              this.connectionStatus[network].lastPingTime = Date.now();
            }
          };
        } else {
          newProvider = new ethers.providers.JsonRpcProvider(rpcUrlToUse);
        }
        
        // Test the connection before replacing
        newProvider.getBlockNumber().then(() => {
          console.log(`Successfully tested connection to ${network}`);
          
          // Replace the old provider
          const oldProvider = this.providers[network];
          
          // If old provider has a websocket that needs to be closed
          if (this.isWebSocketProvider(oldProvider) && oldProvider._websocket.readyState !== 3) {
            try {
              oldProvider._websocket.close();
            } catch (err) {
              console.warn(`Error closing old WebSocket for ${network}:`, err.message);
            }
          }
          
          this.providers[network] = newProvider;
          this.chainHandlers.updateProvider(network, newProvider);
          
          // Set up event listeners on new provider
          if (this.isWebSocketProvider(newProvider)) {
            newProvider.on('error', (error) => {
              console.error(`WebSocket error for ${network}:`, error);
              this._reconnectProvider(network);
            });
            
            newProvider.on('disconnect', (code, reason) => {
              console.warn(`WebSocket disconnected for ${network}:`, code, reason);
              this._reconnectProvider(network);
            });
          }
          
          // Reset connection status
          status.connected = true;
          status.reconnectAttempts = 0;
          status.lastPingTime = Date.now();
          status.isReconnecting = false;
          
          // Set up heartbeat for new connection
          this._setupHeartbeat(network, newProvider);
          
          // Emit reconnection event
          this.emit('providerReconnected', { network });
          
          console.log(`Successfully reconnected to ${network}`);
          
          // Restart any active monitoring
          this._restartMonitoringForNetwork(network);
        }).catch(error => {
          console.error(`Connection test failed for ${network}:`, error);
          
          // Increment reconnection attempt counter
          status.reconnectAttempts++;
          status.isReconnecting = false;
          
          // Mark the endpoint as failed in the chain handler
          if (typeof this.chainHandlers.markEndpointFailure === 'function') {
            this.chainHandlers.markEndpointFailure(network, rpcUrlToUse);
          }
          
          // Try again with exponential backoff
          this._reconnectProvider(network);
        });
      } catch (error) {
        console.error(`Error setting up new connection for ${network}:`, error);
        
        // Increment reconnection attempt counter
        status.reconnectAttempts++;
        status.isReconnecting = false;
        
        // Try again with exponential backoff
        this._reconnectProvider(network);
      }
    }, delay);
  }
  
  /**
   * Restart monitoring for a network after reconnection
   * @private
   * @param {string} network - Network identifier
   */
  private _restartMonitoringForNetwork(network: string) {
    // Restart balance monitoring
    if (this.monitoredAddresses[network] && 
        Object.keys(this.monitoredAddresses[network]).length > 0) {
      // Clear existing timer if any
      this.clearTimer(`balance_${network}`);
      
      // Restart balance monitoring
      this.timers[`balance_${network}`] = setInterval(() => {
        this._checkBalances(network);
      }, this.config.pollingInterval);
      
      // Force an immediate balance check
      this._checkBalances(network);
    }
    
    // Restart NFT monitoring
    if (this.monitoredNFTs[network] &&
        Object.keys(this.monitoredNFTs[network]).length > 0) {
      // Clear existing timer if any
      this.clearTimer(`nft_${network}`);
      
      // Force NFT transfer check
      this._checkNFTTransfers(network);
    }
  }
  
  /**
   * Start monitoring an address for balance changes
   * @param {string} network - Network identifier
   * @param {string} address - Address to monitor
   * @param {Object} options - Monitoring options (trackBalance, tokens)
   * @returns {boolean} Whether monitoring was started
   */
  public monitorAddress(network: string, address: string, options: {
    trackBalance?: boolean;
    tokens?: string[];
  } = {}): boolean {
    try {
      const networkUpper = network.toUpperCase();
      const provider = this.providers[networkUpper];
      
      if (!provider) {
        console.error(`No provider available for network ${networkUpper}`);
        return false;
      }
      
      // Initialize network entry if not exists
      if (!this.monitoredAddresses[networkUpper]) {
        this.monitoredAddresses[networkUpper] = {};
      }
      
      // Check if address is already monitored
      if (this.monitoredAddresses[networkUpper][address]) {
        console.log(`Address ${address} on ${networkUpper} is already being monitored`);
        return true;
      }
      
      // Store monitoring preferences
      this.monitoredAddresses[networkUpper][address] = {
        trackBalance: options.trackBalance !== false, // Default true
        tokens: options.tokens || [],
        lastBalances: {},
        lastChecked: Date.now(),
      };
      
      // For EVM chains (ETH, BNB, MATIC)
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        // Set up balance monitoring if not already running
        if (!this.timers[`balance_${networkUpper}`]) {
          this.timers[`balance_${networkUpper}`] = setInterval(() => {
            this._checkBalances(networkUpper);
          }, this.config.pollingInterval);
        }
        
        // Set up block monitoring for real-time events if provider supports it
        if (this.isEvmProvider(provider) && !this.timers[`blocks_${networkUpper}`]) {
          // Listen for new blocks
          provider.on('block', blockNumber => {
            this._onNewBlock(networkUpper, blockNumber);
          });
          
          // Mark block monitoring as active with a valid timer object
          this.timers[`blocks_${networkUpper}`] = {
            standard: 'BLOCKS',
            contract: new ethers.Contract('0x0000000000000000000000000000000000000000', [], provider),
            active: true
          };
        }
      }
      
      // For Solana
      else if (networkUpper === 'SOL') {
        // Implement Solana-specific monitoring
        // Would typically use websocket connection or polling
      }
      
      return true;
    } catch (error) {
      console.error(`Error starting monitoring for ${address} on ${network}:`, error);
      return false;
    }
  }
  
  /**
   * Stop monitoring an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to stop monitoring
   * @returns {boolean} Whether monitoring was stopped
   */
  public stopMonitoring(network: string, address: string): boolean {
    try {
      const networkUpper = network.toUpperCase();
      
      if (!this.monitoredAddresses[networkUpper] || 
          !this.monitoredAddresses[networkUpper][address]) {
        return false;
      }
      
      // Remove address from monitoring
      delete this.monitoredAddresses[networkUpper][address];
      
      // If no more addresses for this network, clean up timers
      if (Object.keys(this.monitoredAddresses[networkUpper]).length === 0) {
        this.clearTimer(`balance_${networkUpper}`);
        
        // Remove block listener if no addresses monitored
        // and no NFTs monitored on this network
        if (this.timers[`blocks_${networkUpper}`] && 
            (!this.monitoredNFTs[networkUpper] || 
            Object.keys(this.monitoredNFTs[networkUpper]).length === 0)) {
          
          const provider = this.providers[networkUpper];
          if (this.isEvmProvider(provider)) {
            provider.removeAllListeners('block');
          }
          
          delete this.timers[`blocks_${networkUpper}`];
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error stopping monitoring for ${address} on ${network}:`, error);
      return false;
    }
  }
  
  /**
   * Start monitoring NFT transfers for an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to monitor
   * @param {Object} options - Monitoring options
   * @returns {boolean} Whether monitoring was started
   */
  public monitorNFTTransfers(network: string, address: string, options: {
    contractAddresses?: string[];
    standards?: string[];
  } = {}): boolean {
    try {
      const networkUpper = network.toUpperCase();
      const provider = this.providers[networkUpper];
      
      if (!provider) {
        console.error(`No provider available for network ${networkUpper}`);
        return false;
      }
      
      // Initialize network entry if not exists
      if (!this.monitoredNFTs[networkUpper]) {
        this.monitoredNFTs[networkUpper] = {};
      }
      
      // Initialize or update address entry
      if (!this.monitoredNFTs[networkUpper][address]) {
        this.monitoredNFTs[networkUpper][address] = {
          contractAddresses: options.contractAddresses || [],
          standards: options.standards || ['ERC721', 'ERC1155'],
          lastChecked: Date.now()
        };
      } else {
        // Update with new options
        if (options.contractAddresses) {
          this.monitoredNFTs[networkUpper][address].contractAddresses = 
            options.contractAddresses;
        }
        if (options.standards) {
          this.monitoredNFTs[networkUpper][address].standards = 
            options.standards;
        }
      }
      
      // For EVM chains
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        // Set up block monitoring for EVM chains
        if (this.isEvmProvider(provider) && !this.timers[`blocks_${networkUpper}`]) {
          // Listen for new blocks
          provider.on('block', blockNumber => {
            this._onNewBlock(networkUpper, blockNumber);
          });
          
          // Mark block monitoring as active with a valid timer object
          this.timers[`blocks_${networkUpper}`] = {
            standard: 'BLOCKS',
            contract: new ethers.Contract('0x0000000000000000000000000000000000000000', [], provider),
            active: true
          };
        }
        
        // Set up NFT-specific checks if needed
        // Real implementation would use contract event listeners or indexer APIs
      }
      
      return true;
    } catch (error) {
      console.error(`Error monitoring NFT transfers for ${address} on ${network}:`, error);
      return false;
    }
  }
  
  /**
   * Stop monitoring NFT transfers for an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to stop monitoring
   * @returns {boolean} Whether monitoring was stopped
   */
  public stopMonitoringNFTs(network: string, address: string): boolean {
    try {
      const networkUpper = network.toUpperCase();
      
      if (!this.monitoredNFTs[networkUpper] || 
          !this.monitoredNFTs[networkUpper][address]) {
        return false;
      }
      
      // Remove address from NFT monitoring
      delete this.monitoredNFTs[networkUpper][address];
      
      // If no more NFT monitoring for this network, clean up specific listeners
      if (Object.keys(this.monitoredNFTs[networkUpper]).length === 0) {
        // Remove block listener if no addresses monitored for NFTs
        // and no addresses monitored for balances on this network
        if (this.timers[`blocks_${networkUpper}`] && 
            (!this.monitoredAddresses[networkUpper] || 
            Object.keys(this.monitoredAddresses[networkUpper]).length === 0)) {
          
          const provider = this.providers[networkUpper];
          if (this.isEvmProvider(provider)) {
            provider.removeAllListeners('block');
          }
          
          delete this.timers[`blocks_${networkUpper}`];
        }
      }
      
      return true;
    } catch (error) {
      console.error(`Error stopping NFT monitoring for ${address} on ${network}:`, error);
      return false;
    }
  }
  
  /**
   * Monitor a specific NFT collection
   * @param {string} network - Network identifier
   * @param {string} contractAddress - Collection contract address
   * @param {Object} options - Monitoring options
   * @returns {boolean} Whether monitoring was started
   */
  public monitorNFTCollection(network: string, contractAddress: string, options: {
    standard?: string;
  } = {}): boolean {
    try {
      const networkUpper = network.toUpperCase();
      const provider = this.providers[networkUpper];
      
      if (!provider) {
        console.error(`No provider available for network ${networkUpper}`);
        return false;
      }
      
      // For EVM chains, set up contract event listeners
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        const standard = options.standard || 'ERC721';
        
        // Create contract interface based on standard
        const abi = standard === 'ERC1155' ? 
          [ERC1155_TRANSFER_SINGLE_EVENT, ERC1155_TRANSFER_BATCH_EVENT] : 
          [ERC721_TRANSFER_EVENT];
        
        // Ensure we have an EVM compatible provider before creating a contract
        if (!this.isEvmProvider(provider)) {
          console.error(`Provider for ${network} is not EVM compatible`);
          return false;
        }
        
        const contract = new ethers.Contract(contractAddress, abi, provider);
        
        // Listen for Transfer events
        if (standard === 'ERC721') {
          contract.on('Transfer', (from, to, tokenId, event) => {
            this._onNFTTransfer(networkUpper, contractAddress, from, to, tokenId, event);
          });
        } else if (standard === 'ERC1155') {
          contract.on('TransferSingle', (operator, from, to, id, value, event) => {
            this._onERC1155SingleTransfer(networkUpper, contractAddress, operator, from, to, id, value, event);
          });
          
          contract.on('TransferBatch', (operator, from, to, ids, values, event) => {
            this._onERC1155BatchTransfer(networkUpper, contractAddress, operator, from, to, ids, values, event);
          });
        }
        
        // Store contract listener reference
        const listenerKey = `nft_${networkUpper}_${contractAddress}`;
        this.timers[listenerKey] = {
          standard,
          contract
        };
      }
      
      return true;
    } catch (error) {
      console.error(`Error monitoring NFT collection ${contractAddress} on ${network}:`, error);
      return false;
    }
  }
  
  /**
   * Stop all monitoring
   * Cleans up listeners and timers
   */
  public stopAllMonitoring(): boolean {
    try {
      // Clear all interval timers
      Object.keys(this.timers).forEach(key => {
        this.clearTimer(key);
      });
      
      // Remove all event listeners from providers
      Object.keys(this.providers).forEach(network => {
        const provider = this.providers[network];
        if (this.isEvmProvider(provider)) {
          provider.removeAllListeners();
        }
      });
      
      // Clear monitoring state
      this.monitoredAddresses = {};
      this.monitoredNFTs = {};
      this.timers = {};
      
      return true;
    } catch (error) {
      console.error('Error stopping all monitoring:', error);
      return false;
    }
  }
  
  /**
   * Handle new block events
   * @private
   */
  private _onNewBlock(network: string, blockNumber: number) {
    // Emit new block event
    this.emit('newBlock', {
      network,
      blockNumber,
      timestamp: Date.now()
    });
    
    // Check for balance changes if addresses are being monitored
    if (this.monitoredAddresses[network] && 
        Object.keys(this.monitoredAddresses[network]).length > 0) {
      this._checkBalances(network);
    }
    
    // Check for NFT transfers if addresses are being monitored
    if (this.monitoredNFTs[network] &&
        Object.keys(this.monitoredNFTs[network]).length > 0) {
      this._checkNFTTransfers(network, blockNumber);
    }
  }
  
  /**
   * Check balances for monitored addresses
   * @private
   */
  private async _checkBalances(network: string): Promise<void> {
    if (!this.monitoredAddresses[network]) return;
    
    const provider = this.providers[network];
    if (!provider) return;
    
    // Check each address
    for (const [address, config] of Object.entries(this.monitoredAddresses[network])) {
      try {
        if (config.trackBalance) {
          // Get current balance based on provider type
          const currentBalance = this.isEvmProvider(provider) 
            ? await provider.getBalance(address)
            : await provider.getBalance(this.toPublicKey(address));
          const formattedBalance = ethers.utils.formatEther(currentBalance);
          
          // Compare with previous balance
          const previousBalance = config.lastBalances.native || '0';
          
          if (formattedBalance !== previousBalance) {
            // Emit balance change event
            this.emit('balanceChange', {
              type: 'native',
              network,
              address,
              previousBalance,
              newBalance: formattedBalance,
              change: parseFloat(formattedBalance) - parseFloat(previousBalance)
            });
            
            // Update stored balance
            this.monitoredAddresses[network][address].lastBalances.native = formattedBalance;
          }
        }
        
        // Check token balances if tokens are being monitored
        if (config.tokens && config.tokens.length > 0) {
          // In real implementation, would check each token balance
          // For now, this is a placeholder
        }
        
        // Update last checked timestamp
        this.monitoredAddresses[network][address].lastChecked = Date.now();
      } catch (error) {
        console.error(`Error checking balances for ${address} on ${network}:`, error);
      }
    }
  }
  
  /**
   * Check for NFT transfers
   * @private
   */
  private async _checkNFTTransfers(network: string, blockNumber?: number): Promise<void> {
    // In a real implementation, this would query transfer events
    // from the blockchain or use an indexer
    // For now, this is a placeholder
  }
  
  /**
   * Handle ERC721 NFT transfer event
   * @private
   */
  private _onNFTTransfer(network: string, contractAddress: string, from: string, to: string, tokenId: ethers.BigNumber, event: ethers.Event) {
    // Check if we're monitoring these addresses
    const isFromMonitored = this.monitoredNFTs[network] && this.monitoredNFTs[network][from.toLowerCase()];
    const isToMonitored = this.monitoredNFTs[network] && this.monitoredNFTs[network][to.toLowerCase()];
    
    if (!isFromMonitored && !isToMonitored) return;
    
    // Create transfer event data
    const transferData = {
      network,
      contractAddress,
      tokenId: tokenId.toString(),
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      standard: 'ERC721',
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: Date.now()
    };
    
    // Emit event
    this.emit('nftTransfer', transferData);
    
    // If this is a transfer to a monitored address, emit ownership change
    if (isToMonitored) {
      this.emit('nftOwnershipChange', {
        ...transferData,
        type: 'receive',
      });
    }
    
    // If this is a transfer from a monitored address, emit ownership change
    if (isFromMonitored) {
      this.emit('nftOwnershipChange', {
        ...transferData,
        type: 'send',
      });
    }
  }
  
  /**
   * Handle ERC1155 single transfer event
   * @private
   */
  private _onERC1155SingleTransfer(network: string, contractAddress: string, operator: string, from: string, to: string, id: ethers.BigNumber, value: ethers.BigNumber, event: ethers.Event) {
    // Similar to ERC721 but handles ERC1155 specifics
    const transferData = {
      network,
      contractAddress,
      tokenId: id.toString(),
      from: from.toLowerCase(),
      to: to.toLowerCase(),
      value: value.toString(),
      operator: operator.toLowerCase(),
      standard: 'ERC1155',
      transactionHash: event.transactionHash,
      blockNumber: event.blockNumber,
      timestamp: Date.now()
    };
    
    this.emit('nftTransfer', transferData);
  }
  
  /**
   * Handle ERC1155 batch transfer event
   * @private
   */
  private _onERC1155BatchTransfer(network: string, contractAddress: string, operator: string, from: string, to: string, ids: ethers.BigNumber[], values: ethers.BigNumber[], event: ethers.Event) {
    // Handle batch transfers by creating separate events for each token
    for (let i = 0; i < ids.length; i++) {
      this._onERC1155SingleTransfer(
        network,
        contractAddress,
        operator,
        from,
        to,
        ids[i],
        values[i],
        event
      );
    }
  }
  
  /**
   * Get monitoring metrics
   * @returns {Object} Monitoring metrics
   */
  public getMetrics() {
    const now = Date.now();
    
    // Calculate monitored address counts
    const addressCounts = {};
    Object.entries(this.monitoredAddresses).forEach(([network, addresses]) => {
      addressCounts[network] = Object.keys(addresses).length;
    });
    
    // Calculate NFT monitoring counts
    const nftCounts = {};
    Object.entries(this.monitoredNFTs).forEach(([network, addresses]) => {
      nftCounts[network] = Object.keys(addresses).length;
    });
    
    // Calculate average latencies
    const avgLatencies = {};
    Object.entries(this.metrics.latency).forEach(([network, operations]) => {
      avgLatencies[network] = {};
      Object.entries(operations).forEach(([operation, values]) => {
        if (values.length > 0) {
          avgLatencies[network][operation] = values.reduce((sum, val) => sum + val, 0) / values.length;
        }
      });
    });
    
    return {
      uptime: process.uptime(),
      timestamp: now,
      monitoring: {
        addresses: addressCounts,
        nfts: nftCounts,
        timers: Object.keys(this.timers).length,
      },
      reconnections: this.metrics.reconnections,
      events: this.metrics.events,
      errors: this.metrics.errors,
      latency: avgLatencies,
      connectionStatus: Object.fromEntries(
        Object.entries(this.connectionStatus).map(([network, status]) => [
          network, 
          { 
            connected: status.connected,
            reconnectAttempts: status.reconnectAttempts,
            lastPingAgo: now - status.lastPingTime
          }
        ])
      )
    };
  }
  
  /**
   * Reset metrics
   */
  public resetMetrics() {
    Object.keys(this.metrics.reconnections).forEach(network => {
      this.metrics.reconnections[network] = 0;
    });
    
    Object.keys(this.metrics.events).forEach(network => {
      this.metrics.events[network] = {};
    });
    
    Object.keys(this.metrics.errors).forEach(network => {
      this.metrics.errors[network] = {};
    });
    
    Object.keys(this.metrics.latency).forEach(network => {
      Object.keys(this.metrics.latency[network]).forEach(operation => {
        this.metrics.latency[network][operation] = [];
      });
    });
  }

  /**
   * Get the appropriate blockchain explorer API URL
   * @private
   * @param {string} network - Network identifier
   * @returns {string} Explorer API URL
   */
  private _getExplorerApiUrl(network: string): string | null {
    const explorerUrls = {
      'ETH': 'https://api.etherscan.io/api',
      'BNB': 'https://api.bscscan.com/api',
      'MATIC': 'https://api.polygonscan.com/api',
      'AVAX': 'https://api.snowtrace.io/api',
      'FTM': 'https://api.ftmscan.com/api',
      'ARBITRUM': 'https://api.arbiscan.io/api',
      'OPTIMISM': 'https://api.optimistic.etherscan.io/api'
    };

    return explorerUrls[network.toUpperCase()] || null;
  }

  /**
   * Get the appropriate blockchain explorer API key
   * @private
   * @param {string} network - Network identifier
   * @returns {string} Explorer API key
   */
  private _getExplorerApiKey(network: string): string | null {
    const networkToEnvKey = {
      'ETH': 'ETHERSCAN_API_KEY',
      'BNB': 'BSCSCAN_API_KEY',
      'MATIC': 'POLYGONSCAN_API_KEY',
      'AVAX': 'SNOWTRACE_API_KEY',
      'FTM': 'FTMSCAN_API_KEY',
      'ARBITRUM': 'ARBISCAN_API_KEY',
      'OPTIMISM': 'OPTIMISTIC_API_KEY'
    };

    const envKey = networkToEnvKey[network.toUpperCase()];
    return envKey ? process.env[envKey] : null;
  }

  /**
   * Get Covalent chain ID for a given network
   * @private
   * @param {string} network - Network identifier
   * @returns {string} Covalent chain ID
   */
  private _getCovalentChainId(network: string): string | null {
    const chainIds = {
      'ETH': '1',
      'BNB': '56',
      'MATIC': '137',
      'AVAX': '43114',
      'FTM': '250',
      'ARBITRUM': '42161',
      'OPTIMISM': '10',
      'GOERLI': '5',
      'BSC_TESTNET': '97',
      'MUMBAI': '80001'
    };

    return chainIds[network.toUpperCase()] || null;
  }

  /**
   * Fetch paginated data from any API endpoint
   * @private
   * @param {Function} fetchFn - Function that fetches a page of data
   * @param {Object} options - Pagination options
   * @returns {Promise<Array>} Concatenated results
   */
  public async _fetchPaginatedData<T>(
    fetchFn: (page: number, pageSize: number) => Promise<PaginatedResponse<T>>,
    options: {
      startPage?: number;
      pageSize?: number;
      maxPages?: number;
      maxItems?: number;
      delayBetweenRequests?: number;
    } = {}
  ): Promise<T[]> {
    const {
      startPage = 1,
      pageSize = 100,
      maxPages = 10,
      maxItems = 1000,
      delayBetweenRequests = 200
    } = options;

    let currentPage = startPage;
    let allResults: T[] = [];
    let hasMore = true;

    while (hasMore && currentPage <= maxPages && allResults.length < maxItems) {
      try {
        const pageResults = await fetchFn(currentPage, pageSize);
        
        // Handle different API response formats
        const results = Array.isArray(pageResults) ? pageResults : 
                       pageResults.results || 
                       (pageResults.data && pageResults.data.items) || 
                       pageResults.items || 
                       [];

        if (!results.length) {
          hasMore = false;
          break;
        }

        allResults = allResults.concat(results);

        // Check if we've reached the last page based on API response
        hasMore = results.length === pageSize;

        // Implement rate limiting
        if (hasMore) {
          await new Promise(resolve => setTimeout(resolve, delayBetweenRequests));
        }

        currentPage++;
      } catch (error) {
        console.error('Error fetching paginated data:', error);
        throw error;
      }
    }

    return allResults.slice(0, maxItems);
  }

  /**
   * Fetch NFT transfers with pagination support
   * @private
   * @param {string} network - Network identifier
   * @param {string} address - Address to check
   * @param {Object} options - Fetch options
   * @returns {Promise<Array>} NFT transfers
   */
  private async _fetchNFTTransfers(network: string, address: string, options: {
    fromBlock?: number | string;
    toBlock?: number | string;
  } = {}): Promise<any[]> {
    const covalentChainId = this._getCovalentChainId(network);
    const explorerApiUrl = this._getExplorerApiUrl(network);
    const explorerApiKey = this._getExplorerApiKey(network);

    // Try Covalent API first if chain is supported
    if (covalentChainId && process.env.COVALENT_API_KEY) {
      return this._fetchPaginatedData(
        async (page, pageSize) => {
          const response = await fetch(
            `https://api.covalenthq.com/v1/${covalentChainId}/address/${address}/transfers_nft/` +
            `?key=${process.env.COVALENT_API_KEY}&page-number=${page}&page-size=${pageSize}`
          );
          const data = await response.json();
          return data.data?.items || [];
        },
        { ...options, delayBetweenRequests: 500 }
      );
    }

    // Fallback to explorer API if available
    if (explorerApiUrl && explorerApiKey) {
      return this._fetchPaginatedData(
        async (page, pageSize) => {
          const response = await fetch(
            `${explorerApiUrl}` +
            `?module=account&action=tokennfttx` +
            `&address=${address}` +
            `&page=${page}` +
            `&offset=${pageSize}` +
            `&sort=desc` +
            `&apikey=${explorerApiKey}`
          );
          const data = await response.json();
          return data.result || [];
        },
        { ...options, delayBetweenRequests: 200 }
      );
    }

    // If no API is available, fallback to RPC calls (less efficient)
    return this._fetchNFTTransfersViaRPC(network, address, options);
  }

  /**
   * Fetch NFT transfers using RPC calls (fallback method)
   * @private
   * @param {string} network - Network identifier
   * @param {string} address - Address to check
   * @param {Object} options - Fetch options
   * @returns {Promise<Array>} NFT transfers
   */
  public async _fetchNFTTransfersViaRPC(
    network: string, 
    address: string,
    options: {
      fromBlock?: number | string;
      toBlock?: number | string;
    } = {}
  ): Promise<any[]> {
    const provider = this.providers[network];
    if (!provider) return [];

    const { fromBlock = -1000, toBlock = 'latest' } = options;

    try {
      // Get latest block if fromBlock is relative
      let startBlock: number;
      if (typeof fromBlock === 'number' && fromBlock < 0) {
        const latestBlock = provider instanceof Connection 
          ? await provider.getSlot()
          : await (provider as ethers.providers.Provider).getBlockNumber();
        startBlock = Math.max(0, latestBlock + fromBlock);
      } else {
        startBlock = typeof fromBlock === 'number' ? fromBlock : 0;
      }

      // Create filter for ERC721 transfers
      const erc721Filter = {
        topics: [
          ethers.utils.id(ERC721_TRANSFER_EVENT),
          null,
          [
            ethers.utils.hexZeroPad(address.toLowerCase(), 32),
            null
          ]
        ],
        fromBlock: startBlock,
        toBlock
      };

      // Create filter for ERC1155 transfers
      const erc1155SingleFilter = {
        topics: [
          ethers.utils.id(ERC1155_TRANSFER_SINGLE_EVENT),
          null,
          [
            ethers.utils.hexZeroPad(address.toLowerCase(), 32),
            null
          ]
        ],
        fromBlock: startBlock,
        toBlock
      };

      // Get logs for both standards
      if (!this.isEvmProvider(provider)) {
        return []; // Skip for non-EVM providers like Solana
      }

      const [erc721Logs, erc1155Logs] = await Promise.all([
        provider.getLogs(erc721Filter),
        provider.getLogs(erc1155SingleFilter)
      ]);

      // Process ERC721 transfers
      const erc721Transfers = erc721Logs.map(log => ({
        network,
        contractAddress: log.address,
        from: ethers.utils.defaultAbiCoder.decode(['address'], log.topics[1])[0],
        to: ethers.utils.defaultAbiCoder.decode(['address'], log.topics[2])[0],
        tokenId: ethers.utils.defaultAbiCoder.decode(['uint256'], log.topics[3])[0].toString(),
        standard: 'ERC721',
        transactionHash: log.transactionHash,
        blockNumber: log.blockNumber,
        timestamp: Date.now()
      }));

      // Process ERC1155 transfers
      const erc1155Transfers = erc1155Logs.map(log => {
        const decoded = ethers.utils.defaultAbiCoder.decode(
          ['address', 'address', 'uint256', 'uint256'],
          log.data
        );
        return {
          network,
          contractAddress: log.address,
          operator: ethers.utils.defaultAbiCoder.decode(['address'], log.topics[1])[0],
          from: decoded[0],
          to: decoded[1],
          tokenId: decoded[2].toString(),
          value: decoded[3].toString(),
          standard: 'ERC1155',
          transactionHash: log.transactionHash,
          blockNumber: log.blockNumber,
          timestamp: Date.now()
        };
      });

      return [...erc721Transfers, ...erc1155Transfers].sort((a, b) => b.blockNumber - a.blockNumber);
    } catch (error) {
      console.error(`Error fetching NFT transfers via RPC for ${address} on ${network}:`, error);
      return [];
    }
  }

  // Add helper methods to access ChainHandlers private properties
  private getChainConfig(network: string): string {
    return this.chainHandlers.getRpcUrl?.(network) || '';
  }

  private getChainEndpoints(network: string): string[] {
    return this.chainHandlers.getEndpoints?.(network) || [];
  }

  // Update WebSocket provider checks
  private isWebSocketProvider(provider: SupportedProvider): provider is WebSocketProvider {
    return provider && 
           'removeAllListeners' in provider && 
           '_websocket' in provider &&
           typeof (provider as any)._websocket?.close === 'function';
  }

  // Add helper method to wrap Solana Connection
  private wrapSolanaProvider(connection: Connection): SupportedProvider {
    // Return the connection directly as it's already included in SupportedProvider type
    return connection as unknown as SupportedProvider;
  }

  // Update clearInterval calls to handle different timer types
  private clearTimer(key: string): void {
    const timer = this.timers[key];
    if (!timer) return;

    try {
      if (typeof timer === 'object' && 'timer' in timer && timer.timer) {
        // Handle contract listener timer
        clearInterval(timer.timer as ReturnType<typeof setInterval>);
        if ('contract' in timer && timer.contract) {
          // Remove contract listeners
          timer.contract.removeAllListeners();
        }
      } else if (typeof timer === 'object' && 'hasRef' in timer) {
        // Handle NodeJS.Timeout objects
        clearInterval(timer as ReturnType<typeof setInterval>);
      } else if (typeof timer === 'number') {
        // Handle number-based timer IDs
        clearInterval(timer);
      }
    } catch (error) {
      console.error(`Error clearing timer ${key}:`, error);
    } finally {
      delete this.timers[key];
    }
  }

  /**
   * Clean up resources
   */
  async destroy() {
    try {
      // Clear all interval timers, including healthCheck explicitly
      if (this.timers && this.timers.healthCheck) {
        if (typeof this.timers.healthCheck === 'number' || 
            (typeof this.timers.healthCheck === 'object' && 'hasRef' in this.timers.healthCheck)) {
          clearInterval(this.timers.healthCheck as ReturnType<typeof setInterval>);
        }
        this.timers.healthCheck = null;
      }
      
      // Clear all other timers
      if (this.timers) {
        Object.keys(this.timers).forEach(key => {
          this.clearTimer(key);
        });
        this.timers = {};
      }

      // Clear heartbeat timers
      if (this.heartbeatTimers) {
        Object.keys(this.heartbeatTimers).forEach(key => {
          if (this.heartbeatTimers[key]) {
            clearInterval(this.heartbeatTimers[key]);
            delete this.heartbeatTimers[key];
          }
        });
      }

      // Remove all event listeners from providers
      if (this.providers) {
        Object.values(this.providers).forEach(provider => {
          if (this.isEvmProvider(provider)) {
            provider.removeAllListeners();
          }
          // Close WebSocket connections
          if (this.isWebSocketProvider(provider)) {
            try {
              provider._websocket.close();
            } catch (err) {
              // Ignore close errors
            }
          }
        });
      }

      // Clear all listeners from EventEmitter
      this.removeAllListeners();

      // Reset all state
      this.monitoredAddresses = {};
      this.monitoredNFTs = {};
      this.timers = {};
      Object.keys(this.connectionStatus).forEach(key => {
        delete this.connectionStatus[key];
      });

      return Promise.resolve();
    } catch (error) {
      return Promise.reject(error);
    }
  }

  // Add stop method as alias to destroy to make the API more intuitive
  stop(): Promise<void> {
    return this.destroy();
  }

  // Add type guards to distinguish EVM providers from Solana connections.
  private isEvmProvider(provider: SupportedProvider): provider is ethers.providers.Provider & {
    on: (...args: any[]) => any;
    removeAllListeners: (...args: any[]) => any;
  } {
    return (
      provider &&
      typeof (provider as any).getNetwork === 'function' &&
      typeof (provider as any).on === 'function' &&
      typeof (provider as any).removeAllListeners === 'function'
    );
  }

  // For Solana, ensure we handle addresses as PublicKey if needed
  private toPublicKey(address: string): PublicKey {
    return new PublicKey(address);
  }

  // Use a more resilient WebSocket connection with reconnection logic
  private setupEthWebSocketProvider() {
    try {
      const wsUrl = this.config.ETH_WS_URL || this.fallbackToHttpProvider('ETH');
      
      // If we don't have a WebSocket URL, use HTTP provider instead
      if (!wsUrl.startsWith('ws')) {
        this.providers['ETH'] = new ethers.providers.JsonRpcProvider(wsUrl);
        return;
      }
      
      // Create WebSocket provider with reconnection handling
      const wsProvider = new ethers.providers.WebSocketProvider(wsUrl);
      
      // Handle WebSocket specific events
      const wsConnection = wsProvider._websocket;
      
      if (wsConnection) {
        // Handle connection errors
        wsConnection.onerror = (error: any) => {
          console.error('WebSocket Error:', error);
          // Fallback to HTTP provider on WebSocket error
          this.providers['ETH'] = new ethers.providers.JsonRpcProvider(
            this.config.ETH_RPC_URL || this.fallbackToHttpProvider('ETH')
          );
        };
        
        // Handle disconnections
        wsConnection.onclose = () => {
          console.log('WebSocket connection closed, using HTTP provider');
          // Fallback to HTTP provider on WebSocket close
          this.providers['ETH'] = new ethers.providers.JsonRpcProvider(
            this.config.ETH_RPC_URL || this.fallbackToHttpProvider('ETH')
          );
        };
      }
      
      this.providers['ETH'] = wsProvider;
    } catch (error) {
      console.error('Error setting up ETH WebSocket provider:', error);
      // Fallback to HTTP provider
      this.providers['ETH'] = new ethers.providers.JsonRpcProvider(
        this.config.ETH_RPC_URL || this.fallbackToHttpProvider('ETH')
      );
    }
  }

  // Provide a fallback HTTP URL if WebSocket fails
  private fallbackToHttpProvider(chain: string): string {
    const defaultUrls: Record<string, string> = {
      'ETH': 'https://mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4',
      'MATIC': 'https://polygon-mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4',
      'BNB': 'https://bsc-dataseed.binance.org',
      'SOL': 'https://api.mainnet-beta.solana.com'
    };
    
    return defaultUrls[chain] || defaultUrls['ETH'];
  }
}

export default MonitoringService;

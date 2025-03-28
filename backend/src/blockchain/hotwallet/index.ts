import WalletManager, { IWallet } from './WalletManager';
import { ChainHandlers, ChainConfig } from './handlers/ChainHandlers';
import BalanceService from './services/BalanceService';
import GasService from './services/GasService';
import { NFTService, NFTMetadata } from './services/NFTService';
import TransactionHistoryService from './services/TransactionHistoryService';
import MonitoringService from './services/MonitoringService';
import { HotWalletError, TransactionError, InsufficientBalanceError, SimulationError } from './utils/errors';
import { ethers } from 'ethers';
import EventEmitter from 'events';
import { jwtAuthMiddleware, checkRoles } from './middleware/auth.middleware';
import { getBlockchainConfig, DEFAULT_RPC_URLS } from '../config/blockchain-environment';

// Update HotWalletConfig to extend ChainConfig
interface HotWalletConfig extends ChainConfig {
  encryptPrivateKeys?: boolean;
  [key: string]: any;
}

// Update interfaces
interface WalletManagerConfig {
  encryptPrivateKeys: boolean;
  SOL_RPC_URL: string;
  [key: string]: any;
}

interface TransactionObject {
  from: string;
  to: string;
  value?: ethers.BigNumber;
  data?: string;
  gasLimit?: ethers.BigNumber;
  gasPrice?: ethers.BigNumber;
  maxFeePerGas?: ethers.BigNumber;
  maxPriorityFeePerGas?: ethers.BigNumber;
  gasCost?: ethers.BigNumber;
  gasCostEther?: string;
  priorityLevel?: string;
  network?: string;
  amount?: string; // Add amount for backward compatibility
}

interface GasParams {
  gasLimit: ethers.BigNumber;
  maxFeePerGas?: ethers.BigNumber;
  maxPriorityFeePerGas?: ethers.BigNumber;
  gasPrice?: ethers.BigNumber;
}

// Fix the Provider interface - use a completely new interface instead of extending ethers.providers.Provider
interface Provider {
  getNetwork(): Promise<ethers.providers.Network>;
  getBlockNumber(): Promise<number>;
  getGasPrice(): Promise<ethers.BigNumber>;
  getFeeData?(): Promise<ethers.providers.FeeData>;
  estimateGas(transaction: ethers.providers.TransactionRequest): Promise<ethers.BigNumber>;
  call(transaction: ethers.providers.TransactionRequest, blockTag?: ethers.providers.BlockTag): Promise<string>;
  getBalance(addressOrName: string | Promise<string>, blockTag?: ethers.providers.BlockTag): Promise<ethers.BigNumber>;
  getTransactionCount(addressOrName: string | Promise<string>, blockTag?: ethers.providers.BlockTag): Promise<number>;
  getCode(addressOrName: string | Promise<string>, blockTag?: ethers.providers.BlockTag): Promise<string>;
  getStorageAt(addressOrName: string | Promise<string>, position: ethers.BigNumberish, blockTag?: ethers.providers.BlockTag): Promise<string>;
  // Add other common provider methods as needed
  on(eventName: string, listener: any): Provider;
  once(eventName: string, listener: any): Provider;
  emit(eventName: string, ...args: any[]): boolean;
  listenerCount(eventName: string): number;
  listeners(eventName: string): any[];
  off(eventName: string, listener: any): Provider;
  removeAllListeners(eventName?: string): Provider;
  // Custom extensions
  destroy?(): Promise<void> | void;
  _websocket?: { readyState: number, close: () => void, ping?: () => void };
}

interface NFTTransferParams {
  network: string;
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
  privateKey?: string;
  standard?: 'ERC721' | 'ERC1155';
  options?: Record<string, any>;
}

interface EVMTransaction {
  to: string;
  value?: ethers.BigNumber;
  gasLimit?: ethers.BigNumber;
  data?: string;
  maxFeePerGas?: ethers.BigNumber;
  maxPriorityFeePerGas?: ethers.BigNumber;
  gasPrice?: ethers.BigNumber;
}

interface HotWalletEvents {
  balanceChange: {
    network: string;
    address: string;
    oldBalance: string;
    newBalance: string;
  };
  tokenBalanceChange: {
    network: string;
    token: string;
    address: string;
    oldBalance: string;
    newBalance: string;
  };
  nftOwnershipChange: {
    network: string;
    contractAddress: string;
    tokenId: string;
    oldOwner: string;
    newOwner: string;
  };
  newBlock: {
    network: string;
    blockNumber: number;
    timestamp: number;
  };
}

// Define DEFAULT_CONFIG which was referenced but not defined
const DEFAULT_CONFIG = {
  encryptionKey: process.env.ENCRYPTION_KEY || 'default-encryption-key',
  encryptPrivateKeys: true,
  ETH_RPC_URL: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  BNB_RPC_URL: process.env.BNB_RPC_URL || 'https://bsc-dataseed.binance.org',
  SOL_RPC_URL: process.env.SOL_RPC_URL || 'https://api.mainnet-beta.solana.com',
  MATIC_RPC_URL: process.env.MATIC_RPC_URL || 'https://polygon-rpc.com',
};

/**
 * Hot Wallet main class
 * Manages crypto wallets, balances and transactions
 */
class HotWallet {
  private config: HotWalletConfig; // Change type from ChainConfig to HotWalletConfig
  private _eventEmitter: EventEmitter;
  private chainHandlers: ChainHandlers;
  private walletManager: WalletManager;
  private balanceService: BalanceService;
  private gasService: GasService;
  private nftService: NFTService;
  private historyService: TransactionHistoryService;
  private monitoringService: MonitoringService;
  provider: any;

  /**
   * Create a new HotWallet instance
   * @param {Object} config - Configuration options
   */
  constructor(config: HotWalletConfig) {
    // Get global blockchain config
    const globalConfig = getBlockchainConfig();
    
    // Ensure we have a valid config object with explicit type
    const safeConfig: Partial<HotWalletConfig> = config || {};
    
    // Set default values
    this.config = {
      ...DEFAULT_CONFIG,
      ...globalConfig, // Use global blockchain config as base
      ...safeConfig,   // Override with any specific config
    };

    // Create a new rpcConfig object with guaranteed valid values
    const rpcConfig: ChainConfig = {
      ETH_RPC_URL: safeConfig.ETH_RPC_URL ?? safeConfig.ETH ?? globalConfig.ETH_RPC_URL ?? DEFAULT_RPC_URLS.ETH_RPC_URL,
      BNB_RPC_URL: safeConfig.BNB_RPC_URL ?? safeConfig.BNB ?? globalConfig.BNB_RPC_URL ?? DEFAULT_RPC_URLS.BNB_RPC_URL,
      SOL_RPC_URL: safeConfig.SOL_RPC_URL ?? safeConfig.SOL ?? globalConfig.SOL_RPC_URL ?? DEFAULT_RPC_URLS.SOL_RPC_URL,
      MATIC_RPC_URL: safeConfig.MATIC_RPC_URL ?? safeConfig.MATIC ?? globalConfig.MATIC_RPC_URL ?? DEFAULT_RPC_URLS.MATIC_RPC_URL,
      ETH: safeConfig.ETH_RPC_URL ?? safeConfig.ETH ?? globalConfig.ETH_RPC_URL ?? DEFAULT_RPC_URLS.ETH_RPC_URL,
      BNB: safeConfig.BNB_RPC_URL ?? safeConfig.BNB ?? globalConfig.BNB_RPC_URL ?? DEFAULT_RPC_URLS.BNB_RPC_URL, 
      SOL: safeConfig.SOL_RPC_URL ?? safeConfig.SOL ?? globalConfig.SOL_RPC_URL ?? DEFAULT_RPC_URLS.SOL_RPC_URL,
      MATIC: safeConfig.MATIC_RPC_URL ?? safeConfig.MATIC ?? globalConfig.MATIC_RPC_URL ?? DEFAULT_RPC_URLS.MATIC_RPC_URL
    };

    // Console.log for debugging the configuration
    console.log('Initializing HotWallet with config:', {
      ETH: rpcConfig.ETH_RPC_URL,
      BNB: rpcConfig.BNB_RPC_URL,
      SOL: rpcConfig.SOL_RPC_URL
    });

    // Initialize chain handlers with proper URL configuration
    // CRITICAL: Ensure SOL_RPC_URL is provided to ChainHandlers
    this.chainHandlers = new ChainHandlers(rpcConfig);
    this.walletManager = new WalletManager(this.config.encryptionKey);

    // Convert config to WalletManagerConfig
    const walletConfig: WalletManagerConfig = {
      ...this.config,
      encryptPrivateKeys: Boolean(this.config.encryptPrivateKeys),
      // Explicitly ensure SOL_RPC_URL is set
      SOL_RPC_URL: rpcConfig.SOL_RPC_URL
    };

    // Initialize event emitter
    this._eventEmitter = new EventEmitter();

    // Initialize services with proper error handling for each service
    try {
      this.walletManager = new WalletManager(this.chainHandlers, walletConfig);
    } catch (error) {
      console.error('Failed to initialize WalletManager:', error);
    }

    try {
      this.balanceService = new BalanceService(this.chainHandlers);
    } catch (error) {
      console.error('Failed to initialize BalanceService:', error);
      // Create minimal implementation
      const minimalImpl = {
        getBalance: async () => '0.0',
        getTokenBalance: async () => '0.0',
        getTokenDecimals: async () => 18,
        getTokenSymbol: async () => 'TOKEN',
        chainHandlers: this.chainHandlers,
        config: {},
        balanceCache: new Map(),
        rateLimiter: { limit: () => Promise.resolve() },
        getCachedBalance: async () => '0.0',
        updateBalanceCache: () => {},
        getTokenContract: () => null,
        getERC20Contract: () => null,
        formatTokenBalance: () => '0.0'
      };
      this.balanceService = minimalImpl as unknown as BalanceService;
    }

    try {
      this.gasService = new GasService(this.chainHandlers);
    } catch (error) {
      console.error('Failed to initialize GasService:', error);
      // Create minimal implementation
      this.gasService = {} as GasService;
    }

    try {
      this.nftService = new NFTService(this.chainHandlers);
    } catch (error) {
      console.error('Failed to initialize NFTService:', error);
      // Create minimal implementation
      this.nftService = {} as NFTService;
    }

    try {
      this.historyService = new TransactionHistoryService(this.chainHandlers);
    } catch (error) {
      console.error('Failed to initialize TransactionHistoryService:', error);
      // Create minimal implementation
      this.historyService = {} as TransactionHistoryService;
    }

    try {
      this.monitoringService = new MonitoringService(this.chainHandlers);
      // Set up monitoring event handlers
      this._setupMonitoringEvents();
    } catch (error) {
      console.error('Failed to initialize MonitoringService:', error);
      // Create minimal implementation with EventEmitter capabilities
      this.monitoringService = new EventEmitter() as MonitoringService;
      this.monitoringService.on = this._eventEmitter.on.bind(this._eventEmitter);
      this.monitoringService.off = this._eventEmitter.off.bind(this._eventEmitter);
      this.monitoringService.monitorAddress = () => true;
      this.monitoringService.stopMonitoring = () => true;
      this.monitoringService.monitorNFTTransfers = () => true;
      this.monitoringService.stopMonitoringNFTs = () => true;
    }

    // Initialize provider for backward compatibility - avoid WebSocket in tests
    try {
      const isTest = process.env.NODE_ENV === 'test';
      this.provider = isTest ?
        new ethers.providers.JsonRpcProvider(config.rpcUrl || config.ETH_RPC_URL) :
        new ethers.providers.WebSocketProvider(config.rpcUrl || config.ETH_RPC_URL);
    } catch (error) {
      console.error('Failed to initialize provider:', error);
      // Attempt to create a JsonRpcProvider as fallback
      try {
        this.provider = new ethers.providers.JsonRpcProvider(config.rpcUrl || config.ETH_RPC_URL);
      } catch (secondError) {
        console.error('Failed to initialize JSON-RPC provider:', secondError);
      }
    }
  }

  /**
   * Set up monitoring event handlers
   * @private
   */
  _setupMonitoringEvents() {
    // Balance changes
    this.monitoringService.on('balanceChange', (data) => {
      this.emit('balanceChange', data);
    });

    // Token balance changes
    this.monitoringService.on('tokenBalanceChange', (data) => {
      this.emit('tokenBalanceChange', data);
    });

    // NFT ownership changes
    this.monitoringService.on('nftOwnershipChange', (data) => {
      this.emit('nftOwnershipChange', data);
    });

    // New blocks
    this.monitoringService.on('newBlock', (data) => {
      this.emit('newBlock', data);
    });
  }

  /**
   * Generate a new wallet
   * @param {string} network - Network identifier (ETH, BTC, SOL, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Generated wallet information
   */
  async generateWallet(network: string, options: any = {}): Promise<IWallet> {
    return this.walletManager.generateWallet(network, options);
  }

  /**
   * Import a wallet from a mnemonic phrase
   * @param {string} mnemonic - Mnemonic phrase (seed words)
   * @param {string} network - Network identifier (ETH, BTC, SOL, etc.)
   * @param {Object} options - Additional options
   * @returns {Promise<Object>} Imported wallet information
   */
  async importWallet(mnemonic: string, network: string, options: any = {}): Promise<IWallet> {
    // Validate inputs
    if (!mnemonic || typeof mnemonic !== 'string') {
      throw new Error('Invalid mnemonic: must be a non-empty string');
    }
    
    if (!network || typeof network !== 'string') {
      throw new Error('Invalid network: must be a non-empty string');
    }
    
    return this.walletManager.importFromMnemonic(mnemonic, network, options);
  }

  /**
   * Import a wallet using a specific derivation path
   * @param {string} mnemonic - Mnemonic phrase
   * @param {string} network - Network identifier
   * @param {string} path - Custom derivation path
   * @returns {Promise<Object>} Wallet information
   */
  async importWalletWithPath(mnemonic: string, network: string, path: string): Promise<IWallet> {
    return this.walletManager.importFromMnemonicWithPath(mnemonic, network, path);
  }

  /**
   * Get native currency balance
   * @param {string} address - Wallet address
   * @param {string} network - Network identifier
   * @returns {Promise<string>} Balance in native units
   */
  async getBalance(address: string, network: string): Promise<string> {
    // Validate inputs
    if (!address || typeof address !== 'string') {
      throw new Error('Invalid address: must be a non-empty string');
    }
    
    if (!network || typeof network !== 'string') {
      throw new Error('Invalid network: must be a non-empty string');
    }
    
    // Validate address format for EVM chains
    if (['ETH', 'BNB', 'MATIC'].includes(network.toUpperCase())) {
      if (!address.match(/^0x[a-fA-F0-9]{40}$/)) {
        return '0.0'; // Return zero for invalid address instead of throwing
      }
    }
    
    return this.balanceService.getBalance(address, network);
  }

  /**
   * Get token balance
   * @param {string} address - Wallet address
   * @param {string} token - Token identifier (e.g., ETH_USDT, MATIC_USDC)
   * @returns {Promise<string>} Token balance
   */
  async getTokenBalance(address: string, token: string): Promise<string> {
    return this.balanceService.getTokenBalance(address, token);
  }

  /**
   * Get NFT metadata
   * @param {string} network - Network identifier
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - NFT token ID
   * @param {string} standard - NFT standard (ERC721 or ERC1155)
   * @returns {Promise<Object>} NFT metadata
   */
  async getNFTMetadata(
    network: string, 
    contractAddress: string, 
    tokenId: string, 
    standard: string = 'ERC721'
  ): Promise<NFTMetadata> {
    return this.nftService.getNFTMetadata(network, contractAddress, tokenId, standard);
  }

  /**
   * Check if an address owns a specific NFT
   * @param {string} network - Network identifier
   * @param {string} contractAddress - NFT contract address
   * @param {string} tokenId - NFT token ID
   * @param {string} ownerAddress - Address to check
   * @returns {Promise<boolean>} Whether the address owns the NFT
   */
  async ownsNFT(network: string, contractAddress: string, tokenId: string, ownerAddress: string): Promise<boolean> {
    return this.nftService.ownsNFT(network, contractAddress, tokenId, ownerAddress);
  }

  /**
   * Transfer an NFT
   * @param {Object} params - Transfer parameters
   * @returns {Promise<Object>} Transaction result
   */
  async transferNFT(params: NFTTransferParams): Promise<any> {
    const { 
      network, 
      contractAddress, 
      tokenId, 
      from, 
      to, 
      privateKey, 
      standard = 'ERC721', 
      options = {} 
    } = params;

    // Get private key if not provided
    const actualPrivateKey = privateKey || this._getPrivateKey(from, network);
    if (!actualPrivateKey) {
      throw new TransactionError(`Private key not found for address ${from}`, network);
    }

    if (!actualPrivateKey) {
      throw new TransactionError(`Private key not found for address ${from}`, network);
    }

    return this.nftService.transferNFT({
      ...params,
      fromAddress: params.from,
      toAddress: params.to,
      privateKey: actualPrivateKey
    });
  }

  /**
   * Transfer an ERC1155 token
   * @param {Object} params - Transfer parameters
   * @returns {Promise<Object>} Transaction result
   */
  async transferERC1155(params: any): Promise<any> {
    try {
      return await this.nftService.transferERC1155(params);
    } catch (error) {
      console.error(`Error transferring ERC1155 token:`, error);
      throw error;
    }
  }

  /**
   * Batch transfer multiple NFTs
   * @param {Object} params - Transfer parameters
   * @returns {Promise<Object>} Transaction result
   */
  async batchTransferNFTs(params: any): Promise<any> {
    try {
      return await this.nftService.batchTransferNFTs(params);
    } catch (error) {
      console.error(`Error batch transferring NFTs:`, error);
      throw error;
    }
  }

  /**
   * Get all NFTs owned by a wallet
   * @param {string} network - Network identifier
   * @param {string} address - Wallet address
   * @param {Object} options - Query options
   * @returns {Promise<Array>} NFTs owned by the wallet
   */
  async getWalletNFTs(network: string, address: string, options: any = {}): Promise<any[]> {
    try {
      return await this.nftService.getWalletNFTs(network, address, options);
    } catch (error) {
      console.error(`Error getting wallet NFTs:`, error);
      throw error;
    }
  }

  /**
   * Get NFT collections
   * @param {string} network - Network identifier
   * @param {Object} options - Query options
   * @returns {Promise<Array>} NFT collections
   */
  async getNFTCollections(network: string, options: any = {}): Promise<any[]> {
    try {
      return await this.nftService.getCollections(network, options);
    } catch (error) {
      console.error(`Error getting NFT collections:`, error);
      throw error;
    }
  }

  /**
   * Get transaction history for an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to get history for
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(network: string, address: string, options: any = {}): Promise<any[]> {
    return this.historyService.getTransactionHistory(network, address, options);
  }

  /**
   * Get pending transactions for an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to check
   * @returns {Promise<Array>} Pending transactions
   */
  async getPendingTransactions(network: string, address: string): Promise<any[]> {
    return this.historyService.getPendingTransactions(network, address);
  }

  /**
   * Start monitoring an address for balance changes
   * @param {string} network - Network identifier
   * @param {string} address - Address to monitor
   * @param {Object} options - Monitoring options
   * @returns {boolean} Whether monitoring was started
   */
  monitorAddress(network: string, address: string, options: any = {}): boolean {
    return this.monitoringService.monitorAddress(network, address, options);
  }

  /**
   * Stop monitoring an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to stop monitoring
   * @returns {boolean} Whether monitoring was stopped
   */
  stopMonitoring(network: string, address: string): boolean {
    return this.monitoringService.stopMonitoring(network, address);
  }

  /**
   * Start monitoring NFT transfers for an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to monitor
   * @param {Object} options - Monitoring options
   * @returns {boolean} Whether monitoring was started
   */
  monitorNFTTransfers(network: string, address: string, options: any = {}): boolean {
    return this.monitoringService.monitorNFTTransfers(network, address, options);
  }

  /**
   * Stop monitoring NFT transfers for an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to stop monitoring
   * @returns {boolean} Whether monitoring was stopped
   */
  stopMonitoringNFTs(network: string, address: string): boolean {
    return this.monitoringService.stopMonitoringNFTs(network, address);
  }

  /**
   * Prepare a transaction with optimized gas settings
   * @param {Object} txParams - Transaction parameters
   * @returns {Promise<Object>} Prepared transaction data
   */
  async prepareTx(txParams: any): Promise<TransactionObject> {
    try {
      const { 
        network, 
        from, 
        to, 
        amount, 
        data = '0x', 
        priorityLevel = 'medium' 
      } = txParams;

      if (!network || !from || !to || amount === undefined) {
        throw new TransactionError('Invalid transaction parameters', network);
      }

      const networkUpper = network.toUpperCase();

      // For EVM chains, optimize gas settings
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        // Convert amount to wei
        const value = ethers.utils.parseEther(amount.toString());

        // Get gas price based on network conditions
        const gasPriceData = await this.gasService.getGasPrice(networkUpper, priorityLevel);

        // Prepare transaction object
        const tx: TransactionObject = {
          from,
          to,
          value,
          data,
          network: networkUpper
        };

        // Add EIP-1559 parameters if supported
        if (gasPriceData.isEip1559) {
          tx.maxFeePerGas = gasPriceData.maxFeePerGas as unknown as ethers.BigNumber;
          tx.maxPriorityFeePerGas = gasPriceData.maxPriorityFeePerGas as unknown as ethers.BigNumber;
        } else {
          tx.gasPrice = gasPriceData.gasPrice as unknown as ethers.BigNumber;
        }

        // Estimate gas limit
        const gasEstimation = await this.gasService.estimateGas(networkUpper, tx, priorityLevel);
        tx.gasLimit = gasEstimation.gasLimit;

        // Add gas cost information
        tx.gasCost = gasEstimation.gasCost;
        tx.gasCostEther = gasEstimation.gasCostEther;
        tx.priorityLevel = priorityLevel;

        return tx;
      }

      // For Solana
      if (networkUpper === 'SOL') {
        // We would implement Solana-specific tx preparation here
        // This is a simplified version
        return {
          from,
          to,
          amount,
          network: networkUpper
        };
      }

      // For other chains
      return {
        from,
        to,
        amount,
        network: networkUpper
      };
    } catch (error) {
      if (error instanceof HotWalletError) {
        throw error;
      }
      throw new TransactionError(
        `Failed to prepare transaction: ${error.message}`,
        txParams.network,
        null,
        { originalError: error.message }
      );
    }
  }

  /**
   * Simulate a transaction before sending
   * @param {Object} txParams - Transaction parameters
   * @returns {Promise<Object>} Simulation results
   */
  async simulateTransaction(txParams: any): Promise<any> {
    try {
      const { network } = txParams;
      if (!network) {
        throw new TransactionError('Network not specified', 'UNKNOWN');
      }

      const networkUpper = network.toUpperCase();
      const handler = this.chainHandlers.getHandler(networkUpper);
      if (!handler || !handler.simulateTransaction) {
        throw new TransactionError(`Simulation not supported for ${networkUpper}`, networkUpper);
      }

      // Prepare the transaction
      const tx = await this.prepareTx(txParams);

      // Simulate the transaction
      const simulationResult = await handler.simulateTransaction(tx);
      if (!simulationResult.success) {
        throw new SimulationError(
          `Transaction simulation failed: ${simulationResult.errors?.message || 'Unknown error'}`,
          networkUpper,
          simulationResult,
          tx
        );
      }

      return {
        success: true,
        tx,
        estimatedGas: simulationResult.estimatedGas,
        ...simulationResult
      };
    } catch (error) {
      if (error instanceof HotWalletError) {
        throw error;
      }
      throw new TransactionError(
        `Failed to simulate transaction: ${error.message}`,
        txParams.network,
        null,
        { originalError: error.message }
      );
    }
  }

  /**
   * Send a native currency transaction
   * @param {Object} txParams - Transaction parameters
   * @returns {Promise<Object>} Transaction result
   */
  async sendTransaction(txParams: any): Promise<any> {
    try {
      const { network, from, to, amount, privateKey, data = '0x', priorityLevel = 'medium' } = txParams;
      
      if (!network || !from || !to || amount === undefined) {
        throw new TransactionError('Invalid transaction parameters', network);
      }

      // If privateKey not provided, try to get it from wallet manager
      const actualPrivateKey = privateKey || this._getPrivateKey(from, network);
      if (!actualPrivateKey) {
        throw new TransactionError(`Private key not found for address ${from}`, network);
      }

      const networkUpper = network.toUpperCase();

      // First simulate to make sure transaction will succeed
      const simulation = await this.simulateTransaction({
        network: networkUpper,
        from,
        to,
        amount,
        data,
        priorityLevel
      });
      
      if (!simulation.success) {
        throw new SimulationError(
          `Transaction simulation failed: ${simulation.errors?.message || 'Unknown error'}`,
          networkUpper,
          simulation,
          txParams
        );
      }

      // Check if user has sufficient balance
      const balance = await this.getBalance(from, networkUpper);
      const totalCost = ethers.BigNumber.from(ethers.utils.parseEther(amount))
        .add(ethers.BigNumber.from(simulation.tx.gasCost || '0'));
      
      if (ethers.BigNumber.from(ethers.utils.parseEther(balance)).lt(totalCost)) {
        throw new InsufficientBalanceError(
          networkUpper,
          from,
          ethers.utils.formatEther(totalCost),
          balance
        );
      }

      // For EVM chains
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        const provider = this.getProvider(networkUpper);
        // Create a wallet with ethers' provider, not our custom Provider
        const wallet = new ethers.Wallet(actualPrivateKey).connect(provider as unknown as ethers.providers.Provider);
        
        // Create transaction object
        const tx: EVMTransaction = {
          to,
          value: ethers.utils.parseEther(amount.toString()),
          gasLimit: simulation.tx.gasLimit,
          data: data || '0x'
        };

        // Add EIP-1559 parameters if supported
        if (simulation.tx.maxFeePerGas) {
          tx.maxFeePerGas = simulation.tx.maxFeePerGas;
          tx.maxPriorityFeePerGas = simulation.tx.maxPriorityFeePerGas;
        } else {
          tx.gasPrice = simulation.tx.gasPrice;
        }

        // Send transaction
        const txResponse = await wallet.sendTransaction(tx);
        
        // Wait for confirmation
        const receipt = await txResponse.wait();
        
        return {
          network: networkUpper,
          from,
          to,
          amount,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice.toString(),
          status: receipt.status === 1,
        };
      }

      // For Solana
      if (networkUpper === 'SOL') {
        // We would implement Solana-specific tx logic here
        throw new TransactionError('Solana transactions not implemented yet', networkUpper);
      }

      throw new TransactionError(`Unsupported network: ${networkUpper}`, networkUpper);
    } catch (error) {
      if (error instanceof HotWalletError) {
        throw error;
      }
      throw new TransactionError(
        `Failed to send transaction: ${error.message}`,
        txParams.network,
        null,
        { originalError: error.message }
      );
    }
  }

  /**
   * Send a token transaction
   * @param {Object} txParams - Transaction parameters
   * @returns {Promise<Object>} Transaction result
   */
  async sendTokenTransaction(txParams: any): Promise<any> {
    try {
      const { network, token, from, to, amount, privateKey, priorityLevel = 'medium' } = txParams;
      
      if (!network || !token || !from || !to || amount === undefined) {
        throw new TransactionError('Invalid token transaction parameters', network);
      }

      const actualPrivateKey = privateKey || this._getPrivateKey(from, network);
      if (!actualPrivateKey) {
        throw new TransactionError(`Private key not found for address ${from}`, network);
      }

      const networkUpper = network.toUpperCase();

      // For EVM chains, get token info (address, decimals)
      let tokenInfo;
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        tokenInfo = await this._getTokenInfo(token);
        if (!tokenInfo) {
          throw new TransactionError(`Token ${token} not found`, networkUpper);
        }

        const provider = this.getProvider(networkUpper);
        // Create a wallet with ethers' provider, not our custom Provider
        const wallet = new ethers.Wallet(actualPrivateKey).connect(provider as unknown as ethers.providers.Provider);
        
        // Create token contract interface
        const tokenABI = [
          'function transfer(address to, uint amount) returns (bool)',
          'function decimals() view returns (uint8)',
        ];
        
        const tokenContract = new ethers.Contract(tokenInfo.address, tokenABI, wallet);
        
        // Get token decimals
        const decimals = tokenInfo.decimals || await tokenContract.decimals();
        
        // Parse amount according to token decimals
        const parsedAmount = ethers.utils.parseUnits(amount, decimals);
        
        // Prepare transaction for simulation
        const simulationTx = {
          from,
          to: tokenInfo.address,
          data: tokenContract.interface.encodeFunctionData('transfer', [to, parsedAmount]),
          value: '0x0',
          network: networkUpper
        };
        
        // Simulate transaction
        const simulation = await this.simulateTransaction({
          ...simulationTx,
          amount: '0', // No native token value is sent
          priorityLevel
        });
        
        if (!simulation.success) {
          throw new SimulationError(
            `Token transaction simulation failed: ${simulation.errors?.message || 'Unknown error'}`,
            networkUpper,
            simulation,
            simulationTx
          );
        }

        // Check if user has sufficient gas
        const nativeBalance = await this.getBalance(from, networkUpper);
        
        if (ethers.BigNumber.from(ethers.utils.parseEther(nativeBalance)).lt(simulation.tx.gasCost || 0)) {
          throw new InsufficientBalanceError(
            networkUpper,
            from,
            ethers.utils.formatEther(simulation.tx.gasCost || 0),
            nativeBalance,
            'gas'
          );
        }

        // Check if user has sufficient token balance
        const tokenBalance = await this.getTokenBalance(from, token);
        
        if (parseFloat(tokenBalance) < parseFloat(amount)) {
          throw new InsufficientBalanceError(
            networkUpper,
            from,
            amount,
            tokenBalance,
            'token'
          );
        }

        // Now send the transaction
        const gasTx: EVMTransaction = {
          to: tokenInfo.address, // Add required 'to' property
          gasLimit: simulation.tx.gasLimit,
        };

        // Add EIP-1559 parameters if supported
        if (simulation.tx.maxFeePerGas) {
          gasTx.maxFeePerGas = simulation.tx.maxFeePerGas;
          gasTx.maxPriorityFeePerGas = simulation.tx.maxPriorityFeePerGas;
        } else {
          gasTx.gasPrice = simulation.tx.gasPrice;
        }

        // Execute the transfer
        const txResponse = await tokenContract.transfer(to, parsedAmount, gasTx);
        const receipt = await txResponse.wait();
        
        return {
          network: networkUpper,
          token,
          tokenAddress: tokenInfo.address,
          from,
          to,
          amount,
          decimals,
          transactionHash: receipt.transactionHash,
          blockNumber: receipt.blockNumber,
          gasUsed: receipt.gasUsed.toString(),
          effectiveGasPrice: receipt.effectiveGasPrice.toString(),
          status: receipt.status === 1
        };
      }
      
      // For Solana
      if (networkUpper === 'SOL') {
        // We would implement SOL-specific token tx logic here
        throw new TransactionError('Solana token transactions not implemented yet', networkUpper);
      }

      throw new TransactionError(`Unsupported network for token transaction: ${networkUpper}`, networkUpper);
    } catch (error) {
      if (error instanceof HotWalletError) {
        throw error;
      }
      throw new TransactionError(
        `Failed to send token transaction: ${error.message}`,
        txParams.network,
        null,
        { originalError: error.message },
      );
    }
  }

  /**
   * Import NFTs from an external wallet
   * @param {string} source - Source wallet type (e.g., 'TRUST_WALLET', 'METAMASK')
   * @param {Object} data - NFT data from external wallet
   * @param {string} network - Network identifier
   * @returns {Promise<Object>} Import result
   */
  async importNFTsFromExternal(source: string, data: any, network: string): Promise<any> {
    try {
      // Handle different external wallet formats
      if (source === 'TRUST_WALLET') {
        // Trust Wallet format
        const nfts = [];
        if (data && data.assets && Array.isArray(data.assets)) {
          for (const asset of data.assets) {
            nfts.push({
              tokenId: asset.token_id,
              contractAddress: asset.contract_address,
              name: asset.name,
              image: asset.image_url,
              description: asset.description,
              attributes: asset.traits
            });
          }
        }
        
        return {
          imported: nfts.length,
          nfts,
          source,
          network
        };
      } else if (source === 'METAMASK') {
        // Metamask format
        // Implementation would be similar to Trust Wallet but with Metamask's format
        return {
          imported: 0,
          nfts: [],
          source,
          network
        };
      }
      
      return {
        imported: 0,
        nfts: [],
        source,
        network,
        error: `Unsupported external source: ${source}`
      };
    } catch (error) {
      console.error(`Error importing NFTs from external source:`, error);
      throw error;
    }
  }

  /**
   * Get private key for an address from wallet manager
   * @private
   */
  _getPrivateKey(address: string, network: string): string | null {
    const wallet = this.walletManager.getWallet(network, address);
    return wallet?.privateKey || null;
  }

  /**
   * Get token info by symbol
   * @private
   */
  async _getTokenInfo(token: string): Promise<any> {
    // Split token symbol to get network and token name
    const [network, symbol] = token.split('_');

    // Get token handler
    const tokenHandler = this.getHandler(token);
    
    if (!tokenHandler) {
      return null;
    }

    // Return token info
    return {
      symbol: token,
      network,
      // ... get other token information from chain handlers
    };
  }

  /**
   * Register event listener with proper typing
   */
  public on<K extends keyof HotWalletEvents>(
    event: K,
    listener: (data: HotWalletEvents[K]) => void
  ): void {
    this._eventEmitter.on(event, listener);
  }

  /**
   * Remove event listener with proper typing
   */
  public off<K extends keyof HotWalletEvents>(
    event: K,
    listener: (data: HotWalletEvents[K]) => void
  ): void {
    if (this._eventEmitter) {
      this._eventEmitter.off(event, listener);
    }
  }

  /**
   * Emit event with proper typing
   * @private
   */
  private emit<K extends keyof HotWalletEvents>(
    event: K, 
    data: HotWalletEvents[K]
  ): void {
    this._eventEmitter.emit(event, data);
  }
  
  /**
   * Clean up resources
   */
  async destroy() {
    try {
      // Clean up MonitoringService
      if (this.monitoringService) {
        try {
          // First try the destroy method
          if (typeof this.monitoringService.destroy === 'function') {
            await Promise.resolve(this.monitoringService.destroy());
          }
          // Also try the stop method for backward compatibility
          if (typeof this.monitoringService.stop === 'function') {
            await Promise.resolve(this.monitoringService.stop());
          }
          // Remove all event listeners
          if (typeof this.monitoringService.removeAllListeners === 'function') {
            this.monitoringService.removeAllListeners();
          }
        } catch (e) {
          console.error('Error cleaning up monitoring service:', e);
        }
      }
      
      // Clean up WebSocket providers
      // Use chainHandlers.getProviders() instead of getProvider()
      const providers = this.chainHandlers.getProviders ? 
        this.chainHandlers.getProviders() : {};
      
      for (const provider of Object.values(providers)) {
        // Cast provider to our extended Provider interface
        const typedProvider = provider as unknown as Provider;
        if (typedProvider?.destroy) {
          try {
            await Promise.resolve(typedProvider.destroy());
          } catch (e) {
            console.error('Error destroying provider:', e);
          }
        }
        if (typedProvider?.removeAllListeners) {
          typedProvider.removeAllListeners();
        }
      }
      
      // Clean up other services as needed
      if (this.walletManager && typeof this.walletManager.clearWallets === 'function') {
        try {
          await Promise.resolve(this.walletManager.clearWallets());
        } catch (e) {
          console.error('Error clearing wallets:', e);
        }
      }
      
      // Remove all event listeners
      this.removeAllListeners();
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error during HotWallet cleanup:', error);
      return Promise.reject(error);
    }
  }

  /**
   * Remove all event listeners
   */
  private removeAllListeners() {
    if (this._eventEmitter) {
      this._eventEmitter.removeAllListeners();
    }
  }

  /**
   * Get supported features
   * @returns {Object} Supported features
   */
  getSupportedFeatures() {
    return {
      chains: ['ETH', 'BNB', 'MATIC', 'SOL', 'BTC'],
      tokens: {
        standards: ['ERC20', 'BEP20', 'SPL'],
        supportedTokens: [
          'ETH_USDT', 'ETH_USDC', 'ETH_DAI', 'ETH_UNI', 'ETH_LINK',
          'BNB_BUSD', 'BNB_CAKE', 'BNB_XVS',
          'MATIC_QUICKSWAP', 'MATIC_AAVE',
          'SOL_USDC', 'SOL_RAY', 'SOL_SRM'
        ]
      },
      nft: {
        standards: ['ERC721', 'ERC1155'],
        features: ['metadata', 'transfer', 'batchTransfer', 'monitoring']
      },
      monitoring: {
        features: ['balanceChanges', 'transactions', 'nftTransfers']
      },
      wallets: {
        import: ['mnemonic', 'privateKey', 'customPath'],
        export: ['mnemonic', 'privateKey']
      },
      security: {
        encryption: ['AES-256-CBC'],
        memoryWiping: true
      },
      trustWalletCompatible: true,
      metamaskCompatible: true
    };
  }

  /**
   * Get a provider for a specific network
   * @private
   * @param {string} network - Network identifier
   * @returns {Provider} Network provider
   */
  private getProvider(network: string): Provider {
    // Get provider from the network handlers
    const providers = this.chainHandlers.getProviders();
    // Return the provider from our providers map
    return (providers[network] || null) as Provider;
  }

  /**
   * Get a handler for a specific token
   * @private
   * @param {string} token - Token identifier
   * @returns {any} Token handler
   */
  private getHandler(token: string): any {
    // Use ChainHandlers' methods correctly
    return this.chainHandlers.getHandler(token);
  }
}

// Export middleware
export { jwtAuthMiddleware, checkRoles };
export type { HotWalletConfig, HotWalletEvents };
export default HotWallet;

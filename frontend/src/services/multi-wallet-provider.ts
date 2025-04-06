/**
 * Multi-Wallet Provider Service
 * 
 * This service provides a unified interface for connecting to and interacting with
 * multiple blockchain wallet providers:
 * - MetaMask (Ethereum)
 * - Phantom (Solana) 
 * - Binance Wallet (BSC)
 * - Trust Wallet (Multi-chain)
 * - Coinbase Wallet (Multi-chain)
 * - WalletConnect (Protocol supporting many wallets)
 */

// Wallet provider types
export enum WalletProviderType {
  METAMASK = 'metamask',
  PHANTOM = 'phantom',
  BINANCE = 'binance',
  TRUST = 'trust',
  COINBASE = 'coinbase',
  WALLETCONNECT = 'walletconnect',
  OTHER = 'other'
}

// Blockchain types
export enum BlockchainType {
  ETHEREUM = 'ethereum',
  SOLANA = 'solana',
  BINANCE = 'binance',
  POLYGON = 'polygon',
  AVALANCHE = 'avalanche',
  ARBITRUM = 'arbitrum',
  OPTIMISM = 'optimism'
}

// Connection status
export enum WalletConnectionStatus {
  DISCONNECTED = 'disconnected',
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  ERROR = 'error'
}

// Connection result
export interface WalletConnectionResult {
  success: boolean;
  address?: string;
  chainId?: string | number;
  provider?: any;
  error?: string;
  providerType: WalletProviderType;
  blockchain: BlockchainType;
}

// Provider interface
export interface WalletProvider {
  type: WalletProviderType;
  name: string;
  logo: string;
  supported: boolean;
  installed: boolean;
  description: string;
  downloadLink: string;
  blockchains: BlockchainType[];
}

// Wallet information
export interface WalletInfo {
  address: string;
  chainId: string | number;
  balance?: string;
  blockchain: BlockchainType;
  providerType: WalletProviderType;
}

// Event types
export enum WalletEventType {
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  ACCOUNT_CHANGED = 'accountChanged',
  CHAIN_CHANGED = 'chainChanged',
  ERROR = 'error'
}

// Event callback type
export type WalletEventCallback = (event: WalletEventType, data?: any) => void;

/**
 * Multi-wallet provider service
 */
class MultiWalletProviderService {
  private currentWallet: WalletInfo | null = null;
  private connectionStatus: WalletConnectionStatus = WalletConnectionStatus.DISCONNECTED;
  private eventListeners: Map<WalletEventType, WalletEventCallback[]> = new Map();
  private providerInstances: Map<WalletProviderType, any> = new Map();

  constructor() {
    this.initializeProviders();
    this.restoreConnection();
  }

  /**
   * Initialize all available wallet providers
   */
  private initializeProviders(): void {
    // This will be executed when the service is loaded
    if (typeof window !== 'undefined') {
      // Check for provider objects in window
      if (this.isMetaMaskAvailable()) {
        this.setupMetaMaskEventListeners();
      }

      if (this.isPhantomAvailable()) {
        this.setupPhantomEventListeners();
      }

      if (this.isBinanceWalletAvailable()) {
        this.setupBinanceWalletEventListeners();
      }

      // Additional providers can be initialized here
    }
  }

  /**
   * Restore previous connection if available
   */
  private async restoreConnection(): Promise<void> {
    if (typeof window === 'undefined') return;

    // Check localStorage for saved connection
    try {
      const savedWallet = localStorage.getItem('connected_wallet');
      if (savedWallet) {
        const walletInfo = JSON.parse(savedWallet) as WalletInfo;
        const providerType = walletInfo.providerType;

        // Try to reconnect to the saved wallet
        try {
          this.connectionStatus = WalletConnectionStatus.CONNECTING;
          this.emitEvent(WalletEventType.CONNECTED, { connecting: true });

          let reconnected = false;
          
          switch (providerType) {
            case WalletProviderType.METAMASK:
              if (this.isMetaMaskAvailable()) {
                reconnected = await this.reconnectMetaMask();
              }
              break;
            case WalletProviderType.PHANTOM:
              if (this.isPhantomAvailable()) {
                reconnected = await this.reconnectPhantom();
              }
              break;
            case WalletProviderType.BINANCE:
              if (this.isBinanceWalletAvailable()) {
                reconnected = await this.reconnectBinanceWallet();
              }
              break;
            // Add other wallet reconnection logic here
          }

          if (!reconnected) {
            // Failed to reconnect, clear saved wallet
            localStorage.removeItem('connected_wallet');
            this.connectionStatus = WalletConnectionStatus.DISCONNECTED;
          }
        } catch (error) {
          console.error('Error restoring wallet connection:', error);
          localStorage.removeItem('connected_wallet');
          this.connectionStatus = WalletConnectionStatus.ERROR;
          this.emitEvent(WalletEventType.ERROR, { error });
        }
      }
    } catch (e) {
      console.error('Error parsing saved wallet:', e);
      localStorage.removeItem('connected_wallet');
    }
  }

  /**
   * Get list of available wallet providers
   */
  public getAvailableProviders(): WalletProvider[] {
    return [
      {
        type: WalletProviderType.METAMASK,
        name: 'MetaMask',
        logo: 'metamask.svg',
        supported: true,
        installed: this.isMetaMaskAvailable(),
        description: 'Connect to your MetaMask Wallet',
        downloadLink: 'https://metamask.io/download/',
        blockchains: [
          BlockchainType.ETHEREUM,
          BlockchainType.POLYGON,
          BlockchainType.BINANCE,
          BlockchainType.AVALANCHE,
          BlockchainType.ARBITRUM,
          BlockchainType.OPTIMISM
        ]
      },
      {
        type: WalletProviderType.PHANTOM,
        name: 'Phantom',
        logo: 'phantom.svg',
        supported: true,
        installed: this.isPhantomAvailable(),
        description: 'Connect to your Phantom Wallet',
        downloadLink: 'https://phantom.app/download',
        blockchains: [BlockchainType.SOLANA]
      },
      {
        type: WalletProviderType.BINANCE,
        name: 'Binance Wallet',
        logo: 'binance.svg',
        supported: true,
        installed: this.isBinanceWalletAvailable(),
        description: 'Connect to Binance Chain Wallet',
        downloadLink: 'https://www.bnbchain.org/en/binance-wallet',
        blockchains: [BlockchainType.BINANCE, BlockchainType.ETHEREUM]
      },
      {
        type: WalletProviderType.TRUST,
        name: 'Trust Wallet',
        logo: 'trust.svg',
        supported: true,
        installed: this.isTrustWalletAvailable(),
        description: 'Connect to Trust Wallet',
        downloadLink: 'https://trustwallet.com/download',
        blockchains: [
          BlockchainType.ETHEREUM,
          BlockchainType.BINANCE,
          BlockchainType.SOLANA,
          BlockchainType.POLYGON
        ]
      },
      {
        type: WalletProviderType.COINBASE,
        name: 'Coinbase Wallet',
        logo: 'coinbase.svg',
        supported: true,
        installed: this.isCoinbaseWalletAvailable(),
        description: 'Connect to Coinbase Wallet',
        downloadLink: 'https://www.coinbase.com/wallet/downloads',
        blockchains: [
          BlockchainType.ETHEREUM,
          BlockchainType.POLYGON,
          BlockchainType.AVALANCHE,
          BlockchainType.OPTIMISM
        ]
      },
      {
        type: WalletProviderType.WALLETCONNECT,
        name: 'WalletConnect',
        logo: 'walletconnect.svg',
        supported: true,
        installed: true, // WalletConnect is a protocol, not a browser extension
        description: 'Connect with WalletConnect',
        downloadLink: 'https://walletconnect.com/registry',
        blockchains: [
          BlockchainType.ETHEREUM,
          BlockchainType.POLYGON,
          BlockchainType.BINANCE,
          BlockchainType.SOLANA,
          BlockchainType.AVALANCHE,
          BlockchainType.ARBITRUM,
          BlockchainType.OPTIMISM
        ]
      }
    ];
  }

  /**
   * Connect to a specific wallet provider
   */
  public async connectWallet(
    providerType: WalletProviderType,
    options: any = {}
  ): Promise<WalletConnectionResult> {
    if (this.connectionStatus === WalletConnectionStatus.CONNECTING) {
      return {
        success: false,
        error: 'Connection already in progress',
        providerType,
        blockchain: this.getDefaultBlockchainForProvider(providerType)
      };
    }

    this.connectionStatus = WalletConnectionStatus.CONNECTING;

    try {
      let result: WalletConnectionResult;

      switch (providerType) {
        case WalletProviderType.METAMASK:
          result = await this.connectMetaMask(options);
          break;
        case WalletProviderType.PHANTOM:
          result = await this.connectPhantom(options);
          break;
        case WalletProviderType.BINANCE:
          result = await this.connectBinanceWallet(options);
          break;
        case WalletProviderType.TRUST:
          result = await this.connectTrustWallet(options);
          break;
        case WalletProviderType.COINBASE:
          result = await this.connectCoinbaseWallet(options);
          break;
        case WalletProviderType.WALLETCONNECT:
          result = await this.connectWalletConnect(options);
          break;
        default:
          throw new Error(`Unsupported wallet provider: ${providerType}`);
      }

      if (result.success) {
        this.currentWallet = {
          address: result.address!,
          chainId: result.chainId!,
          blockchain: result.blockchain,
          providerType: result.providerType
        };

        // Save connection info
        localStorage.setItem('connected_wallet', JSON.stringify(this.currentWallet));
        
        this.connectionStatus = WalletConnectionStatus.CONNECTED;
        this.emitEvent(WalletEventType.CONNECTED, this.currentWallet);
      } else {
        this.connectionStatus = WalletConnectionStatus.ERROR;
        this.emitEvent(WalletEventType.ERROR, { error: result.error });
      }

      return result;
    } catch (error: any) {
      this.connectionStatus = WalletConnectionStatus.ERROR;
      
      const errorMessage = error?.message || 'Unknown error connecting to wallet';
      this.emitEvent(WalletEventType.ERROR, { error: errorMessage });
      
      return {
        success: false,
        error: errorMessage,
        providerType,
        blockchain: this.getDefaultBlockchainForProvider(providerType)
      };
    }
  }

  /**
   * Disconnect from the current wallet
   */
  public async disconnectWallet(): Promise<void> {
    if (!this.currentWallet) return;

    const providerType = this.currentWallet.providerType;

    try {
      switch (providerType) {
        case WalletProviderType.METAMASK:
          // MetaMask doesn't have a disconnect method
          break;
        case WalletProviderType.PHANTOM:
          await this.disconnectPhantom();
          break;
        case WalletProviderType.WALLETCONNECT:
          await this.disconnectWalletConnect();
          break;
        // Add other wallet disconnection logic here
      }

      // Clean up regardless of specific wallet disconnect success
      this.currentWallet = null;
      localStorage.removeItem('connected_wallet');
      this.connectionStatus = WalletConnectionStatus.DISCONNECTED;
      this.emitEvent(WalletEventType.DISCONNECTED, {});
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      this.emitEvent(WalletEventType.ERROR, { error });
    }
  }

  /**
   * Get current connection status
   */
  public getConnectionStatus(): WalletConnectionStatus {
    return this.connectionStatus;
  }

  /**
   * Get current wallet info
   */
  public getCurrentWallet(): WalletInfo | null {
    return this.currentWallet;
  }

  /**
   * Sign a message with the current wallet
   */
  public async signMessage(message: string): Promise<string | null> {
    if (!this.currentWallet) {
      throw new Error('No wallet connected');
    }

    try {
      let signature: string | null = null;
      
      switch (this.currentWallet.providerType) {
        case WalletProviderType.METAMASK:
          signature = await this.signMessageWithMetaMask(message);
          break;
        case WalletProviderType.PHANTOM:
          signature = await this.signMessageWithPhantom(message);
          break;
        case WalletProviderType.BINANCE:
          signature = await this.signMessageWithBinanceWallet(message);
          break;
        // Add other wallet signing logic here
        default:
          throw new Error(`Signing not implemented for ${this.currentWallet.providerType}`);
      }

      return signature;
    } catch (error) {
      console.error('Error signing message:', error);
      this.emitEvent(WalletEventType.ERROR, { error });
      return null;
    }
  }

  /**
   * Check if MetaMask is available
   */
  public isMetaMaskAvailable(): boolean {
    return typeof window !== 'undefined' && 
           !!window.ethereum && 
           (window.ethereum.isMetaMask || false);
  }

  /**
   * Check if Phantom is available
   */
  public isPhantomAvailable(): boolean {
    return typeof window !== 'undefined' && 
           !!window.solana && 
           !!window.solana.isPhantom;
  }

  /**
   * Check if Binance Wallet is available
   */
  public isBinanceWalletAvailable(): boolean {
    return typeof window !== 'undefined' && 
           !!window.BinanceChain;
  }

  /**
   * Check if Trust Wallet is available
   */
  public isTrustWalletAvailable(): boolean {
    return typeof window !== 'undefined' && 
           !!window.ethereum && 
           !!window.ethereum.isTrust;
  }

  /**
   * Check if Coinbase Wallet is available
   */
  public isCoinbaseWalletAvailable(): boolean {
    return typeof window !== 'undefined' && 
           !!window.ethereum && 
           !!window.ethereum.isCoinbaseWallet;
  }

  // Event listeners

  /**
   * Subscribe to wallet events
   */
  public on(event: WalletEventType, callback: WalletEventCallback): () => void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }

    this.eventListeners.get(event)!.push(callback);

    // Return unsubscribe function
    return () => {
      const listeners = this.eventListeners.get(event);
      if (listeners) {
        this.eventListeners.set(event, listeners.filter(cb => cb !== callback));
      }
    };
  }

  /**
   * Emit event to all listeners
   */
  private emitEvent(event: WalletEventType, data?: any): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(callback => {
        try {
          callback(event, data);
        } catch (error) {
          console.error(`Error in wallet event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Get default blockchain for a provider
   */
  private getDefaultBlockchainForProvider(providerType: WalletProviderType): BlockchainType {
    switch (providerType) {
      case WalletProviderType.METAMASK:
        return BlockchainType.ETHEREUM;
      case WalletProviderType.PHANTOM:
        return BlockchainType.SOLANA;
      case WalletProviderType.BINANCE:
        return BlockchainType.BINANCE;
      case WalletProviderType.TRUST:
        return BlockchainType.ETHEREUM;
      case WalletProviderType.COINBASE:
        return BlockchainType.ETHEREUM;
      case WalletProviderType.WALLETCONNECT:
        return BlockchainType.ETHEREUM;
      default:
        return BlockchainType.ETHEREUM;
    }
  }

  // MetaMask specific functionality

  private setupMetaMaskEventListeners() {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        this.disconnectWallet();
      } else if (this.currentWallet?.providerType === WalletProviderType.METAMASK) {
        // Account changed, update current wallet
        this.currentWallet.address = accounts[0];
        localStorage.setItem('connected_wallet', JSON.stringify(this.currentWallet));
        this.emitEvent(WalletEventType.ACCOUNT_CHANGED, { address: accounts[0] });
      }
    });

    window.ethereum.on('chainChanged', (chainId: string) => {
      if (this.currentWallet?.providerType === WalletProviderType.METAMASK) {
        // Chain changed, update current wallet
        this.currentWallet.chainId = chainId;
        localStorage.setItem('connected_wallet', JSON.stringify(this.currentWallet));
        this.emitEvent(WalletEventType.CHAIN_CHANGED, { chainId });
      }
    });

    window.ethereum.on('disconnect', () => {
      if (this.currentWallet?.providerType === WalletProviderType.METAMASK) {
        this.disconnectWallet();
      }
    });
  }

  private async connectMetaMask(options: any = {}): Promise<WalletConnectionResult> {
    if (!this.isMetaMaskAvailable()) {
      return {
        success: false,
        error: 'MetaMask is not installed',
        providerType: WalletProviderType.METAMASK,
        blockchain: BlockchainType.ETHEREUM
      };
    }

    try {
      // Request account access
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      // Get chain ID
      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      return {
        success: true,
        address: accounts[0],
        chainId,
        provider: window.ethereum,
        providerType: WalletProviderType.METAMASK,
        blockchain: BlockchainType.ETHEREUM
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to MetaMask',
        providerType: WalletProviderType.METAMASK,
        blockchain: BlockchainType.ETHEREUM
      };
    }
  }

  private async reconnectMetaMask(): Promise<boolean> {
    try {
      // Check if already connected
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts'  // Non-prompting version of eth_requestAccounts
      });

      if (accounts.length > 0) {
        // User is already connected
        const chainId = await window.ethereum.request({ 
          method: 'eth_chainId' 
        });

        this.currentWallet = {
          address: accounts[0],
          chainId,
          blockchain: BlockchainType.ETHEREUM,
          providerType: WalletProviderType.METAMASK
        };

        this.connectionStatus = WalletConnectionStatus.CONNECTED;
        this.emitEvent(WalletEventType.CONNECTED, this.currentWallet);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error reconnecting to MetaMask:', error);
      return false;
    }
  }

  private async signMessageWithMetaMask(message: string): Promise<string> {
    if (!this.currentWallet || !window.ethereum) {
      throw new Error('MetaMask not connected');
    }

    // Convert message to hex
    const hexMessage = '0x' + Buffer.from(message).toString('hex');

    // Request signature
    const signature = await window.ethereum.request({
      method: 'personal_sign',
      params: [hexMessage, this.currentWallet.address]
    });

    return signature;
  }

  // Phantom (Solana) specific functionality

  private setupPhantomEventListeners() {
    if (!window.solana) return;

    window.solana.on('accountChanged', () => {
      if (this.currentWallet?.providerType === WalletProviderType.PHANTOM) {
        // Re-fetch the current public key
        const publicKey = window.solana.publicKey?.toString();
        
        if (publicKey) {
          this.currentWallet.address = publicKey;
          localStorage.setItem('connected_wallet', JSON.stringify(this.currentWallet));
          this.emitEvent(WalletEventType.ACCOUNT_CHANGED, { address: publicKey });
        } else {
          // Disconnected
          this.disconnectWallet();
        }
      }
    });

    window.solana.on('disconnect', () => {
      if (this.currentWallet?.providerType === WalletProviderType.PHANTOM) {
        this.disconnectWallet();
      }
    });
  }

  private async connectPhantom(options: any = {}): Promise<WalletConnectionResult> {
    if (!this.isPhantomAvailable()) {
      return {
        success: false,
        error: 'Phantom is not installed',
        providerType: WalletProviderType.PHANTOM,
        blockchain: BlockchainType.SOLANA
      };
    }

    try {
      // Connect to Phantom
      const response = await window.solana.connect();
      const address = response.publicKey.toString();

      return {
        success: true,
        address,
        chainId: 'solana', // Solana doesn't have a chainId in the same way as Ethereum
        provider: window.solana,
        providerType: WalletProviderType.PHANTOM,
        blockchain: BlockchainType.SOLANA
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Phantom',
        providerType: WalletProviderType.PHANTOM,
        blockchain: BlockchainType.SOLANA
      };
    }
  }

  private async reconnectPhantom(): Promise<boolean> {
    if (!window.solana.isConnected) return false;

    try {
      const address = window.solana.publicKey?.toString();
      if (!address) return false;

      this.currentWallet = {
        address,
        chainId: 'solana',
        blockchain: BlockchainType.SOLANA,
        providerType: WalletProviderType.PHANTOM
      };

      this.connectionStatus = WalletConnectionStatus.CONNECTED;
      this.emitEvent(WalletEventType.CONNECTED, this.currentWallet);
      return true;
    } catch (error) {
      console.error('Error reconnecting to Phantom:', error);
      return false;
    }
  }

  private async disconnectPhantom(): Promise<void> {
    if (!window.solana) return;
    await window.solana.disconnect();
  }

  private async signMessageWithPhantom(message: string): Promise<string> {
    if (!this.currentWallet || !window.solana) {
      throw new Error('Phantom not connected');
    }

    // Convert message to Uint8Array
    const messageBytes = new TextEncoder().encode(message);

    // Request signature
    const { signature } = await window.solana.signMessage(
      messageBytes, 
      'utf8'
    );

    return Buffer.from(signature).toString('hex');
  }

  // Binance Wallet specific functionality

  private setupBinanceWalletEventListeners() {
    if (!window.BinanceChain) return;

    // Binance wallet doesn't have standard events like MetaMask
    // We'll need to periodically check or rely on user actions
  }

  private async connectBinanceWallet(options: any = {}): Promise<WalletConnectionResult> {
    if (!this.isBinanceWalletAvailable()) {
      return {
        success: false,
        error: 'Binance Wallet is not installed',
        providerType: WalletProviderType.BINANCE,
        blockchain: BlockchainType.BINANCE
      };
    }

    try {
      // Connect to Binance Wallet
      const accounts = await window.BinanceChain.request({ 
        method: 'eth_requestAccounts' 
      });

      // Get chain ID
      const chainId = await window.BinanceChain.request({ 
        method: 'eth_chainId' 
      });

      return {
        success: true,
        address: accounts[0],
        chainId,
        provider: window.BinanceChain,
        providerType: WalletProviderType.BINANCE,
        blockchain: BlockchainType.BINANCE
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Binance Wallet',
        providerType: WalletProviderType.BINANCE,
        blockchain: BlockchainType.BINANCE
      };
    }
  }

  private async reconnectBinanceWallet(): Promise<boolean> {
    try {
      // Check if already connected
      const accounts = await window.BinanceChain.request({ 
        method: 'eth_accounts'
      });

      if (accounts.length > 0) {
        // User is already connected
        const chainId = await window.BinanceChain.request({ 
          method: 'eth_chainId' 
        });

        this.currentWallet = {
          address: accounts[0],
          chainId,
          blockchain: BlockchainType.BINANCE,
          providerType: WalletProviderType.BINANCE
        };

        this.connectionStatus = WalletConnectionStatus.CONNECTED;
        this.emitEvent(WalletEventType.CONNECTED, this.currentWallet);
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error reconnecting to Binance Wallet:', error);
      return false;
    }
  }

  private async signMessageWithBinanceWallet(message: string): Promise<string> {
    if (!this.currentWallet || !window.BinanceChain) {
      throw new Error('Binance Wallet not connected');
    }

    // Convert message to hex
    const hexMessage = '0x' + Buffer.from(message).toString('hex');

    // Request signature
    const signature = await window.BinanceChain.request({
      method: 'personal_sign',
      params: [hexMessage, this.currentWallet.address]
    });

    return signature;
  }

  // Trust Wallet specific functionality

  private async connectTrustWallet(options: any = {}): Promise<WalletConnectionResult> {
    if (!this.isTrustWalletAvailable()) {
      return {
        success: false,
        error: 'Trust Wallet is not installed',
        providerType: WalletProviderType.TRUST,
        blockchain: BlockchainType.ETHEREUM
      };
    }

    try {
      // Trust Wallet uses the Ethereum provider standard
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      return {
        success: true,
        address: accounts[0],
        chainId,
        provider: window.ethereum,
        providerType: WalletProviderType.TRUST,
        blockchain: BlockchainType.ETHEREUM
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Trust Wallet',
        providerType: WalletProviderType.TRUST,
        blockchain: BlockchainType.ETHEREUM
      };
    }
  }

  // Coinbase Wallet specific functionality

  private async connectCoinbaseWallet(options: any = {}): Promise<WalletConnectionResult> {
    if (!this.isCoinbaseWalletAvailable()) {
      return {
        success: false,
        error: 'Coinbase Wallet is not installed',
        providerType: WalletProviderType.COINBASE,
        blockchain: BlockchainType.ETHEREUM
      };
    }

    try {
      // Coinbase Wallet uses the Ethereum provider standard
      const accounts = await window.ethereum.request({ 
        method: 'eth_requestAccounts' 
      });

      const chainId = await window.ethereum.request({ 
        method: 'eth_chainId' 
      });

      return {
        success: true,
        address: accounts[0],
        chainId,
        provider: window.ethereum,
        providerType: WalletProviderType.COINBASE,
        blockchain: BlockchainType.ETHEREUM
      };
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect to Coinbase Wallet',
        providerType: WalletProviderType.COINBASE,
        blockchain: BlockchainType.ETHEREUM
      };
    }
  }

  // WalletConnect specific functionality

  private async connectWalletConnect(options: any = {}): Promise<WalletConnectionResult> {
    try {
      // WalletConnect v2 requires an external library
      // This is a placeholder for actual implementation
      console.warn('WalletConnect integration requires additional setup');
      
      return {
        success: false,
        error: 'WalletConnect implementation requires external library',
        providerType: WalletProviderType.WALLETCONNECT,
        blockchain: BlockchainType.ETHEREUM
      };
      
      // Actual implementation would:
      // 1. Initialize WalletConnect client
      // 2. Create a session
      // 3. Handle connection/disconnection events
      // 4. Return connection result
    } catch (error: any) {
      return {
        success: false,
        error: error.message || 'Failed to connect with WalletConnect',
        providerType: WalletProviderType.WALLETCONNECT,
        blockchain: BlockchainType.ETHEREUM
      };
    }
  }

  private async disconnectWalletConnect(): Promise<void> {
    // Placeholder for WalletConnect disconnect implementation
    console.warn('WalletConnect disconnect requires proper implementation');
  }

  // Utility methods for working with specific chains

  /**
   * Switch to a different blockchain/network
   */
  public async switchChain(
    chainId: string | number,
    blockchain: BlockchainType
  ): Promise<boolean> {
    if (!this.currentWallet) {
      return false;
    }

    try {
      // Handle switching chains based on the wallet type
      switch (this.currentWallet.providerType) {
        case WalletProviderType.METAMASK:
        case WalletProviderType.TRUST:
        case WalletProviderType.COINBASE:
          // EVM-compatible wallets use similar approach
          await this.switchEthereumChain(chainId);
          break;
        case WalletProviderType.BINANCE:
          // Binance wallet chain switching
          await this.switchBinanceChain(chainId);
          break;
        // Solana-based wallets typically don't have a chain switching method
        default:
          return false;
      }

      // Update wallet info on successful switch
      this.currentWallet.chainId = chainId;
      this.currentWallet.blockchain = blockchain;
      localStorage.setItem('connected_wallet', JSON.stringify(this.currentWallet));
      
      this.emitEvent(WalletEventType.CHAIN_CHANGED, { chainId, blockchain });
      return true;
    } catch (error: any) {
      console.error('Error switching chain:', error);
      this.emitEvent(WalletEventType.ERROR, { error });
      return false;
    }
  }

  private async switchEthereumChain(chainId: string | number): Promise<void> {
    if (!window.ethereum) throw new Error('Ethereum provider not found');

    // If chainId is a number, convert to hex
    const hexChainId = typeof chainId === 'string' && chainId.startsWith('0x')
      ? chainId
      : '0x' + Number(chainId).toString(16);

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }]
      });
    } catch (error: any) {
      // Chain not added yet
      if (error.code === 4902) {
        // Could implement adding the chain here
        throw new Error('Chain not added to wallet');
      }
      throw error;
    }
  }

  private async switchBinanceChain(chainId: string | number): Promise<void> {
    if (!window.BinanceChain) throw new Error('Binance Chain provider not found');

    // If chainId is a number, convert to hex
    const hexChainId = typeof chainId === 'string' && chainId.startsWith('0x')
      ? chainId
      : '0x' + Number(chainId).toString(16);

    try {
      await window.BinanceChain.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: hexChainId }]
      });
    } catch (error) {
      throw error;
    }
  }

  /**
   * Check if a given wallet provider is available
   */
  public isProviderAvailable(providerType: WalletProviderType): boolean {
    switch (providerType) {
      case WalletProviderType.METAMASK:
        return this.isMetaMaskAvailable();
      case WalletProviderType.PHANTOM:
        return this.isPhantomAvailable();
      case WalletProviderType.BINANCE:
        return this.isBinanceWalletAvailable();
      case WalletProviderType.TRUST:
        return this.isTrustWalletAvailable();
      case WalletProviderType.COINBASE:
        return this.isCoinbaseWalletAvailable();
      case WalletProviderType.WALLETCONNECT:
        return true; // WalletConnect is a protocol, not a browser extension
      default:
        return false;
    }
  }
}

// Add global type definitions
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    BinanceChain?: any;
  }
}

// Create and export singleton instance
export const multiWalletProvider = new MultiWalletProviderService();

export default multiWalletProvider;
/**
 * Wallet Selector Service
 * 
 * Detects available wallets and provides a mechanism to select and connect to them
 */
import { MetaMaskProvider, WalletConnectProvider, BinanceWalletProvider, TrustWalletProvider } from "./providers/ethereum";
import { PhantomProvider, SolflareProvider } from "./providers/solana";
import { TonKeeperProvider } from "./providers/ton";
import { 
  BlockchainType, 
  WalletConnectionResult, 
  WalletInfo, 
  WalletProvider,
  WalletProviderType,
  WalletEvent,
  WalletEventEmitter
} from "./core/walletBase";

// Type for configuring wallet display in the selector
interface WalletConfig {
  name: string;
  blockchain: BlockchainType;
  icon?: string;
  alwaysAvailable?: boolean;
}

export interface AvailableWallet {
  name: string;
  providerType: WalletProviderType;
  blockchain: BlockchainType;
  icon?: string;
  installed: boolean;
  provider: WalletProvider;
}

export class WalletSelector implements WalletEventEmitter {
  private walletProviders: Map<WalletProviderType, WalletProvider> = new Map();
  private walletConfigs: Map<WalletProviderType, WalletConfig> = new Map();
  private availableWallets: AvailableWallet[] = [];
  private lastConnectedWallet: WalletInfo | null = null;
  private eventListeners: Map<WalletEvent, Array<(...args: any[]) => void>> = new Map();
  
  constructor() {
    this.initializeProviders();
    this.setupWalletConfigs();
  }

  /**
   * Initialize wallet providers
   */
  private initializeProviders(): void {
    // Ethereum wallet providers
    this.registerProvider(WalletProviderType.METAMASK, new MetaMaskProvider());
    this.registerProvider(WalletProviderType.WALLETCONNECT, new WalletConnectProvider());
    this.registerProvider(WalletProviderType.BINANCE, new BinanceWalletProvider());
    this.registerProvider(WalletProviderType.TRUST, new TrustWalletProvider());
    
    // Solana wallet providers
    this.registerProvider(WalletProviderType.PHANTOM, new PhantomProvider());
    this.registerProvider(WalletProviderType.SOLFLARE, new SolflareProvider());
    
    // TON wallet providers
    this.registerProvider(WalletProviderType.TONKEEPER, new TonKeeperProvider());
  }

  /**
   * Register a wallet provider
   */
  private registerProvider(type: WalletProviderType, provider: WalletProvider): void {
    if (!provider) {
      console.warn(`Failed to initialize ${type} provider`);
      return;
    }
    this.walletProviders.set(type, provider);
  }

  /**
   * Setup wallet configuration information
   */
  private setupWalletConfigs(): void {
    // Ethereum wallets
    this.walletConfigs.set(WalletProviderType.METAMASK, {
      name: 'MetaMask',
      blockchain: BlockchainType.ETHEREUM,
      icon: '/assets/wallets/metamask.svg'
    });
    
    this.walletConfigs.set(WalletProviderType.WALLETCONNECT, {
      name: 'WalletConnect',
      blockchain: BlockchainType.ETHEREUM,
      icon: '/assets/wallets/walletconnect.svg',
      alwaysAvailable: true // QR code connect
    });
    
    this.walletConfigs.set(WalletProviderType.BINANCE, {
      name: 'Binance Wallet',
      blockchain: BlockchainType.BINANCE,
      icon: '/assets/wallets/binance.svg'
    });
    
    this.walletConfigs.set(WalletProviderType.TRUST, {
      name: 'Trust Wallet',
      blockchain: BlockchainType.ETHEREUM,
      icon: '/assets/wallets/trust.svg'
    });
    
    // Solana wallets
    this.walletConfigs.set(WalletProviderType.PHANTOM, {
      name: 'Phantom',
      blockchain: BlockchainType.SOLANA,
      icon: '/assets/wallets/phantom.svg'
    });
    
    this.walletConfigs.set(WalletProviderType.SOLFLARE, {
      name: 'Solflare',
      blockchain: BlockchainType.SOLANA,
      icon: '/assets/wallets/solflare.svg'
    });
    
    // TON wallets
    this.walletConfigs.set(WalletProviderType.TONKEEPER, {
      name: 'TONKeeper',
      blockchain: BlockchainType.TON,
      icon: '/assets/wallets/tonkeeper.svg'
    });
  }

  /**
   * Register an event listener
   * @param event Event type
   * @param listener Callback function
   */
  public on(event: WalletEvent, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) {
      this.eventListeners.set(event, []);
    }
    this.eventListeners.get(event)?.push(listener);
  }

  /**
   * Unregister an event listener
   * @param event Event type
   * @param listener Callback function
   */
  public off(event: WalletEvent, listener: (...args: any[]) => void): void {
    if (!this.eventListeners.has(event)) return;
    
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      const index = listeners.indexOf(listener);
      if (index !== -1) {
        listeners.splice(index, 1);
      }
    }
  }

  /**
   * Emit an event to all registered listeners
   * @param event Event type
   * @param args Event arguments
   */
  public emit(event: WalletEvent, ...args: any[]): void {
    const listeners = this.eventListeners.get(event);
    if (listeners) {
      listeners.forEach(listener => {
        try {
          listener(...args);
        } catch (error) {
          console.error(`Error in wallet event listener for ${event}:`, error);
        }
      });
    }
  }

  /**
   * Check for all available wallets on the user's device
   */
  public detectWallets(): AvailableWallet[] {
    this.availableWallets = [];

    // Using Array.from to avoid TS2802 error with Map.entries() iteration
    Array.from(this.walletConfigs.keys()).forEach(providerType => {
      const config = this.walletConfigs.get(providerType);
      const provider = this.walletProviders.get(providerType);
      
      if (!provider || !config) {
        return;
      }

      // Check if wallet is installed (or always available)
      let isInstalled = false;
      if (config.alwaysAvailable === true) {
        isInstalled = true;
      } else if (provider.isAvailable && typeof provider.isAvailable === 'function') {
        isInstalled = provider.isAvailable();
      }
      
      // Add to available wallets
      this.availableWallets.push({
        name: config.name,
        providerType: providerType,
        blockchain: config.blockchain,
        icon: config.icon,
        installed: isInstalled,
        provider: provider
      });
    });

    return this.availableWallets;
  }

  /**
   * Get all available wallets
   * @returns List of available wallets
   */
  public getAvailableWallets(): AvailableWallet[] {
    if (this.availableWallets.length === 0) {
      return this.detectWallets();
    }
    return this.availableWallets;
  }

  /**
   * Connect to a specific wallet by type
   * @param providerType The type of wallet to connect to
   * @returns Connection result
   */
  public async connectWallet(providerType: WalletProviderType): Promise<WalletConnectionResult> {
    const provider = this.walletProviders.get(providerType);
    
    if (!provider) {
      return {
        success: false,
        error: `Wallet provider ${providerType} not found`
      };
    }

    try {
      console.log(`Attempting to connect to wallet: ${providerType}`);
      const result = await provider.connect();
      
      if (result.success && result.walletInfo) {
        console.log(`Successfully connected to wallet: ${result.walletInfo.address}`);
        this.lastConnectedWallet = result.walletInfo;
        
        // Store the wallet information in local storage
        localStorage.setItem('lastConnectedWalletType', providerType);

        // Emit connected event
        this.emit(WalletEvent.CONNECTED, result.walletInfo);
        
        return result;
      }
      
      console.warn(`Connection to wallet failed: ${result.error || 'Unknown error'}`);
      return result;
    } catch (error: any) {
      // Emit error event
      const errorMessage = error?.message || `Failed to connect to ${providerType} wallet`;
      console.error(`Wallet connection error: ${errorMessage}`, error);
      
      this.emit(WalletEvent.ERROR, errorMessage);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Connect to the last used wallet if available
   * @returns Connection result or null if no last wallet
   */
  public async connectToLastWallet(): Promise<WalletConnectionResult | null> {
    try {
      const lastWalletType = localStorage.getItem('lastConnectedWalletType');
      
      if (!lastWalletType) {
        console.log('No previously connected wallet found');
        return null;
      }
      
      const providerType = lastWalletType as WalletProviderType;
      const provider = this.walletProviders.get(providerType);
      
      if (!provider) {
        console.warn(`Last used wallet provider ${providerType} not available`);
        return null;
      }
      
      console.log(`Attempting to reconnect to last used wallet: ${providerType}`);
      return await this.connectWallet(providerType);
    } catch (error) {
      console.error('Error reconnecting to last wallet:', error);
      return null;
    }
  }

  /**
   * Disconnect from the current wallet
   * @returns Whether the disconnection was successful
   */
  public async disconnectWallet(providerType?: WalletProviderType): Promise<boolean> {
    try {
      if (providerType) {
        const provider = this.walletProviders.get(providerType);
        if (provider) {
          console.log(`Disconnecting specific wallet: ${providerType}`);
          const result = await provider.disconnect();
          
          if (result) {
            this.emit(WalletEvent.DISCONNECTED);
          }
          
          return result;
        }
        return false;
      } else if (this.lastConnectedWallet) {
        const provider = this.walletProviders.get(this.lastConnectedWallet.providerType);
        if (provider) {
          console.log(`Disconnecting current wallet: ${this.lastConnectedWallet.providerType}`);
          const result = await provider.disconnect();
          
          if (result) {
            this.lastConnectedWallet = null;
            localStorage.removeItem('lastConnectedWalletType');
            this.emit(WalletEvent.DISCONNECTED);
          }
          
          return result;
        }
      }

      console.log('No wallet to disconnect');
      return true;
    } catch (error) {
      console.error('Error disconnecting wallet:', error);
      return false;
    }
  }

  /**
   * Sign a message with the current wallet
   * @param message The message to sign
   * @param walletInfo Optional wallet info to use instead of the current wallet
   * @returns The signature result
   */
  public async signMessage(message: string, walletInfo?: WalletInfo): Promise<{success: boolean; signature?: string; error?: string}> {
    try {
      const activeWalletInfo = walletInfo || this.lastConnectedWallet;
      
      if (!activeWalletInfo) {
        return {
          success: false,
          error: 'No wallet connected'
        };
      }
      
      const provider = this.walletProviders.get(activeWalletInfo.providerType);
      
      if (!provider) {
        return {
          success: false,
          error: 'Wallet provider not found'
        };
      }
      
      console.log(`Requesting signature from wallet: ${activeWalletInfo.providerType}`);
      const result = await provider.signMessage(message, activeWalletInfo.address);
      
      if (result.success) {
        console.log('Message signed successfully');
      } else {
        console.warn(`Signing failed: ${result.error || 'Unknown error'}`);
      }
      
      return result;
    } catch (error: any) {
      const errorMessage = error?.message || 'Unknown error signing message';
      console.error(`Error signing message: ${errorMessage}`, error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }

  /**
   * Get the currently connected wallet info
   * @returns Wallet info or null if not connected
   */
  public getCurrentWallet(): WalletInfo | null {
    return this.lastConnectedWallet;
  }

  /**
   * Check if any wallet is currently connected
   * @returns Whether a wallet is connected
   */
  public isWalletConnected(): boolean {
    return !!this.lastConnectedWallet;
  }
  
  /**
   * Manually update the current wallet info
   * This is especially useful for Trust Wallet which may have synchronization issues
   * @param walletInfo Updated wallet information
   */
  public updateCurrentWallet(walletInfo: WalletInfo): void {
    if (!walletInfo || !walletInfo.address) {
      console.warn('Attempted to update wallet with invalid wallet info');
      return;
    }
    
    console.log(`Manually updating current wallet info: ${walletInfo.address}`);
    this.lastConnectedWallet = walletInfo;
    
    // Emit an updated event to ensure all listeners are aware of the change
    this.emit(WalletEvent.UPDATED, walletInfo);
  }
  
  /**
   * Force emit a wallet update event
   * This helps synchronize wallet state between components
   * @param walletInfo Wallet information to include in the update event
   */
  public emitWalletUpdate(walletInfo: WalletInfo): void {
    if (!walletInfo) return;
    
    console.log(`Forcing wallet update event for: ${walletInfo.address}`);
    // First emit an updated event
    this.emit(WalletEvent.UPDATED, walletInfo);
    
    // Then re-emit a connected event to ensure all handlers pick up the wallet
    setTimeout(() => {
      this.emit(WalletEvent.CONNECTED, walletInfo);
    }, 100);
  }
  
  /**
   * Switch to a different network
   * @param chainId The chain ID to switch to
   * @param providerType Optional provider type to use
   * @returns Whether the switch was successful
   */
  public async switchNetwork(chainId: string, providerType?: WalletProviderType): Promise<boolean> {
    try {
      let provider: WalletProvider | undefined;
      
      if (providerType) {
        provider = this.walletProviders.get(providerType);
      } else if (this.lastConnectedWallet) {
        provider = this.walletProviders.get(this.lastConnectedWallet.providerType);
      }
      
      if (!provider || typeof provider.switchNetwork !== 'function') {
        console.warn('Network switching not supported for this wallet');
        return false;
      }
      
      console.log(`Attempting to switch network to chainId: ${chainId}`);
      const result = await provider.switchNetwork(chainId);
      
      if (result && this.lastConnectedWallet) {
        // Update chain ID in wallet info
        this.lastConnectedWallet = {
          ...this.lastConnectedWallet,
          chainId
        };
        
        console.log(`Network switched successfully to chainId: ${chainId}`);
        this.emit(WalletEvent.CHAIN_CHANGED, chainId);
      } else {
        console.warn(`Failed to switch network to chainId: ${chainId}`);
      }
      
      return result;
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  }
  
  /**
   * Get wallet configuration by provider type
   * @param providerType The wallet provider type
   * @returns The wallet configuration or undefined if not found
   */
  public getWalletConfig(providerType: WalletProviderType): WalletConfig | undefined {
    return this.walletConfigs.get(providerType);
  }

  /**
   * Check if a specific wallet provider is available
   * @param providerType The wallet provider type to check
   * @returns Boolean indicating if the wallet is available
   */
  public isWalletAvailable(providerType: WalletProviderType): boolean {
    const provider = this.walletProviders.get(providerType);
    if (!provider) return false;
    
    const config = this.walletConfigs.get(providerType);
    if (config?.alwaysAvailable) return true;
    
    return !!(provider.isAvailable && typeof provider.isAvailable === 'function' && provider.isAvailable());
  }
}

export default WalletSelector;
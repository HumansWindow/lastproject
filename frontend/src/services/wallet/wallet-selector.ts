/**
 * Wallet Selector Service
 * 
 * Detects available wallets and provides a mechanism to select and connect to them
 */
import { MetaMaskProvider, WalletConnectProvider, BinanceWalletProvider, TrustWalletProvider } from './providers/ethereum';
import { PhantomProvider, SolflareProvider } from './providers/solana';
import { TonKeeperProvider } from './providers/ton';
import { 
  BlockchainType, 
  WalletConnectionResult, 
  WalletInfo, 
  WalletProvider,
  WalletProviderType,
  WalletEvent,
  WalletEventEmitter
} from './core/wallet-base';

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
  private availableWallets: AvailableWallet[] = [];
  private lastConnectedWallet: WalletInfo | null = null;
  private eventListeners: Map<WalletEvent, Array<(...args: any[]) => void>> = new Map();
  
  constructor() {
    this.initializeProviders();
  }

  /**
   * Initialize wallet providers
   */
  private initializeProviders(): void {
    // Ethereum wallet providers
    this.walletProviders.set(WalletProviderType.METAMASK, new MetaMaskProvider());
    this.walletProviders.set(WalletProviderType.WALLETCONNECT, new WalletConnectProvider());
    this.walletProviders.set(WalletProviderType.BINANCE, new BinanceWalletProvider());
    this.walletProviders.set(WalletProviderType.TRUST, new TrustWalletProvider());
    
    // Solana wallet providers
    this.walletProviders.set(WalletProviderType.PHANTOM, new PhantomProvider());
    this.walletProviders.set(WalletProviderType.SOLFLARE, new SolflareProvider());
    
    // TON wallet providers
    this.walletProviders.set(WalletProviderType.TONKEEPER, new TonKeeperProvider());
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

    // Check MetaMask
    const metamaskProvider = this.walletProviders.get(WalletProviderType.METAMASK) as MetaMaskProvider;
    if (metamaskProvider) {
      this.availableWallets.push({
        name: 'MetaMask',
        providerType: WalletProviderType.METAMASK,
        blockchain: BlockchainType.ETHEREUM,
        icon: '/assets/wallets/metamask.svg',
        installed: metamaskProvider.isAvailable?.() ?? false,
        provider: metamaskProvider
      });
    }

    // Check Binance Wallet
    const binanceProvider = this.walletProviders.get(WalletProviderType.BINANCE) as BinanceWalletProvider;
    if (binanceProvider) {
      this.availableWallets.push({
        name: 'Binance Wallet',
        providerType: WalletProviderType.BINANCE,
        blockchain: BlockchainType.BINANCE,
        icon: '/assets/wallets/binance.svg',
        installed: binanceProvider.isAvailable?.() ?? false,
        provider: binanceProvider
      });
    }
    
    // Check Trust Wallet
    const trustWalletProvider = this.walletProviders.get(WalletProviderType.TRUST) as TrustWalletProvider;
    if (trustWalletProvider) {
      this.availableWallets.push({
        name: 'Trust Wallet',
        providerType: WalletProviderType.TRUST,
        blockchain: BlockchainType.ETHEREUM,
        icon: '/assets/wallets/trust.svg',
        installed: trustWalletProvider.isAvailable?.() ?? false,
        provider: trustWalletProvider
      });
    }

    // Check Phantom
    const phantomProvider = this.walletProviders.get(WalletProviderType.PHANTOM) as PhantomProvider;
    if (phantomProvider) {
      this.availableWallets.push({
        name: 'Phantom',
        providerType: WalletProviderType.PHANTOM,
        blockchain: BlockchainType.SOLANA,
        icon: '/assets/wallets/phantom.svg',
        installed: phantomProvider.isAvailable?.() ?? false,
        provider: phantomProvider
      });
    }

    // Check Solflare
    const solflareProvider = this.walletProviders.get(WalletProviderType.SOLFLARE) as SolflareProvider;
    if (solflareProvider) {
      this.availableWallets.push({
        name: 'Solflare',
        providerType: WalletProviderType.SOLFLARE,
        blockchain: BlockchainType.SOLANA,
        icon: '/assets/wallets/solflare.svg',
        installed: solflareProvider.isAvailable?.() ?? false,
        provider: solflareProvider
      });
    }

    // Check TONKeeper
    const tonkeeperProvider = this.walletProviders.get(WalletProviderType.TONKEEPER) as TonKeeperProvider;
    if (tonkeeperProvider) {
      this.availableWallets.push({
        name: 'TONKeeper',
        providerType: WalletProviderType.TONKEEPER,
        blockchain: BlockchainType.TON,
        icon: '/assets/wallets/tonkeeper.svg',
        installed: tonkeeperProvider.isAvailable?.() ?? false,
        provider: tonkeeperProvider
      });
    }

    // Always add WalletConnect as it works without installation
    this.availableWallets.push({
      name: 'WalletConnect',
      providerType: WalletProviderType.WALLETCONNECT,
      blockchain: BlockchainType.ETHEREUM,
      icon: '/assets/wallets/walletconnect.svg',
      installed: true, // Always available as it's a QR code connect
      provider: this.walletProviders.get(WalletProviderType.WALLETCONNECT) as WalletProvider
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
      const result = await provider.connect();
      
      if (result.success && result.walletInfo) {
        this.lastConnectedWallet = result.walletInfo;
        
        // Store the wallet information in local storage
        localStorage.setItem('lastConnectedWalletType', providerType);

        // Emit connected event
        this.emit(WalletEvent.CONNECTED, result.walletInfo);
        
        return result;
      }
      
      return result;
    } catch (error: any) {
      // Emit error event
      this.emit(WalletEvent.ERROR, error?.message || `Failed to connect to ${providerType} wallet`);
      
      return {
        success: false,
        error: error?.message || `Failed to connect to ${providerType} wallet`
      };
    }
  }

  /**
   * Connect to the last used wallet if available
   * @returns Connection result or null if no last wallet
   */
  public async connectToLastWallet(): Promise<WalletConnectionResult | null> {
    const lastWalletType = localStorage.getItem('lastConnectedWalletType');
    
    if (!lastWalletType) {
      return null;
    }
    
    const providerType = lastWalletType as WalletProviderType;
    const provider = this.walletProviders.get(providerType);
    
    if (!provider) {
      return null;
    }
    
    return await this.connectWallet(providerType);
  }

  /**
   * Disconnect from the current wallet
   * @returns Whether the disconnection was successful
   */
  public async disconnectWallet(providerType?: WalletProviderType): Promise<boolean> {
    if (providerType) {
      const provider = this.walletProviders.get(providerType);
      if (provider) {
        const result = await provider.disconnect();
        if (result) {
          // Emit disconnected event
          this.emit(WalletEvent.DISCONNECTED);
        }
        return result;
      }
      return false;
    } else if (this.lastConnectedWallet) {
      const provider = this.walletProviders.get(this.lastConnectedWallet.providerType);
      if (provider) {
        const result = await provider.disconnect();
        if (result) {
          this.lastConnectedWallet = null;
          localStorage.removeItem('lastConnectedWalletType');
          
          // Emit disconnected event
          this.emit(WalletEvent.DISCONNECTED);
        }
        return result;
      }
    }
    return true;
  }

  /**
   * Sign a message with the current wallet
   * @param message The message to sign
   * @param walletInfo Optional wallet info to use instead of the current wallet
   * @returns The signature result
   */
  public async signMessage(message: string, walletInfo?: WalletInfo): Promise<{success: boolean; signature?: string; error?: string}> {
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
    
    return await provider.signMessage(message, activeWalletInfo.address);
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
   * Switch to a different network
   * @param chainId The chain ID to switch to
   * @param providerType Optional provider type to use
   * @returns Whether the switch was successful
   */
  public async switchNetwork(chainId: string, providerType?: WalletProviderType): Promise<boolean> {
    let provider: WalletProvider | undefined;
    
    if (providerType) {
      provider = this.walletProviders.get(providerType);
    } else if (this.lastConnectedWallet) {
      provider = this.walletProviders.get(this.lastConnectedWallet.providerType);
    }
    
    if (!provider || !provider.switchNetwork) {
      return false;
    }
    
    try {
      const result = await provider.switchNetwork(chainId);
      if (result && this.lastConnectedWallet) {
        // Update chain ID in wallet info
        this.lastConnectedWallet = {
          ...this.lastConnectedWallet,
          chainId
        };
        
        // Emit chain changed event
        this.emit(WalletEvent.CHAIN_CHANGED, chainId);
      }
      return result;
    } catch (error) {
      console.error('Failed to switch network:', error);
      return false;
    }
  }
}

export default WalletSelector;
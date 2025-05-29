/**
 * TONKeeper Wallet Provider
 * 
 * This provider handles interactions with the TONKeeper wallet
 */
import {
  BlockchainType,
  SignMessageResult,
  WalletConnectionResult,
  WalletInfo,
  WalletProvider,
  WalletProviderType
} from "../../core/walletBase";

// Define the TonConnect interface for TypeScript
declare global {
  interface Window {
    tonkeeper?: {
      isTonkeeper?: boolean;
      ready?: boolean;
      version?: string;
      isWalletBrowser?: boolean;
      connect: (options: any) => Promise<any>;
      disconnect: () => Promise<void>;
      restoreConnection: () => Promise<any>;
      bindEvents: (handlers: Record<string, (e: any) => void>) => void;
      sign: (params: any) => Promise<any>;
    };
  }
}

export class TonKeeperProvider implements WalletProvider {
  private isInitialized: boolean = false;
  private address: string | null = null;
  private provider: any = null;

  constructor() {
    this.checkProvider();
  }

  /**
   * Check if TONKeeper wallet is available
   */
  private checkProvider(): boolean {
    if (typeof window !== 'undefined' && window.tonkeeper) {
      this.provider = window.tonkeeper;
      return true;
    }
    return false;
  }

  /**
   * Check if TONKeeper is available in the browser
   */
  public isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.tonkeeper;
  }

  /**
   * Connect to TONKeeper wallet
   */
  async connect(): Promise<WalletConnectionResult> {
    if (!this.checkProvider()) {
      return {
        success: false,
        error: 'TONKeeper wallet is not installed'
      };
    }

    try {
      // Attempt to connect to TONKeeper
      const connectionResult = await this.provider.connect({
        manifestUrl: 'https://yourapp.com/tonconnect-manifest.json' // Replace with your actual manifest URL
      });

      // Get the wallet address
      if (!connectionResult?.account?.address) {
        return {
          success: false,
          error: 'Failed to get wallet address'
        };
      }

      this.address = connectionResult.account.address;
      this.isInitialized = true;

      // Set up event listeners for wallet events
      this.provider.bindEvents({
        accountsChanged: (accounts: any) => {
          this.address = accounts.length > 0 ? accounts[0].address : null;
        },
        disconnect: () => {
          this.address = null;
          this.isInitialized = false;
        }
      });

      const walletInfo: WalletInfo = {
        address: this.address || '',  // Ensure address is never null
        chainId: connectionResult.account.chain || 'mainnet',
        blockchain: BlockchainType.TON,
        providerType: WalletProviderType.TONKEEPER,
        provider: this.provider
      };

      return {
        success: true,
        walletInfo,
        provider: this.provider
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to connect to TONKeeper'
      };
    }
  }

  /**
   * Disconnect from TONKeeper wallet
   */
  async disconnect(): Promise<boolean> {
    if (!this.provider) {
      return true; // Already disconnected
    }

    try {
      await this.provider.disconnect();
      this.address = null;
      this.isInitialized = false;
      return true;
    } catch (error) {
      console.error('Error disconnecting TONKeeper:', error);
      return false;
    }
  }

  /**
   * Sign a message with TONKeeper wallet
   */
  async signMessage(message: string, address: string): Promise<SignMessageResult> {
    if (!this.isInitialized || !this.provider) {
      return {
        success: false,
        error: 'TONKeeper wallet is not connected'
      };
    }

    try {
      const result = await this.provider.sign({
        data: message
      });

      if (!result || !result.signature) {
        return {
          success: false,
          error: 'Failed to get signature from TONKeeper'
        };
      }

      return {
        success: true,
        signature: result.signature
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to sign message with TONKeeper'
      };
    }
  }

  /**
   * Check if wallet is connected
   */
  isConnected(): boolean {
    return this.isInitialized && !!this.address;
  }

  /**
   * Get the provider instance
   */
  getProvider(): any {
    return this.provider;
  }
}

export default TonKeeperProvider;
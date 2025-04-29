/**
 * Solflare Wallet Provider
 * 
 * This provider handles interactions with the Solflare wallet for Solana
 */
import {
  BlockchainType,
  SignMessageResult,
  WalletConnectionResult,
  WalletInfo,
  WalletProvider,
  WalletProviderType
} from '../../core/wallet-base';

// Define Solflare wallet types for TypeScript
declare global {
  interface Window {
    solflare?: {
      isSolflare: boolean;
      connect: () => Promise<{ publicKey: { toString: () => string } }>;
      disconnect: () => Promise<void>;
      signMessage: (message: Uint8Array, encoding: string) => Promise<{ signature: Uint8Array }>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      off: (event: string, callback: (...args: any[]) => void) => void;
      request: (method: any, params: any) => Promise<any>;
      publicKey: { toString: () => string } | null;
    };
  }
}

export class SolflareProvider implements WalletProvider {
  private isInitialized: boolean = false;
  private address: string | null = null;
  private provider: any = null;

  constructor() {
    this.checkProvider();
  }

  /**
   * Check if Solflare wallet is available
   */
  private checkProvider(): boolean {
    if (typeof window !== 'undefined' && window.solflare?.isSolflare) {
      this.provider = window.solflare;
      return true;
    }
    return false;
  }

  /**
   * Check if Solflare is available in the browser
   */
  public isAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.solflare?.isSolflare;
  }

  /**
   * Connect to Solflare wallet
   */
  async connect(): Promise<WalletConnectionResult> {
    if (!this.checkProvider()) {
      return {
        success: false,
        error: 'Solflare wallet is not installed'
      };
    }

    try {
      // Attempt to connect to Solflare
      const response = await this.provider.connect();
      
      if (!response.publicKey) {
        return {
          success: false,
          error: 'Failed to connect to Solflare wallet'
        };
      }

      // Save the address
      this.address = response.publicKey.toString();
      this.isInitialized = true;

      // Setup event listeners
      this.provider.on('disconnect', () => {
        this.address = null;
        this.isInitialized = false;
      });

      this.provider.on('accountChanged', (publicKey: any) => {
        if (publicKey) {
          this.address = publicKey.toString();
        } else {
          this.address = null;
        }
      });

      const walletInfo: WalletInfo = {
        address: this.address || '',  // Ensure address is never null
        chainId: 'mainnet-beta', // Solana mainnet
        blockchain: BlockchainType.SOLANA,
        providerType: WalletProviderType.SOLFLARE,
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
        error: error?.message || 'Failed to connect to Solflare wallet'
      };
    }
  }

  /**
   * Disconnect from Solflare wallet
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
      console.error('Error disconnecting Solflare wallet:', error);
      return false;
    }
  }

  /**
   * Sign a message with Solflare wallet
   * @param message The message to sign
   * @param address The wallet address
   */
  async signMessage(message: string, address: string): Promise<SignMessageResult> {
    if (!this.isInitialized || !this.provider) {
      return {
        success: false,
        error: 'Solflare wallet is not connected'
      };
    }

    try {
      // Convert string message to Uint8Array for Solana
      const encodedMessage = new TextEncoder().encode(message);
      
      const { signature } = await this.provider.signMessage(encodedMessage, 'utf8');
      
      // Convert the signature Uint8Array to a base64 string for transport
      const signatureBase64 = btoa(
        String.fromCharCode.apply(null, Array.from(signature))
      );

      return {
        success: true,
        signature: signatureBase64
      };
    } catch (error: any) {
      return {
        success: false,
        error: error?.message || 'Failed to sign message with Solflare wallet'
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

export default SolflareProvider;
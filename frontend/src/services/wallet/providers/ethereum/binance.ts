/**
 * Binance Chain Wallet Provider
 * 
 * This provider handles interactions with the Binance Chain Wallet browser extension
 */
import { ethers } from 'ethers';
import { BlockchainType, SignMessageResult, WalletConnectionResult, WalletInfo, WalletProvider, WalletProviderType } from "../../core/walletBase";

export class BinanceWalletProvider implements WalletProvider {
  private provider: any;
  private initialized: boolean = false;
  private currentWalletInfo: WalletInfo | null = null;
  private initializationPromise: Promise<boolean> | null = null;

  constructor() {
    // Safe access to window object to prevent SSR errors
    if (typeof window !== 'undefined') {
      this.provider = window.BinanceChain || (window as any).ethereum?.isBinanceChain && (window as any).ethereum;
    } else {
      this.provider = null;
    }
  }

  /**
   * Initialize the Binance wallet provider
   * @returns {Promise<boolean>} Whether initialization was successful
   */
  async initialize(): Promise<boolean> {
    // If already initializing, return the existing promise
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    // Start new initialization process
    this.initializationPromise = new Promise<boolean>((resolve) => {
      try {
        if (typeof window === 'undefined') {
          this.initialized = false;
          resolve(false);
          return;
        }
        
        // First, check if the provider exists
        if (!window.BinanceChain) {
          console.log('Binance Chain Wallet not detected');
          this.initialized = false;
          resolve(false);
          return;
        }
        
        // Create a safe wrapper around the provider to prevent errors
        const originalProvider = window.BinanceChain;
        this.provider = new Proxy(originalProvider, {
          get: (target, prop) => {
            // If the property doesn't exist or is null, return a safe default
            if (target[prop] === null || target[prop] === undefined) {
              if (typeof prop === 'string' && prop.startsWith('on')) {
                // Return no-op function for event handlers
                return () => {};
              }
              
              if (prop === 'request') {
                // Return a safe request method
                return async (args: any) => {
                  try {
                    if (target.request) {
                      return await target.request(args);
                    }
                    throw new Error('Method not available');
                  } catch (err) {
                    console.error(`Error calling ${args.method}:`, err);
                    throw err;
                  }
                };
              }
              
              return undefined;
            }
            return target[prop];
          }
        });
        
        this.initialized = true;
        resolve(true);
      } catch (error) {
        console.error('Failed to initialize Binance wallet provider:', error);
        this.initialized = false;
        resolve(false);
      } finally {
        // Reset the promise to allow retrying initialization if needed
        setTimeout(() => {
          this.initializationPromise = null;
        }, 1000);
      }
    });
    
    return this.initializationPromise;
  }

  /**
   * Check if the Binance wallet extension is installed
   * @returns {boolean} Whether the extension is installed
   */
  isAvailable(): boolean {
    // Check if window is defined first
    if (typeof window === 'undefined') return false;
    return !!this.provider;
  }

  /**
   * Connect to the Binance wallet and get accounts
   * @returns {Promise<WalletConnectionResult>} Connection result with wallet info
   */
  async connect(): Promise<WalletConnectionResult> {
    try {
      if (!this.provider) {
        return {
          success: false,
          error: 'Binance wallet provider not available'
        };
      }

      let accounts: string[] = [];
      
      // For Binance Chain Wallet, we need to use enable() instead of eth_requestAccounts
      try {
        // Try the enable method first (preferred for Binance)
        if (typeof this.provider.enable === 'function') {
          accounts = await this.provider.enable();
        } 
        // Fall back to standard methods if enable is not available
        else if (typeof this.provider.request === 'function') {
          accounts = await this.provider.request({ method: 'eth_requestAccounts' });
        } 
        // Try other possible methods
        else if (typeof this.provider.requestAccounts === 'function') {
          accounts = await this.provider.requestAccounts();
        } else {
          throw new Error('No supported method to request accounts');
        }
      } catch (requestError) {
        console.error('Failed to connect Binance wallet:', requestError);
        throw requestError;
      }
      
      // Check if we have any accounts
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts found'
        };
      }

      // Get the selected address
      const address = accounts[0];

      // For Binance Chain wallet, we don't need to get the chainId
      // We'll use a hardcoded value since we know it's Binance
      const chainId = '0x38'; // BSC Mainnet
      
      this.currentWalletInfo = {
        address,
        chainId,
        provider: this.provider,
        blockchain: BlockchainType.BINANCE,
        providerType: WalletProviderType.BINANCE
      };

      return {
        success: true,
        walletInfo: this.currentWalletInfo,
        provider: this.provider
      };
    } catch (error: any) {
      console.error('Error connecting to Binance wallet:', error);
      return {
        success: false,
        error: error.message || 'Failed to connect to Binance wallet'
      };
    }
  }

  /**
   * Disconnect from the wallet
   * @returns {Promise<boolean>} Whether disconnection was successful
   */
  async disconnect(): Promise<boolean> {
    this.currentWalletInfo = null;
    return true;
  }

  /**
   * Check if wallet is connected
   * @returns {boolean} Whether the wallet is connected
   */
  isConnected(): boolean {
    try {
      // For Binance, check if we have a current wallet info
      return !!this.currentWalletInfo || 
             !!this.provider?.selectedAddress || 
             (typeof this.provider?.isConnected === 'function' && this.provider.isConnected());
    } catch (error) {
      return false;
    }
  }

  /**
   * Get the provider instance
   * @returns {any} The provider instance
   */
  getProvider(): any {
    return this.provider;
  }

  /**
   * Get the current connected accounts
   * @returns {Promise<string[]>} Array of wallet addresses
   */
  async getAccounts(): Promise<string[]> {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) {
        throw new Error('Binance wallet provider not initialized');
      }
    }

    try {
      // For Binance Chain Wallet, we need to use its specific API
      if (this.currentWalletInfo?.address) {
        // If we already have the address, return it
        return [this.currentWalletInfo.address];
      }
      
      // If we don't have the address yet, try to get it using the Binance API
      if (typeof this.provider.enable === 'function') {
        const accounts = await this.provider.enable();
        return accounts || [];
      }
      
      // Fall back to standard method
      if (typeof this.provider.request === 'function') {
        const accounts = await this.provider.request({ method: 'eth_accounts' });
        return accounts || [];
      }
      
      // If we can't get accounts, check if there's a selectedAddress property
      if (this.provider.selectedAddress) {
        return [this.provider.selectedAddress];
      }
      
      return [];
    } catch (error) {
      console.error('Failed to get Binance wallet accounts:', error);
      // Return empty array instead of throwing
      return [];
    }
  }

  /**
   * Sign a message using various methods with fallbacks
   * @param {string} message The message to sign
   * @param {string} address The wallet address (optional)
   * @returns {Promise<SignMessageResult>} The signature result
   */
  async signMessage(message: string, address?: string): Promise<SignMessageResult> {
    try {
      if (!this.provider) {
        return {
          success: false,
          error: 'Binance wallet provider not available'
        };
      }

      // Get the address if not provided
      if (!address) {
        // Try to use the current wallet info first
        if (this.currentWalletInfo?.address) {
          address = this.currentWalletInfo.address;
        } else {
          try {
            const accounts = await this.getAccounts();
            if (accounts.length === 0) {
              return {
                success: false,
                error: 'No accounts found in Binance wallet'
              };
            }
            address = accounts[0];
          } catch (error) {
            console.error('Failed to get accounts for signing:', error);
            return {
              success: false,
              error: 'Could not get account address for signing'
            };
          }
        }
      }

      // Binance Chain Wallet only supports signMessage method
      // Try Binance-specific method first
      if (typeof this.provider.signMessage === 'function') {
        try {
          const signature = await this.provider.signMessage(address, message);
          return {
            success: true,
            signature
          };
        } catch (signMessageError) {
          console.warn('Binance signMessage failed:', signMessageError);
        }
      }

      // Try personal_sign next (standard method)
      try {
        const signature = await this.provider.request({
          method: 'personal_sign',
          params: [message, address]
        });

        return {
          success: true,
          signature
        };
      } catch (personalSignError) {
        console.warn('personal_sign failed, trying alternative methods:', personalSignError);
        
        // Try manual hash signing as last resort
        try {
          // Convert message to hex if needed
          const messageHex = ethers.utils.isHexString(message) ? message : 
            ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message));
          
          const signature = await this.provider.request({
            method: 'eth_sign',
            params: [address, messageHex]
          });

          return {
            success: true,
            signature
          };
        } catch (ethSignError) {
          console.error('All signing methods failed:', ethSignError);
          throw new Error('Failed to sign message with Binance wallet. Please try another wallet or contact support.');
        }
      }
    } catch (error: any) {
      console.error('Error signing message with Binance wallet:', error);
      return {
        success: false,
        error: error.message || 'Failed to sign message with Binance wallet'
      };
    }
  }

  /**
   * Switch to a different network
   * @param {string} chainId The chain ID to switch to
   * @returns {Promise<boolean>} Whether the switch was successful
   */
  async switchNetwork(chainId: string): Promise<boolean> {
    if (!this.provider) return false;

    try {
      // Binance Chain Wallet doesn't support network switching
      // Always return true for BNB chainId or false for others
      return chainId === '0x38'; // BSC Mainnet
    } catch (error) {
      console.error('Failed to switch network on Binance wallet:', error);
      return false;
    }
  }
}

// Extend Window interface to include Binance Chain Wallet
declare global {
  interface Window {
    BinanceChain?: any;
  }
}

export default BinanceWalletProvider;
/**
 * Binance Chain Wallet Provider
 * 
 * This provider handles interactions with the Binance Chain Wallet browser extension
 */
import { ethers } from 'ethers';
import { BlockchainType, SignMessageResult, WalletConnectionResult, WalletInfo, WalletProvider, WalletProviderType } from '../../core/wallet-base';

export class BinanceWalletProvider implements WalletProvider {
  private provider: any;
  private initialized: boolean = false;
  private currentWalletInfo: WalletInfo | null = null;
  private initializationPromise: Promise<boolean> | null = null;

  constructor() {
    this.provider = null;
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
    return typeof window !== 'undefined' && Boolean(window.BinanceChain);
  }

  /**
   * Connect to the Binance wallet and get accounts
   * @returns {Promise<WalletConnectionResult>} Connection result with wallet info
   */
  async connect(): Promise<WalletConnectionResult> {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) {
        return {
          success: false,
          error: 'Binance wallet provider not initialized'
        };
      }
    }

    try {
      // Make sure the provider is defined before making requests
      if (!this.provider) {
        return {
          success: false,
          error: 'Binance wallet provider not available'
        };
      }

      const accounts = await this.provider.request({ method: 'eth_requestAccounts' });
      if (!accounts || accounts.length === 0) {
        return {
          success: false,
          error: 'No accounts found in Binance wallet'
        };
      }

      const address = accounts[0];
      const chainId = await this.provider.request({ method: 'eth_chainId' });
      
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
      console.error('Failed to connect to Binance wallet:', error);
      return {
        success: false,
        error: error?.message || 'Failed to connect to Binance wallet'
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
    return !!this.currentWalletInfo;
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
      const accounts = await this.provider.request({ method: 'eth_accounts' });
      return accounts || [];
    } catch (error) {
      console.error('Failed to get Binance wallet accounts:', error);
      throw error;
    }
  }

  /**
   * Sign a message using various methods with fallbacks
   * @param {string} message The message to sign
   * @param {string} address The wallet address (optional)
   * @returns {Promise<SignMessageResult>} The signature result
   */
  async signMessage(message: string, address?: string): Promise<SignMessageResult> {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) {
        return {
          success: false,
          error: 'Binance wallet provider not initialized'
        };
      }
    }

    try {
      // Get the address if not provided
      if (!address) {
        const accounts = await this.getAccounts();
        if (accounts.length === 0) {
          return {
            success: false,
            error: 'No accounts found in Binance wallet'
          };
        }
        address = accounts[0];
      }

      // Try personal_sign first
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
        console.warn('Binance wallet personal_sign failed, trying eth_sign...', personalSignError);
        
        // Fallback to eth_sign
        try {
          const signature = await this.provider.request({
            method: 'eth_sign',
            params: [address, ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message))]
          });
          return {
            success: true,
            signature
          };
        } catch (ethSignError) {
          console.warn('Binance wallet eth_sign failed, trying signMessage...', ethSignError);
          
          // Last attempt with any custom methods Binance might have
          try {
            // Some wallets have a direct signMessage API
            if (typeof this.provider.signMessage === 'function') {
              const signature = await this.provider.signMessage(message);
              return {
                success: true,
                signature
              };
            }
            
            return {
              success: false,
              error: 'No supported signing method available in Binance wallet'
            };
          } catch (finalError: any) {
            console.error('All Binance wallet signing methods failed', finalError);
            return {
              success: false,
              error: finalError?.message || 'Failed to sign message with Binance wallet'
            };
          }
        }
      }
    } catch (error: any) {
      console.error('Error signing message with Binance wallet:', error);
      return {
        success: false,
        error: error?.message || 'Error signing message with Binance wallet'
      };
    }
  }

  /**
   * Switch to a different network
   * @param {string} chainId The chain ID to switch to
   * @returns {Promise<boolean>} Whether the switch was successful
   */
  async switchNetwork(chainId: string): Promise<boolean> {
    if (!this.initialized) {
      const success = await this.initialize();
      if (!success) {
        return false;
      }
    }

    try {
      await this.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId }]
      });
      return true;
    } catch (error) {
      console.error('Failed to switch network in Binance wallet:', error);
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
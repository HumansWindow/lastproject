import { apiClient } from '@/services/api/api-client';
import { WalletAuthResponse, WalletConnectResponse, WalletInfo } from '@/types/api-types';
import { BinanceWalletProvider } from './providers/binance/binance-provider';
import { MessageFormatter } from './utils/message-formatter';
import { secureStorage } from '@/utils/secure-storage';

// Constants for storage keys
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const WALLET_ADDRESS_KEY = 'walletAddress';

export class WalletService {
  // Binance wallet provider instance
  private static binanceProvider: BinanceWalletProvider | null = null;

  /**
   * Get the Binance wallet provider (lazy initialization)
   */
  private static getBinanceProvider(): BinanceWalletProvider {
    this.binanceProvider ??= new BinanceWalletProvider();
    return this.binanceProvider;
  }

  /**
   * Detect if Binance wallet extension is available
   */
  private static hasBinanceWallet(): boolean {
    return BinanceWalletProvider.isAvailable();
  }

  /**
   * Connect wallet to get a nonce for signing
   * @param address The wallet address
   * @returns A nonce that needs to be signed
   */
  static async connectWallet(address: string): Promise<WalletConnectResponse> {
    try {
      const response = await apiClient.post('/auth/wallet/connect', { address });
      const completeResponse: WalletConnectResponse = {
        nonce: '',
        success: true,
      };

      if ('nonce' in response.data && typeof response.data.nonce === 'string') {
        completeResponse.nonce = response.data.nonce;
      }

      if ('message' in response.data && typeof response.data.message === 'string') {
        completeResponse.message = MessageFormatter.format(response.data.message);
      } else if ('challenge' in response.data && typeof response.data.challenge === 'string') {
        completeResponse.message = MessageFormatter.format(response.data.challenge);
      } else if (response.data.nonce && !('message' in response.data)) {
        const formattedMessage = MessageFormatter.format(undefined);
        completeResponse.message = formattedMessage;
      }

      return completeResponse;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Sign message using standard Ethereum provider methods
   */
  private static async signWithEthereumProvider(address: string, message: string): Promise<string> {
    const formattedMessage = MessageFormatter.format(message);
    
    try {
      // Method 1: Standard personal_sign
      console.log('Attempting to sign with personal_sign...');
      return await window.ethereum.request({
        method: 'personal_sign',
        params: [formattedMessage, address],
      });
    } catch (personalSignError) {
      console.warn('personal_sign failed, trying eth_sign...', personalSignError);
      
      try {
        // Method 2: Try eth_sign
        return await window.ethereum.request({
          method: 'eth_sign',
          params: [address, formattedMessage],
        });
      } catch (ethSignError) {
        console.warn('eth_sign failed, trying signTypedData...', ethSignError);
        return await this.signWithTypedData(address, formattedMessage);
      }
    }
  }

  /**
   * Sign using EIP-712 typed data
   */
  private static async signWithTypedData(address: string, message: string): Promise<string> {
    const msgParams = JSON.stringify({
      domain: {
        name: 'Authentication',
        version: '1',
      },
      message: {
        content: message,
      },
      primaryType: 'Authentication',
      types: {
        EIP712Domain: [
          { name: 'name', type: 'string' },
          { name: 'version', type: 'string' },
        ],
        Authentication: [
          { name: 'content', type: 'string' },
        ],
      },
    });
    
    try {
      return await window.ethereum.request({
        method: 'eth_signTypedData_v4',
        params: [address, msgParams],
      });
    } catch (error) {
      console.error('signTypedData failed, using recovery...', error);
      return await this.getRecoverySolution(address, message);
    }
  }

  /**
   * Sign message with Binance wallet
   */
  private static async signWithBinanceWallet(message: string): Promise<string> {
    console.log('Using Binance wallet for signing');
    const binanceProvider = this.getBinanceProvider();
    await binanceProvider.initialize();
    
    const accounts = await binanceProvider.getAccounts();
    if (!accounts?.length) {
      throw new Error('No accounts found in Binance wallet');
    }
    
    const address = accounts[0];
    const signResult = await binanceProvider.signMessage(message, address);
    
    if (!signResult.success) {
      throw new Error(signResult.error ?? 'Failed to sign with Binance wallet');
    }
    
    return signResult.signature ?? '';
  }

  /**
   * Sign a message with wallet using multiple methods with fallbacks
   * @param message The message to sign
   * @returns Signature
   */
  static async signMessage(message: string): Promise<string> {
    if (!MessageFormatter.validate(message)) {
      throw new Error('Invalid message format');
    }

    try {
      // Try Binance wallet first if available
      if (this.hasBinanceWallet()) {
        try {
          return await this.signWithBinanceWallet(message);
        } catch (binanceError) {
          console.error('Binance wallet signing failed, trying standard methods:', binanceError);
        }
      }

      // Fall back to standard Ethereum provider
      if (!window?.ethereum) {
        throw new Error('No wallet provider found');
      }

      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (!accounts?.length) {
        throw new Error('No accounts found');
      }

      return await this.signWithEthereumProvider(accounts[0], message);
    } catch (error) {
      console.error('Error in signature process:', error);
      throw new Error(`Failed to sign message: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Complete wallet connection and authentication flow
   * @returns Authentication response
   */
  static async connectAndAuthenticate(): Promise<WalletAuthResponse> {
    try {
      let address: string;
      
      // Check if using Binance wallet
      if (this.hasBinanceWallet()) {
        console.log('Using Binance wallet for authentication');
        const binanceProvider = this.getBinanceProvider();
        await binanceProvider.initialize();
        const accounts = await binanceProvider.getAccounts();
        
        if (!accounts || accounts.length === 0) {
          throw new Error('Failed to get Binance wallet address');
        }
        
        address = accounts[0];
      } else {
        // Standard wallet flow
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('No wallet provider found');
        }
        
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts connected');
        }
        
        address = accounts[0];
      }

      // Get challenge message
      const connectResponse = await this.connectWallet(address);
      if (!connectResponse.message) {
        throw new Error('No challenge message received');
      }

      // Get signature
      const signature = await this.signMessage(connectResponse.message);

      // Authenticate with signature
      const authResponse = await this.authenticateWallet(address, signature, connectResponse.nonce);

      // Save tokens and address
      if (authResponse.token) {
        secureStorage.setItem(TOKEN_KEY, authResponse.token);
      }
      if (authResponse.refreshToken) {
        secureStorage.setItem(REFRESH_TOKEN_KEY, authResponse.refreshToken);
      }
      if (address) {
        secureStorage.setItem(WALLET_ADDRESS_KEY, address);
      }

      return authResponse;
    } catch (error) {
      console.error('Authentication error:', error);
      throw error;
    }
  }

  /**
   * Authenticate with signature
   */
  static async authenticateWallet(
    address: string,
    signature: string,
    nonce: string,
  ): Promise<WalletAuthResponse> {
    try {
      const response = await apiClient.post('/auth/wallet/verify', {
        address,
        signature,
        nonce,
      });

      return response.data;
    } catch (error) {
      console.error('Error in wallet authentication:', error);
      throw error;
    }
  }

  /**
   * Recovery solution when all signing methods fail
   */
  static async getRecoverySolution(address: string, message: string): Promise<string> {
    try {
      const recoveryResponse = await apiClient.post('/auth/wallet/recovery-challenge', {
        address,
        failedMessage: message,
      });
      
      if (recoveryResponse.data?.recoveryToken) {
        return `recovery_token:${recoveryResponse.data.recoveryToken}`;
      }
      
      throw new Error('Unable to get recovery solution');
    } catch (error) {
      console.error('Recovery solution failed:', error);
      throw new Error('Wallet authentication failed. Please try again or use a different wallet.');
    }
  }
}

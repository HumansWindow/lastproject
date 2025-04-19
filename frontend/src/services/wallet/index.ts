import { WalletProviderType, WalletInfo, WalletEvent, BlockchainType } from './core/wallet-base';
import { WalletAuthenticator, AuthResult } from './auth/wallet-auth';
import { WalletConnection } from './core/connection';
import { MetaMaskProvider } from './providers/ethereum/metamask';
import { WalletConnectAdapter } from './providers/ethereum/walletconnect';
import { ChallengeManager } from './auth/challenge';
import { WalletProvider } from './core/wallet-base';

// RPC configuration for WalletConnect
const RPC_URLS = {
  '1': process.env.NEXT_PUBLIC_ETH_MAINNET_RPC || 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
  '137': process.env.NEXT_PUBLIC_POLYGON_RPC || 'https://polygon-mainnet.infura.io/v3/YOUR_INFURA_KEY',
  '56': process.env.NEXT_PUBLIC_BSC_RPC || 'https://bsc-dataseed.binance.org',
  '43114': process.env.NEXT_PUBLIC_AVAX_RPC || 'https://api.avax.network/ext/bc/C/rpc',
  '42161': process.env.NEXT_PUBLIC_ARBITRUM_RPC || 'https://arb1.arbitrum.io/rpc',
  '10': process.env.NEXT_PUBLIC_OPTIMISM_RPC || 'https://mainnet.optimism.io'
};

// API base URL for authentication
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';

class WalletService {
  private authService: WalletAuthenticator;
  private walletConnection: WalletConnection;
  private providers: Partial<Record<WalletProviderType, WalletProvider>>;
  private challengeManager: ChallengeManager;
  private debugLogs: string[] = [];
  private debugEnabled: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    // Initialize the auth property with API base URL
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001';
    this.authService = new WalletAuthenticator(apiBaseUrl);

    // Create wallet connection instance
    this.walletConnection = new WalletConnection();

    // Fix the providers object to match the enum
    this.providers = {
      [WalletProviderType.METAMASK]: new MetaMaskProvider(),
      [WalletProviderType.WALLETCONNECT]: new WalletConnectAdapter({
        1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
        56: 'https://bsc-dataseed.binance.org/',
        137: 'https://polygon-rpc.com'
      }),
      // Add placeholder implementations or stub providers for other types
      // [WalletProviderType.COINBASE]: new CoinbaseProvider(), // Not implemented yet
      // [WalletProviderType.TRUST]: new TrustProvider(), // Not implemented yet
      // [WalletProviderType.PHANTOM]: new PhantomProvider(), // Not implemented yet
      // [WalletProviderType.BINANCE]: new BinanceProvider(), // Not implemented yet
    };

    // Create challenge manager
    this.challengeManager = new ChallengeManager(this.walletConnection, this.authService);

    // Initialize debug log
    this.logDebug('WalletService initialized');
  }

  // Getter for accessing the authenticator
  get authenticator(): WalletAuthenticator {
    return this.authService;
  }

  async connect(providerType: WalletProviderType): Promise<WalletInfo | null> {
    const provider = this.providers[providerType as keyof typeof this.providers];
    if (!provider) {
      throw new Error(`Provider ${providerType} is not supported`);
    }
    return await this.walletConnection.connect(provider);
  }

  async disconnect(): Promise<boolean> {
    return await this.walletConnection.disconnect();
  }

  isConnected(): boolean {
    return this.walletConnection.isConnected();
  }

  getWalletInfo(): WalletInfo | null {
    return this.walletConnection.getWalletInfo();
  }

  // Expose authentication methods directly
  async getChallenge(address: string): Promise<string> {
    this.logDebug(`Getting challenge for address: ${address}`);
    try {
      const challengeObj = await this.authService.getAuthChallenge(address);
      const challenge = challengeObj.challenge;
      this.logDebug(`Challenge received: ${challenge.substring(0, 20)}...`);
      return challenge;
    } catch (error) {
      this.logDebug(`Error getting challenge: ${error instanceof Error ? error.message : String(error)}`, true);
      throw error;
    }
  }

  async authenticate(
    walletInfo: WalletInfo,
    signature: string,
    nonce: string,
    email?: string,
    deviceFingerprint?: string
  ): Promise<AuthResult> {
    this.logDebug(`Authenticating with signature: ${signature.substring(0, 15)}...`);
    this.logDebug(`Wallet Info: ${walletInfo.address}, Chain ID: ${walletInfo.chainId}`);
    
    try {
      const authResult = await this.authService.authenticate(walletInfo, signature, nonce, email, deviceFingerprint);
      this.logDebug(`Authentication successful, token received: ${
        'accessToken' in authResult 
          ? (authResult as any).accessToken.substring(0, 15) + '...' 
          : 'token structure differs from expected'
      }`);
      return authResult;
    } catch (error) {
      this.logDebug(`Authentication error: ${error instanceof Error ? error.message : String(error)}`, true);
      throw error;
    }
  }

  async refreshToken(refreshToken: string, deviceFingerprint?: string): Promise<AuthResult> {
    this.logDebug(`Refreshing token: ${refreshToken.substring(0, 15)}...`);
    try {
      const authResult = await this.authService.refreshToken(refreshToken, deviceFingerprint);
      this.logDebug(`Token refreshed successfully`);
      return authResult;
    } catch (error) {
      this.logDebug(`Token refresh error: ${error instanceof Error ? error.message : String(error)}`, true);
      throw error;
    }
  }

  async logout(refreshToken: string): Promise<boolean> {
    return this.authService.logout(refreshToken);
  }

  on(event: WalletEvent, listener: (...args: any[]) => void): void {
    this.walletConnection.on(event as WalletEvent, listener);
  }

  off(event: WalletEvent, listener: (...args: any[]) => void): void {
    this.walletConnection.off(event, listener);
  }

  async switchNetwork(chainId: string, providerType: WalletProviderType): Promise<boolean> {
    const provider = this.providers[providerType as keyof typeof this.providers];
    if (!provider || !provider.switchNetwork) {
      return false;
    }
    return await provider.switchNetwork(chainId);
  }

  async signMessage(message: string, walletInfo: WalletInfo): Promise<string> {
    this.logDebug(`Requesting signature for message: ${message.substring(0, 30)}...`);
    
    if (!walletInfo || !walletInfo.provider) {
      this.logDebug('No wallet connected', true);
      throw new Error('No wallet connected');
    }

    if (!message) {
      this.logDebug('Empty message provided for signing', true);
      throw new Error('Cannot sign an empty message');
    }

    try {
      // Ensure the message is properly formatted for Ethereum signing
      const formattedMessage = message.startsWith('\x19Ethereum Signed Message:') 
        ? message 
        : message;
      
      this.logDebug(`Formatted message for signing: ${formattedMessage.substring(0, 30)}...`);
      
      // Different wallet providers have different methods for signing
      if (walletInfo.provider.request) {
        try {
          // Important fix: Always use the connected wallet address
          // instead of requesting accounts which might return a different account
          const from = walletInfo.address;
          this.logDebug(`Using account for signing: ${from}`);

          // Most providers use personal_sign
          this.logDebug('Prompting wallet for signature...');
          
          // Add timeout protection for wallet requests that might hang
          const timeoutPromise = new Promise<never>((_, reject) => {
            setTimeout(() => reject(new Error('Wallet signature request timed out after 60 seconds')), 60000);
          });
          
          // Create the signature request promise
          const signaturePromise = walletInfo.provider.request({
            method: 'personal_sign',
            params: [formattedMessage, from]
          });
          
          // Race the signature request against the timeout
          const signature = await Promise.race([signaturePromise, timeoutPromise]);
          
          if (!signature) {
            this.logDebug('Empty signature returned from wallet', true);
            throw new Error('No signature returned from wallet');
          }

          this.logDebug(`Signature received: ${signature.substring(0, 15)}...`);
          return signature;
        } catch (err) {
          // Improved error handling with better error visualization
          let errorMessage = 'Unknown error';
          
          if (err instanceof Error) {
            errorMessage = err.message;
          } else if (typeof err === 'object' && err !== null) {
            try {
              // Properly stringify error objects
              errorMessage = JSON.stringify(err);
            } catch (e) {
              // If circular reference, try to extract useful properties
              const errObj = err as any;
              errorMessage = `Error Code: ${errObj.code || 'unknown'}, Message: ${errObj.message || 'No message'}`;
            }
          } else {
            errorMessage = String(err);
          }
          
          this.logDebug(`Provider request error: ${errorMessage}`, true);
          
          // Detect wallet rejection patterns across different providers
          if (typeof errorMessage === 'string' && (
              errorMessage.includes('user rejected') || 
              errorMessage.includes('User denied') || 
              errorMessage.includes('user denied') ||
              errorMessage.includes('rejected') ||
              errorMessage.toLowerCase().includes('canceled') ||
              errorMessage.toLowerCase().includes('cancelled') ||
              errorMessage.includes('User rejected')
            )) {
            this.logDebug('User rejected the signature request', true);
            throw new Error('User denied message signature');
          }
          
          // Detect connection errors
          if (typeof errorMessage === 'string' && (
              errorMessage.includes('disconnected') ||
              errorMessage.includes('network') ||
              errorMessage.includes('connection')
            )) {
            this.logDebug('Wallet connection error during signing', true);
            throw new Error('Wallet connection error. Please check your wallet and try again.');
          }
          
          // Rethrow with more context
          throw new Error(`Failed to sign message: ${errorMessage}`);
        }
      } else if (walletInfo.provider.send) {
        // Fallback for older providers that use send instead of request
        this.logDebug('Using legacy provider.send method for signing');
        
        return new Promise((resolve, reject) => {
          // Add a timeout for the legacy method as well
          const timeoutId = setTimeout(() => {
            reject(new Error('Wallet signature request timed out after 60 seconds'));
          }, 60000);
          
          walletInfo.provider.send(
            {
              method: 'personal_sign',
              params: [formattedMessage, walletInfo.address]
            },
            (err: Error, response: { result: string }) => {
              clearTimeout(timeoutId);
              
              if (err) {
                this.logDebug(`Legacy signing error: ${err.message}`, true);
                
                // Check for user rejection in legacy errors
                if (err.message?.includes('User denied') || err.message?.includes('rejected')) {
                  return reject(new Error('User denied message signature'));
                }
                
                return reject(new Error(`Signing error: ${err.message}`));
              }
              
              if (!response || !response.result) {
                this.logDebug('No signature result returned from legacy method', true);
                return reject(new Error('No signature result returned'));
              }
              
              this.logDebug(`Legacy signature received: ${response.result.substring(0, 15)}...`);
              resolve(response.result);
            }
          );
        });
      } else if (walletInfo.provider.signMessage || (walletInfo.provider as any).ethSign) {
        // Handle specialized wallet providers
        this.logDebug('Using provider-specific signing method');
        
        try {
          // Try native signMessage method first (common in some mobile wallets)
          if (walletInfo.provider.signMessage) {
            const signature = await walletInfo.provider.signMessage(formattedMessage, walletInfo.address);
            this.logDebug(`Native signature received: ${signature.substring(0, 15)}...`);
            return signature;
          } 
          
          // Try ethSign as fallback (some less common wallets)
          if ((walletInfo.provider as any).ethSign) {
            const signature = await (walletInfo.provider as any).ethSign(walletInfo.address, formattedMessage);
            this.logDebug(`ethSign signature received: ${signature.substring(0, 15)}...`);
            return signature;
          }
          
          throw new Error('Provider has signMessage property but it is not a function');
        } catch (err) {
          const errorMessage = err instanceof Error ? err.message : String(err);
          this.logDebug(`Provider-specific signing error: ${errorMessage}`, true);
          throw new Error(`Failed to sign with provider-specific method: ${errorMessage}`);
        }
      }

      this.logDebug('Wallet provider does not support any known signing method', true);
      throw new Error('Wallet provider does not support signing');
    } catch (error) {
      // Improve error logging and propagation
      if (error instanceof Error) {
        this.logDebug(`Error signing message: ${error.message}`, true);
        
        // Log error details for debugging but clean up the error for users
        if ('code' in error) {
          this.logDebug(`Error code: ${(error as any).code}`, true);
        }
        
        // Return user-friendly errors for common issues
        if (error.message.includes('denied') || error.message.includes('rejected')) {
          throw new Error('User denied message signature');
        } else if (error.message.includes('timeout')) {
          throw new Error('Wallet signature request timed out. Please try again.');
        } else if (error.message.includes('connection')) {
          throw new Error('Wallet connection error. Please check your wallet connection and try again.');
        }
        
        throw error; // Re-throw the original error
      } else {
        // For non-Error objects, stringify for logging but create a proper Error
        let errorDetail = 'Unknown error';
        try {
          errorDetail = JSON.stringify(error);
          this.logDebug(`Non-standard error signing message: ${errorDetail}`, true);
        } catch (jsonErr) {
          errorDetail = String(error);
          this.logDebug(`Unserializable error signing message: ${errorDetail}`, true);
        }
        
        throw new Error(`Failed to sign message with wallet: ${errorDetail}`);
      }
    }
  }

  // Debugging utilities
  logDebug(message: string, isError: boolean = false): void {
    if (!this.debugEnabled) return;
    
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${isError ? '❌ ERROR: ' : '✓ '}${message}`;
    
    this.debugLogs.push(logMessage);
    
    // Output to console
    if (isError) {
      console.error(logMessage);
    } else {
      console.log(logMessage);
    }
    
    // Keep only the last 100 logs
    if (this.debugLogs.length > 100) {
      this.debugLogs.shift();
    }
  }
  
  getDebugLogs(): string[] {
    return [...this.debugLogs];
  }
  
  clearDebugLogs(): void {
    this.debugLogs = [];
    this.logDebug('Debug logs cleared');
  }
  
  setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
    this.logDebug(`Debug logging ${enabled ? 'enabled' : 'disabled'}`);
  }
}

// Create and export a singleton instance
const walletService = new WalletService();
export default walletService;

export * from './core/wallet-base';
export * from './auth/wallet-auth';

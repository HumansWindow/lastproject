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
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

class WalletService {
  private authService: WalletAuthenticator;
  private walletConnection: WalletConnection;
  private providers: Partial<Record<WalletProviderType, WalletProvider>>;
  private challengeManager: ChallengeManager;
  private debugLogs: string[] = [];
  private debugEnabled: boolean = process.env.NODE_ENV === 'development';

  constructor() {
    // Initialize the auth property with API base URL
    const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
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
      const challenge = await this.authService.getAuthChallenge(address);
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
    email?: string,
    nonce?: string,
    deviceFingerprint?: string
  ): Promise<AuthResult> {
    this.logDebug(`Authenticating with signature: ${signature.substring(0, 15)}...`);
    this.logDebug(`Wallet Info: ${walletInfo.address}, Chain ID: ${walletInfo.chainId}`);
    
    try {
      const authResult = await this.authService.authenticate(walletInfo, signature, email, nonce, deviceFingerprint);
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

    try {
      // Different wallet providers have different methods for signing
      // This is a common approach that works with most providers
      if (walletInfo.provider.request) {
        const accounts = await walletInfo.provider.request({ method: 'eth_accounts' });
        const from = accounts[0];
        this.logDebug(`Using account for signing: ${from}`);

        // Most providers use eth_signTypedData_v4 or personal_sign
        this.logDebug('Prompting wallet for signature...');
        const signature = await walletInfo.provider.request({
          method: 'personal_sign',
          params: [message, from]
        });

        this.logDebug(`Signature received: ${signature.substring(0, 15)}...`);
        return signature;
      } else if (walletInfo.provider.send) {
        // Fallback for older providers
        this.logDebug('Using legacy provider.send method for signing');
        return new Promise((resolve, reject) => {
          walletInfo.provider.send(
            {
              method: 'personal_sign',
              params: [message, walletInfo.address]
            },
            (err: Error, response: { result: string }) => {
              if (err) {
                this.logDebug(`Signing error: ${err.message}`, true);
                return reject(err);
              }
              this.logDebug(`Signature received: ${response.result.substring(0, 15)}...`);
              resolve(response.result);
            }
          );
        });
      }

      this.logDebug('Wallet provider does not support signing', true);
      throw new Error('Wallet provider does not support signing');
    } catch (error) {
      this.logDebug(`Error signing message: ${error instanceof Error ? error.message : String(error)}`, true);
      throw new Error('Failed to sign message with wallet');
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

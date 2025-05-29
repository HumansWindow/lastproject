/**
 * Wallet Service
 * 
 * This service handles wallet connection and authentication
 */
import { apiClient } from "@/services/api/apiClient";
import { WalletAuthResponse, WalletConnectResponse, WalletInfo } from "@/types/apiTypes";
import { BinanceWalletProvider } from "./providers/ethereum/binance";
import { secureStorage } from "@/utils/secureStorage";
import { walletAuthService } from '../api/modules/auth';
import WalletSelector from './walletSelector';
import { BlockchainType, WalletProviderType } from './core/walletBase';

// Constants for storage keys (matching those in auth.tsx)
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const WALLET_ADDRESS_KEY = 'walletAddress';

// Authentication result interface
interface AuthResult {
  success: boolean;
  accessToken?: string;
  refreshToken?: string;
  userId?: string;
  user?: any;
  error?: string;
}

class WalletService {
  private selector: WalletSelector;
  // Binance wallet provider instance
  private static binanceProvider: BinanceWalletProvider | null = null;
  // Debug related properties
  private static debugEnabled: boolean = false;
  private static debugLogs: string[] = [];

  constructor() {
    this.selector = new WalletSelector();
  }

  /**
   * Get available wallet providers
   * @returns List of available wallet providers
   */
  getAvailableWallets() {
    return this.selector.getAvailableWallets();
  }

  /**
   * Connect to a specific wallet type
   * @param providerType Wallet provider type
   * @returns Connection result
   */
  async connect(providerType: WalletProviderType) {
    return this.selector.connectWallet(providerType);
  }

  /**
   * Disconnect from the current wallet
   * @returns Whether disconnection was successful
   */
  async disconnect() {
    return this.selector.disconnectWallet();
  }

  /**
   * Manually sync wallet info to ensure it's available during authentication
   * Especially useful for Trust Wallet which has sync issues
   * @param walletInfo Wallet information to sync
   * @returns Whether sync was successful
   */
  async syncWalletInfo(walletInfo: WalletInfo): Promise<boolean> {
    try {
      if (!walletInfo || !walletInfo.address) {
        console.error('Cannot sync invalid wallet info');
        return false;
      }
      
      console.log(`Manually syncing wallet info for ${walletInfo.address}`);
      
      // Create a compatible wallet info object with required fields 
      // that combines API WalletInfo with walletBase WalletInfo
      const compatibleWalletInfo = {
        ...walletInfo,
        chainId: walletInfo.chainId?.toString() || "1", // Convert to string if exists, default to "1"
        blockchain: walletInfo.provider ? this.providerToBlockchainType(walletInfo.provider) : BlockchainType.ETHEREUM,
        providerType: walletInfo.provider ? this.providerToProviderType(walletInfo.provider) : WalletProviderType.METAMASK
      };
      
      // Update the wallet info in the selector
      this.selector.updateCurrentWallet(compatibleWalletInfo as any);
      
      // Store in localStorage for persistence
      if (typeof localStorage !== 'undefined') {
        localStorage.setItem('lastConnectedAddress', walletInfo.address);
        localStorage.setItem('lastConnectedWalletType', String(compatibleWalletInfo.providerType));
        localStorage.setItem('lastConnectedBlockchain', this.getBlockchainName(compatibleWalletInfo.blockchain));
      }
      
      // Force trigger any wallet connection listeners
      if (typeof this.selector.emitWalletUpdate === 'function') {
        this.selector.emitWalletUpdate(compatibleWalletInfo as any);
      }
      
      return true;
    } catch (error) {
      console.error('Error syncing wallet info:', error);
      return false;
    }
  }

  /**
   * Attempt to reconnect to the last used wallet
   * @returns Wallet info if successful
   */
  async reconnectLastWallet(): Promise<WalletInfo | null> {
    try {
      const lastWalletType = localStorage.getItem('lastConnectedWalletType');
      if (!lastWalletType) return null;
      
      // Check if the value is an enum string first
      let providerType: WalletProviderType;
      
      // Try to parse as an enum value
      if (Object.values(WalletProviderType).includes(lastWalletType as any)) {
        providerType = lastWalletType as WalletProviderType;
      } else {
        // If it's a number stored as string, convert it properly
        const providerTypeValue = parseInt(lastWalletType, 10);
        if (isNaN(providerTypeValue)) return null;
        
        // Convert to enum safely using a type assertion after validating
        const validProviderValues = Object.values(WalletProviderType);
        if (providerTypeValue < 0 || providerTypeValue >= validProviderValues.length) {
          console.error('Invalid provider type value:', providerTypeValue);
          return null;
        }
        
        // Get the string value from the enum using the numeric index
        const providerTypeString = validProviderValues[providerTypeValue];
        providerType = providerTypeString as WalletProviderType;
      }
      
      console.log(`Attempting to reconnect to last wallet type: ${providerType}`);
      const result = await this.connect(providerType);
      
      if (result?.success && result?.walletInfo) {
        // Convert the walletBase WalletInfo to apiTypes WalletInfo
        const apiWalletInfo: WalletInfo = {
          address: result.walletInfo.address,
          chainId: parseInt(result.walletInfo.chainId) || 1,
          networkName: result.walletInfo.network,
          balance: result.walletInfo.balance,
          isConnected: true,
          provider: String(result.walletInfo.providerType)
        };
        
        return apiWalletInfo;
      }
      return null;
    } catch (error) {
      console.error('Error reconnecting to last wallet:', error);
      return null;
    }
  }

  /**
   * Get the challenge message for wallet authentication
   * @param address Wallet address
   * @returns Challenge message
   */
  async getChallenge(address: string, blockchain?: string) {
    try {
      // Use the blockchain-specific method for consistency and debouncing
      return await this.getChallengeWithBlockchain(address, blockchain || 'ethereum');
    } catch (error) {
      console.error('[Wallet Service] Error getting challenge:', error);
      throw error;
    }
  }

  // Track the last challenge request time for each address
  private lastChallengeRequest: Record<string, number> = {};
  private challengeRequestDebounceTime = 2000; // 2 seconds minimum between requests
  
  /**
   * Get the challenge message for wallet authentication with blockchain type
   * @param address Wallet address
   * @param blockchain Blockchain type (ethereum, solana, etc.)
   * @returns Challenge message
   */
  async getChallengeWithBlockchain(address: string, blockchain: string) {
    try {
      const addressKey = `${address}-${blockchain}`;
      const now = Date.now();
      const lastRequestTime = this.lastChallengeRequest[addressKey] || 0;
      
      // If a request was made too recently, wait or use cached challenge
      if (lastRequestTime && now - lastRequestTime < this.challengeRequestDebounceTime) {
        console.log(`[Wallet Service] Challenge request for ${address} debounced - too frequent`);
        // Wait for the remaining debounce time
        const waitTime = this.challengeRequestDebounceTime - (now - lastRequestTime);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
      
      // Record this request time
      this.lastChallengeRequest[addressKey] = Date.now();
      
      console.log(`[Wallet Service] Requesting challenge for ${address} (${blockchain})`);
      const challenge = await walletAuthService.requestChallenge(address, blockchain);
      return challenge;
    } catch (error) {
      console.error('[Wallet Service] Error getting challenge with blockchain:', error);
      throw error;
    }
  }

  /**
   * Sign a message with the wallet
   * @param message Message to sign
   * @returns Signature
   */
  async signMessage(message: string): Promise<string> {
    try {
      console.log(`[Wallet Service] Requesting signature for message: ${message.substring(0, 20)}...`);
      if (!this.selector.isWalletConnected()) {
        throw new Error('No wallet connected');
      }

      const walletInfo = this.selector.getCurrentWallet();
      if (!walletInfo) {
        throw new Error('Wallet information not found');
      }

      const result = await this.selector.signMessage(message);
      if (!result.success || !result.signature) {
        throw new Error(result.error || 'Signature failed');
      }

      console.log('[Wallet Service] Message signed successfully');
      return result.signature;
    } catch (error) {
      console.error('[Wallet Service] Error signing message:', error);
      throw error;
    }
  }

  /**
   * Authenticate with the wallet
   * @param walletInfo Wallet information
   * @param signature Signature
   * @param message Challenge message
   * @param email Optional email address
   * @param deviceFingerprint Optional device fingerprint
   * @returns Authentication result
   */
  async authenticate(
    walletInfo: WalletInfo,
    signature: string,
    message: string,
    email?: string,
    deviceFingerprint?: string
  ) {
    try {
      console.log(`[Wallet Service] Authenticating wallet: ${walletInfo.address}`);
      
      // Get the blockchain type from the wallet info if available
      // Use type assertion to handle the case where blockchain might not exist
      const blockchain = 'blockchain' in walletInfo ? 
        this.getBlockchainName(walletInfo.blockchain as unknown as BlockchainType) : 
        'ethereum'; // Default to ethereum if not specified
      
      const authResult = await walletAuthService.authenticate({
        walletAddress: walletInfo.address,
        signature,
        message,
        email,
        blockchain
      });

      console.log('[Wallet Service] Authentication result:', 
        authResult.success ? 'Success' : 'Failed',
        authResult.accessToken ? 'Token received' : 'No token'
      );

      // Store authentication data
      if (authResult.accessToken) {
        localStorage.setItem('accessToken', authResult.accessToken);
        if (authResult.refreshToken) {
          localStorage.setItem('refreshToken', authResult.refreshToken);
        }
      }

      // Add userId from user object if not present but user has id
      if (authResult.user && !authResult.userId && authResult.user.id) {
        authResult.userId = authResult.user.id;
      }

      return authResult;
    } catch (error) {
      console.error('[Wallet Service] Authentication error:', error);
      throw error;
    }
  }

  /**
   * Logout and clear all session data
   */
  async logout(refreshToken?: string) {
    try {
      await this.selector.disconnectWallet();
      this.clearStorageData();
    } catch (error) {
      console.error('[Wallet Service] Logout error:', error);
      throw error;
    }
  }

  /**
   * Clear all wallet-related data from storage
   */
  clearStorageData() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('lastConnectedWalletType');
    secureStorage.removeItem('accessToken');
    secureStorage.removeItem('refreshToken');
    secureStorage.removeItem('user_profile');
    secureStorage.removeItem('device_verification');
  }

  /**
   * Convert provider string to BlockchainType
   * @param provider Provider string from WalletInfo
   * @returns BlockchainType enum value
   */
  private providerToBlockchainType(provider: string): BlockchainType {
    const lowerProvider = provider.toLowerCase();
    
    if (lowerProvider.includes('ethereum') || lowerProvider.includes('metamask')) {
      return BlockchainType.ETHEREUM;
    } else if (lowerProvider.includes('binance')) {
      return BlockchainType.BINANCE;
    } else if (lowerProvider.includes('polygon')) {
      return BlockchainType.POLYGON;
    } else if (lowerProvider.includes('solana') || lowerProvider.includes('phantom')) {
      return BlockchainType.SOLANA;
    } else if (lowerProvider.includes('ton')) {
      return BlockchainType.TON;
    }
    
    // Default to Ethereum if we can't determine
    return BlockchainType.ETHEREUM;
  }
  
  /**
   * Convert provider string to WalletProviderType
   * @param provider Provider string from WalletInfo
   * @returns WalletProviderType enum value
   */
  private providerToProviderType(provider: string): WalletProviderType {
    const lowerProvider = provider.toLowerCase();
    
    if (lowerProvider.includes('metamask')) {
      return WalletProviderType.METAMASK;
    } else if (lowerProvider.includes('coinbase')) {
      return WalletProviderType.COINBASE;
    } else if (lowerProvider.includes('walletconnect')) {
      return WalletProviderType.WALLETCONNECT;
    } else if (lowerProvider.includes('trust')) {
      return WalletProviderType.TRUST;
    } else if (lowerProvider.includes('phantom')) {
      return WalletProviderType.PHANTOM;
    } else if (lowerProvider.includes('binance')) {
      return WalletProviderType.BINANCE;
    } else if (lowerProvider.includes('tonkeeper')) {
      return WalletProviderType.TONKEEPER;
    } else if (lowerProvider.includes('tonwallet')) {
      return WalletProviderType.TONWALLET;
    } else if (lowerProvider.includes('solflare')) {
      return WalletProviderType.SOLFLARE;
    }
    
    // Default to MetaMask if we can't determine
    return WalletProviderType.METAMASK;
  }

  /**
   * Get blockchain type as string from enum
   */
  private getBlockchainName(blockchain: BlockchainType): string {
    switch (blockchain) {
      case BlockchainType.ETHEREUM:
        return 'ethereum';
      case BlockchainType.BINANCE:
        return 'binance';
      case BlockchainType.SOLANA:
        return 'solana';
      case BlockchainType.POLYGON:
        return 'polygon';
      case BlockchainType.TON:
        return 'ton';
      default:
        return 'unknown';
    }
  }

  /**
   * Get the Binance wallet provider (lazy initialization)
   */
  private static getBinanceProvider(): BinanceWalletProvider {
    if (!this.binanceProvider) {
      this.binanceProvider = new BinanceWalletProvider();
    }
    return this.binanceProvider;
  }

  /**
   * Detect if Binance wallet extension is available
   */
  private static hasBinanceWallet(): boolean {
    return typeof window !== 'undefined' && !!window.BinanceChain;
  }

  /**
   * Connect wallet to get a nonce for signing
   * @param address The wallet address
   * @returns A nonce that needs to be signed
   */
  static async connectWallet(address: string): Promise<WalletConnectResponse> {
    try {
      console.log('Connecting wallet:', address);
      // Use the dedicated connectWallet method from apiClient
      const response = await apiClient.connectWallet(address);
      
      // Create a properly typed response object that conforms to WalletConnectResponse
      const completeResponse: WalletConnectResponse = {
        nonce: response.nonce,
        walletExists: false, // Default value
      };

      // Add optional properties if they exist in the response
      if (typeof response === 'object') {
        // Check if walletExists exists in the response and use it
        if ('walletExists' in response) {
          completeResponse.walletExists = Boolean(response.walletExists);
        }
        
        // Check if message exists in the response and use it
        if ('message' in response && typeof response.message === 'string') {
          completeResponse.message = response.message;
        } else if ('challenge' in response && typeof response.challenge === 'string') {
          // Some backend implementations use 'challenge' instead of 'message'
          completeResponse.message = response.challenge;
        } else if (response.nonce && !('message' in response)) {
          // If we have a nonce but no message, construct a structured message similar to
          // what's shown in the test output
          const now = new Date();
          const exp = new Date(now.getTime() + 3600000); // 1 hour expiration
          
          completeResponse.message = `Sign this message to authenticate with app.shahi.io

URI: https://app.shahi.io
Version: 1
Chain ID: 1
Nonce: ${response.nonce}
Issued At: ${now.toISOString()}
Expiration Time: ${exp.toISOString()}`;
        }
      }
      
      return completeResponse;
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  /**
   * Authenticate with signature
   * @param address Wallet address
   * @param signature Signed nonce
   * @param nonce Nonce that was signed
   * @returns Authentication response with tokens
   */
  static async authenticateWallet(
    address: string,
    signature: string,
    nonce: string
  ): Promise<WalletAuthResponse> {
    try {
      console.log('Authenticating wallet:', { address, nonce });
      // Use the dedicated authenticateWallet method from apiClient
      const response = await apiClient.authenticateWallet(address, signature, nonce);

      // Use secureStorage instead of localStorage for consistency with auth.tsx
      const { accessToken, refreshToken } = response;
      
      // Always store access token if available
      if (accessToken) {
        secureStorage.setItem(TOKEN_KEY, accessToken);
      }
      
      // Store refresh token only if available
      if (refreshToken) {
        secureStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
      }
      
      // Always store wallet address
      secureStorage.setItem(WALLET_ADDRESS_KEY, address);

      // Log success for debugging
      console.log('Wallet authentication successful, tokens stored securely');

      return response;
    } catch (error: unknown) {
      console.error('Error authenticating wallet:', error);
      
      // Enhanced error handling with proper TypeScript typing
      if (error && typeof error === 'object' && 'response' in error) {
        // The request was made and the server responded with a status code
        // that falls out of the range of 2xx
        const axiosError = error as { 
          response?: { 
            status: number; 
            statusText: string;
            data?: { message?: string } 
          } 
        };
        
        console.error('API Error Response:', {
          status: axiosError.response?.status,
          data: axiosError.response?.data
        });
        
        throw new Error(`Authentication failed: ${
          axiosError.response?.data?.message || 
          axiosError.response?.statusText || 
          'Server error'
        }`);
      } else if (error && typeof error === 'object' && 'request' in error) {
        // The request was made but no response was received
        console.error('No response received from server');
        throw new Error('Authentication failed: No response from server. Please check your network connection.');
      } else {
        // Something happened in setting up the request that triggered an Error
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error('Request setup error:', errorMessage);
        throw error;
      }
    }
  }

  /**
   * Sign a message with wallet using multiple methods with fallbacks
   * @param message The message to sign
   * @returns Signature
   */
  static async signMessage(message: string): Promise<string> {
    // Check if Binance wallet is being used
    if (this.hasBinanceWallet()) {
      try {
        console.log('Detected Binance wallet, using specialized provider');
        const binanceProvider = this.getBinanceProvider();
        await binanceProvider.initialize();
        
        // Get accounts from Binance provider
        const accounts = await binanceProvider.getAccounts();
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found in Binance wallet');
        }
        
        const address = accounts[0];
        // Use Binance-specific signing method
        const signResult = await binanceProvider.signMessage(message, address);
        if (!signResult.success || !signResult.signature) {
          throw new Error(signResult.error || 'Failed to sign with Binance wallet');
        }
        return signResult.signature;
      } catch (binanceError) {
        console.error('Error using Binance wallet:', binanceError);
        // Fall through to regular methods if Binance-specific approach fails
      }
    }
    
    // Regular wallet providers
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error('No wallet provider found');
    }
    
    try {
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      const accounts = await window.ethereum.request({ method: 'eth_accounts' });
      
      if (!accounts || accounts.length === 0) {
        throw new Error('No accounts found');
      }
      
      const address = accounts[0];
      
      // Try different signing methods with fallbacks
      try {
        // Method 1: Standard personal_sign (most wallets support this)
        console.log('Attempting to sign with personal_sign...');
        const signature = await window.ethereum.request({
          method: 'personal_sign',
          params: [message, address],
        });
        return signature;
      } catch (personalSignError) {
        console.warn('personal_sign failed, trying alternative methods...', personalSignError);
        
        // Method 2: Try eth_sign (older method, less secure but more compatible)
        try {
          console.log('Attempting to sign with eth_sign...');
          const signature = await window.ethereum.request({
            method: 'eth_sign',
            params: [address, message],
          });
          return signature;
        } catch (ethSignError) {
          console.warn('eth_sign failed, trying another alternative...', ethSignError);
          
          // Method 3: Try signTypedData if available
          try {
            console.log('Attempting to sign with signTypedData...');
            // Create a structured message that conforms to EIP-712
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
            
            const signature = await window.ethereum.request({
              method: 'eth_signTypedData_v4',
              params: [address, msgParams],
            });
            return signature;
          } catch (signTypedError) {
            // Last resort: Try to use recovery mechanism if available
            console.error('All signing methods failed', signTypedError);
            
            // Use the alternative authentication endpoint if all signing methods fail
            return await this.getRecoverySolution(address, message);
          }
        }
      }
    } catch (error) {
      console.error('Error in signature process:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to sign message: ${errorMessage}`);
    }
  }

  /**
   * Recovery solution when all signing methods fail
   * @param address Wallet address
   * @param message Original message to sign
   * @returns Recovery signature
   */
  static async getRecoverySolution(address: string, message: string): Promise<string> {
    try {
      // First check if we're in development and can use the debug endpoint
      console.log('Checking if debug endpoints are available for recovery...');
      const isDebugAvailable = await this.isDebugModeAvailable();
      
      if (isDebugAvailable) {
        console.log('Debug mode available, using mock signature');
        // Return a "recovery signature" that the server will recognize as a request to bypass
        // This will only work if BYPASS_WALLET_SIGNATURE=true on the server
        return `recovery_signature_${Date.now()}_${address}`;
      } else {
        // In production, we need to try a different approach:
        // 1. Request a recovery challenge from the server
        const recoveryResponse = await apiClient.post('/auth/wallet/recovery-challenge', {
          address,
          failedMessage: message,
        });
        
        if (recoveryResponse.data && recoveryResponse.data.recoveryToken) {
          // Return the recovery token as the signature
          return `recovery_token:${recoveryResponse.data.recoveryToken}`;
        }
        
        // If all else fails, throw an error with clear instructions
        throw new Error('Unable to sign message with your wallet. Please ensure your wallet is unlocked and has granted necessary permissions.');
      }
    } catch (error) {
      console.error('Recovery solution failed:', error);
      throw new Error('Wallet authentication failed. Please try again or use a different wallet.');
    }
  }
  
  /**
   * Check if debug mode is available on the server
   */
  static async isDebugModeAvailable(): Promise<boolean> {
    try {
      const response = await apiClient.get('/auth/wallet-debug/health-check', {
        timeout: 2000, // Short timeout as this is just a check
      });
      return response.data && response.data.enabled === true;
    } catch (error) {
      console.log('Debug mode not available, this is expected in production');
      return false;
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
        const connectResult = await binanceProvider.connect();
        
        if (!connectResult.success || !connectResult.walletInfo) {
          throw new Error('Failed to connect to Binance wallet');
        }
        
        address = connectResult.walletInfo.address;
      } else {
        // Standard wallet flow
        if (typeof window === 'undefined' || !window.ethereum) {
          throw new Error('No wallet provider found');
        }
        
        // Request accounts
        await window.ethereum.request({ method: 'eth_requestAccounts' });
        const accounts = await window.ethereum.request({ method: 'eth_accounts' });
        
        if (!accounts || accounts.length === 0) {
          throw new Error('No accounts found');
        }
        
        address = accounts[0];
      }
      
      // Connect to get nonce
      const response = await this.connectWallet(address);
      const { nonce, message } = response;
      
      // If the server sends a pre-formatted message, use it; otherwise use the nonce directly
      // This ensures compatibility with different backend implementations
      const textToSign = message || nonce;
      
      // Sign the message with our enhanced method that includes fallbacks
      const signature = await this.signMessage(textToSign);
      
      // Authenticate with signature
      return await this.authenticateWallet(address, signature, nonce);
    } catch (error) {
      console.error('Wallet connection flow failed:', error);
      throw error;
    }
  }

  /**
   * Logout and invalidate refresh token
   * @param refreshToken Refresh token to invalidate
   * @returns Success status
   */
  static async logout(refreshToken?: string): Promise<boolean> {
    try {
      if (refreshToken) {
        await apiClient.post('/auth/wallet/logout', { refreshToken });
      }
      
      // Use secureStorage instead of localStorage
      secureStorage.removeItem(TOKEN_KEY);
      secureStorage.removeItem(REFRESH_TOKEN_KEY);
      secureStorage.removeItem(WALLET_ADDRESS_KEY);
      
      return true;
    } catch (error) {
      console.error('Error during logout:', error);
      return false;
    }
  }

  /**
   * Enable or disable debug mode
   */
  static setDebugEnabled(enabled: boolean): void {
    this.debugEnabled = enabled;
    this.debugLogs = [];
    console.log(`Wallet service debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  /**
   * Get debug logs
   */
  static getDebugLogs(): string[] {
    return this.debugLogs;
  }

  /**
   * Clear debug logs
   */
  static clearDebugLogs(): void {
    this.debugLogs = [];
    console.log('Wallet service debug logs cleared');
  }

  /**
   * Add a debug log entry
   */
  private static logDebug(message: string): void {
    if (this.debugEnabled) {
      const timestamp = new Date().toISOString();
      const logEntry = `[${timestamp}] ${message}`;
      this.debugLogs.push(logEntry);
      console.log(`[WALLET DEBUG] ${logEntry}`);
    }
  }
  
  /**
   * Clear any wallet-related corrupted storage data
   * Useful for resolving authentication issues
   */
  static clearStorageData(): void {
    console.log('Clearing wallet authentication storage data...');
    secureStorage.clearAuthData();
    
    // Also clear any direct localStorage items for backward compatibility
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('walletAddress');
      localStorage.removeItem('user_profile');
      localStorage.removeItem('device_verification');
    }
  }

  /**
   * Get authentication challenge from the server
   * @param address Wallet address
   * @returns Challenge response with nonce
   */
  static async getChallenge(address: string): Promise<{ nonce: string; message?: string }> {
    try {
      console.log('Getting challenge for wallet:', address);
      // Connect wallet to get the challenge/nonce
      const response = await this.connectWallet(address);
      return response;
    } catch (error) {
      console.error('Error getting challenge:', error);
      throw error;
    }
  }

  /**
   * Complete authentication process with wallet
   * @param walletInfo Wallet information
   * @param signature Signed challenge
   * @param challenge Original challenge/nonce
   * @param email Optional email for registration
   * @param deviceFingerprint Device fingerprint for security
   * @returns Authentication result
   */
  static async authenticate(
    walletInfo: WalletInfo,
    signature: string,
    challenge: string,
    email?: string,
    deviceFingerprint?: string
  ): Promise<AuthResult> {
    try {
      if (!walletInfo || !walletInfo.address) {
        return { 
          success: false, 
          error: 'No wallet address provided' 
        };
      }

      console.log(`Authenticating wallet ${walletInfo.address} with signature`);
      
      // Call the authenticateWallet method which communicates with the backend
      const response = await this.authenticateWallet(
        walletInfo.address,
        signature,
        challenge
      );
      
      // More lenient token validation - only require accessToken
      if (!response) {
        console.error('Empty authentication response');
        return {
          success: false,
          error: 'Empty response from authentication server'
        };
      }
      
      // Don't require refreshToken - accessToken is enough for authentication
      if (!response.accessToken) {
        console.error('Missing access token in response:', response);
        return {
          success: false,
          error: 'Access token missing in authentication response'
        };
      }
      
      // Return successful result even without refreshToken
      return {
        success: true,
        accessToken: response.accessToken,
        refreshToken: response.refreshToken,  // This might be undefined but that's OK
        userId: response.userId
      };
    } catch (error: unknown) {
      console.error('Authentication error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown authentication error'
      };
    }
  }
}

// Fix for the declaration issue
// Instead of redeclaring window.ethereum which causes the conflict,
// we'll extend the global Window interface
declare global {
  interface Window {
    ethereum?: any; // Using any type to avoid conflicts with other declarations
    BinanceChain?: any; // Add Binance Chain wallet support
  }
}

export const walletService = new WalletService();
export default walletService;

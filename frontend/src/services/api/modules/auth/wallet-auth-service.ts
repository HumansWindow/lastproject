/**
 * Wallet Authentication Service
 * 
 * Provides functions for wallet-based authentication.
 */

import axios, { AxiosInstance } from 'axios';
import { API_URL } from '../../../../config/api.config';

export interface WalletChallenge {
  challenge: string;
  expiresAt?: string;
  isExistingUser?: boolean;
}

export interface WalletAuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
  email?: string;
  deviceFingerprint?: string;
  blockchain?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
  userId?: string; // Added userId field to match usage in AuthProvider
  success?: boolean;
  error?: string;
}

class WalletAuthService {
  private readonly client: AxiosInstance;
  
  constructor() {
    this.client = axios.create({
      baseURL: API_URL,
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      withCredentials: false // Set to false to avoid CORS preflight issues
    });

    // Remove the custom headers that are causing CORS issues
    delete this.client.defaults.headers.common['x-debug-request'];
    delete this.client.defaults.headers.common['x-request-id'];
    
    // Intercept requests to add blockchain header if available
    this.client.interceptors.request.use(config => {
      // Check for blockchain info in the request data
      if (config.data?.blockchain) {
        // Add blockchain as a header as well for compatibility
        config.headers = config.headers || {};
        config.headers['X-Blockchain-Type'] = config.data.blockchain;
      }
      return config;
    });
  }

  /**
   * Normalize wallet address based on blockchain type
   * Different blockchains have different formats and case sensitivity requirements
   */
  private normalizeWalletAddress(address: string, blockchain?: string): string {
    if (!address) return '';
    
    // Default to Ethereum/Polygon formatting (lowercase)
    return address.toLowerCase();
  }

  /**
   * Check backend health status for wallet authentication
   * Useful for debugging connectivity issues
   */
  public async checkHealth(): Promise<{ status: boolean; endpoints?: string[]; message?: string }> {
    try {
      // Try the debug endpoint first for detailed info
      const response = await fetch(`${API_URL}/auth/wallet-debug/health-check`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        return {
          status: true,
          endpoints: data.endpoints,
          message: 'Backend health check passed'
        };
      }
      
      // Try alternate health check endpoint
      try {
        const fallbackResponse = await fetch(`${API_URL}/health`);
        if (fallbackResponse.ok) {
          return {
            status: true,
            message: 'Backend reachable via fallback endpoint'
          };
        }
      } catch (error) {
        console.error('Fallback health check failed:', error);
        return {
          status: false,
          message: 'Backend health check failed'
        };
      }
      
      return {
        status: false,
        message: `Health check failed: ${response.status} ${response.statusText}`
      };
    } catch (error) {
      console.error('Backend health check failed:', error);
      
      // Try other endpoints as last resort
      try {
        // Try any public endpoint as last resort
        const lastResort = await fetch(`${API_URL}/health`);
        if (lastResort.ok) {
          return {
            status: true,
            message: 'Backend reachable via public health endpoint'
          };
        }
      } catch (error) {
        // Ignore errors from last resort health check
        console.debug('Last resort health check failed:', error);
      }
      
      return {
        status: false,
        message: error instanceof Error ? error.message : 'Backend unreachable'
      };
    }
  }

  /**
   * Request a challenge for wallet authentication
   * @param walletAddress The wallet address to authenticate
   * @returns Challenge data including a message to sign
   */
  public async requestChallenge(walletAddress: string, blockchain?: string): Promise<WalletChallenge> {
    try {
      console.log(`[Wallet Auth] Requesting challenge for address: ${walletAddress}, blockchain: ${blockchain ?? 'default'}`);

      if (!walletAddress) {
        throw new Error('Wallet address is required');
      }

      // Normalize inputs
      const formattedAddress = this.normalizeWalletAddress(walletAddress, blockchain);

      // Use a consistent blockchain type internally
      const requestData: Record<string, any> = {
        address: formattedAddress,
      };

      // Simplify blockchain parameter handling
      if (blockchain?.toLowerCase() === 'polygon') {
        console.log('[Wallet Auth] Using Polygon-specific blockchain parameter for Trust Wallet');
        requestData.blockchain = 'polygon';
      } else {
        requestData.blockchain = blockchain?.toLowerCase() ?? 'polygon';
      }

      // Add extra testing flag for backend debugging
      requestData.isTest = true;

      console.log('[Wallet Auth] Challenge request payload:', requestData);

      // Make the API call
      const response = await this.client.post('/auth/wallet/connect', requestData);
      return response.data;
    } catch (error) {
      console.error('[Wallet Auth] Error requesting challenge:', error);
      throw error;
    }
  }

  /**
   * Authenticate using a wallet signature
   * @param request The wallet authentication request data
   * @returns Authentication response with tokens
   */
  public async authenticate(request: WalletAuthRequest): Promise<AuthResponse> {
    try {
      this.validateAuthRequest(request);
      const authPayload = this.createAuthPayload(request);

      // Added logging to inspect authPayload
      console.log('[Wallet Auth] Sending authentication request with payload:', authPayload);

      return await this.sendAuthRequest(authPayload);
    } catch (error) {
      return this.handleAuthError(error);
    }
  }

  private validateAuthRequest(request: WalletAuthRequest): void {
    const { walletAddress, signature, message } = request;
    if (!walletAddress) throw new Error('Wallet address is required for authentication');
    if (!signature) throw new Error('Signature is required for authentication');
    if (!message) throw new Error('Message/challenge is required for authentication');
  }

  private createAuthPayload(request: WalletAuthRequest): Record<string, any> {
    const { walletAddress, signature, message, email, blockchain } = request;
    const formattedAddress = this.normalizeWalletAddress(walletAddress, blockchain);
    const authPayload: Record<string, any> = { address: formattedAddress, walletAddress: formattedAddress, signature, message };
    if (email) authPayload.email = email;
    authPayload.blockchain = blockchain?.toLowerCase() ?? this.getDefaultBlockchain();
    return authPayload;
  }

  private getDefaultBlockchain(): string {
    const isTrustWallet = typeof window !== 'undefined' && window.localStorage?.getItem('lastConnectedWalletType')?.includes('TRUST');
    return isTrustWallet ? 'polygon' : 'default';
  }

  private async sendAuthRequest(authPayload: Record<string, any>): Promise<AuthResponse> {
    const response = await this.client.post<AuthResponse>('/auth/wallet/authenticate', authPayload);
    return { ...response.data, success: !!response.data.accessToken };
  }

  private handleAuthError(error: unknown): AuthResponse {
    console.error('[Wallet Auth] Authentication failed:', error);
    if (axios.isAxiosError(error)) {
      const errorMessage = error.response?.data?.message ?? error.message;
      return { accessToken: '', refreshToken: '', user: null, success: false, error: errorMessage };
    }
    return { accessToken: '', refreshToken: '', user: null, success: false, error: String(error) };
  }
  
  /**
   * Check if wallet address is linked to an account
   * @param walletAddress The wallet address to check
   * @returns boolean indicating if the wallet is linked
   */
  public async isWalletLinked(walletAddress: string): Promise<boolean> {
    try {
      if (!walletAddress) {
        return false;
      }
      
      // Normalize the wallet address
      const formattedAddress = this.normalizeWalletAddress(walletAddress);
      
      // Using direct endpoint path (not full URL) because baseURL is already set
      const response = await this.client.get<{ exists: boolean }>(
        `/auth/wallet/exists?address=${formattedAddress}`
      );
      
      return response.data.exists;
    } catch (error) {
      console.error('Failed to check if wallet is linked:', error);
      return false;
    }
  }
}

export const walletAuthService = new WalletAuthService();
export default walletAuthService;
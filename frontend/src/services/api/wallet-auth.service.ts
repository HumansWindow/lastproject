import { apiClient } from './apiClient';
import { WalletInfo } from '../../types/wallet.types';

// Define error interface for axios errors
interface ApiError {
  response?: {
    status: number;
    data?: any;
  };
  request?: any;
  message?: string;
}

// Define authentication payload interface
interface WalletAuthPayload {
  address: string;
  signature: string;
  message: string;
  email?: string;
  deviceFingerprint?: string;
  chainId?: number;
}

/**
 * Service for wallet authentication API requests
 */
export class WalletAuthService {
  constructor() {
    // Clear any cached URLs that might cause connection issues
    this.clearCachedApiUrls();
  }
  
  /**
   * Clear cached API URLs to ensure consistent port 3001 connections
   */
  clearCachedApiUrls() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.removeItem('wallet_auth_working_url');
      localStorage.removeItem('api_url_override');
      console.log('🧹 Cleared cached wallet auth URLs from localStorage');
    }
  }

  /**
   * Authenticate with a wallet signature
   * @param walletInfo Wallet information
   * @param signature The signature of the challenge
   * @param challenge The challenge that was signed
   * @param email Optional email to associate with the wallet
   * @param deviceId Optional device identifier for security
   */
  async authenticate(
    walletInfo: WalletInfo,
    signature: string,
    challenge: string,
    email?: string,
    deviceId?: string
  ) {
    try {
      // Create authentication payload with consistent field names
      const payload: WalletAuthPayload = {
        address: walletInfo.address.toLowerCase(),
        signature,
        message: challenge,
        ...(email ? { email: email.trim() } : {}),
        ...(deviceId ? { deviceFingerprint: deviceId } : {}),
        chainId: walletInfo.chainId
      };
      
      // Send authentication request to the known working endpoint
      const response = await apiClient.post('/auth/wallet/authenticate', payload, {
        headers: {
          'X-Device-Fingerprint': deviceId ?? '',
          'X-Wallet-Chain-Id': walletInfo.chainId.toString()
        }
      });
      
      // Store tokens in localStorage if successful
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        localStorage.setItem('refreshToken', response.data.refreshToken);
        localStorage.setItem('walletAddress', walletInfo.address.toLowerCase());
      }
      
      return response.data;
    } catch (error: unknown) {
      // Enhanced error handling
      console.error('Error authenticating wallet:', error);
      
      const apiError = error as ApiError;
      
      if (apiError.response?.status === 401) {
        throw new Error('Authentication failed: Invalid signature');
      } else if (apiError.response?.status === 403) {
        throw new Error('Authentication failed: This wallet address is restricted');
      } else if (apiError.response?.status === 429) {
        throw new Error('Too many authentication attempts. Please try again later.');
      } else if (apiError.response?.status === 500) {
        throw new Error('Server error. Please try again later.');
      } else {
        throw error;
      }
    }
  }
  
  /**
   * Disconnect wallet and remove local auth data
   */
  disconnect() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('walletAddress');
  }
}

// Export a singleton instance
export const walletAuthService = new WalletAuthService();
export default walletAuthService;
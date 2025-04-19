import apiClient from './api-client';
import { endpoints } from '@/config/api.config';
import { WalletInfo } from '../wallet/core/wallet-base';

// Define error interface for axios errors
interface ApiError {
  response?: {
    status?: number;
    data?: {
      message?: string;
    };
  };
}

// Define authentication payload interface
interface WalletAuthPayload {
  address: string;
  signature: string;
  message: string;
  chainId: string;
  deviceFingerprint: string | undefined;
  email?: string; // Make email optional in the interface
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
      // Remove any cached URLs that might be causing connection issues
      localStorage.removeItem('wallet_auth_working_url');
      localStorage.removeItem('api_url_override');
      console.log('🧹 Cleared cached wallet auth URLs from localStorage - using port 3001');
    }
  }
  
  /**
   * Get a challenge for wallet authentication
   * @param address The wallet address
   * @returns A challenge message to sign
   */
  async getChallenge(address: string): Promise<{ challenge: string; isExistingUser: boolean }> {
    try {
      // Normalize wallet address to lowercase for consistency
      const normalizedAddress = address.toLowerCase();
      
      // Request a challenge for this address
      const response = await apiClient.post(endpoints.walletAuth.connect, { 
        address: normalizedAddress
      });
      
      return {
        challenge: response.data.challenge,
        isExistingUser: !!response.data.isExistingUser
      };
    } catch (error: unknown) {
      console.error('Error getting wallet challenge:', error);
      const apiError = error as ApiError;
      throw new Error(
        apiError.response?.data?.message || 
        'Failed to get authentication challenge. Please try again.'
      );
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
      // Prevent duplicate requests by adding a small delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Create authentication payload
      const payload: WalletAuthPayload = {
        address: walletInfo.address.toLowerCase(),
        signature,
        message: challenge,
        chainId: walletInfo.chainId,
        deviceFingerprint: deviceId
      };
      
      // Add email only if provided
      if (email) {
        payload.email = email;
      }
      
      // Send authentication request
      const response = await apiClient.post(endpoints.walletAuth.authenticate, payload, {
        headers: {
          'X-Device-Fingerprint': deviceId || '',
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
      // Return a more user-friendly error
      if (apiError.response?.status === 401) {
        throw new Error('Authentication failed: Invalid signature');
      } else if (apiError.response?.status === 403) {
        throw new Error('Authentication failed: This wallet address is restricted');
      } else if (apiError.response?.status === 429) {
        throw new Error('Too many authentication attempts. Please try again later.');
      } else if (apiError.response?.status === 500) {
        throw new Error('Server error. Please try again later or contact support if the issue persists.');
      } else {
        throw new Error(
          apiError.response?.data?.message || 
          'Authentication failed. Please try again.'
        );
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
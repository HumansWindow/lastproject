import axios from 'axios';
import { WalletInfo } from '../core/wallet-base';

export interface AuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
}

export class WalletAuthenticator {
  constructor(private apiBaseUrl: string) {}
  
  async getAuthChallenge(address: string): Promise<string> {
    try {
      // Updated to use the correct API endpoint
      const response = await axios.post(`${this.apiBaseUrl}/auth/wallet/connect`, { address });
      return response.data.nonce;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err?.response?.data?.message || 'Failed to get auth challenge');
    }
  }
  
  async authenticate(
    walletInfo: WalletInfo, 
    signature: string, 
    email?: string,
    nonce?: string,
    deviceFingerprint?: string
  ): Promise<AuthResult> {
    try {
      const payload = {
        address: walletInfo.address,
        signature,
        nonce: nonce || '', // Use the original challenge nonce if provided
        email: email || undefined,
        deviceFingerprint: deviceFingerprint || undefined // Add device fingerprint
      };
      
      // Add retry logic with exponential backoff
      const maxRetries = 3;
      let retryCount = 0;
      let delay = 1000; // Start with 1 second delay
      
      while (retryCount < maxRetries) {
        try {
          // Updated to use the correct API endpoint
          const response = await axios.post(`${this.apiBaseUrl}/auth/wallet/authenticate`, payload, {
            headers: {
              'X-Device-Fingerprint': deviceFingerprint || 'unknown'
            }
          });
          
          return {
            success: true,
            token: response.data.accessToken,
            refreshToken: response.data.refreshToken,
            userId: response.data.user?.id,
            isNewUser: response.data.isNewUser
          };
        } catch (err: any) {
          retryCount++;
          
          // If we've reached max retries or it's not a server error (5xx), throw
          if (retryCount >= maxRetries || !err.response || err.response.status < 500) {
            throw err;
          }
          
          // Wait with exponential backoff before retrying
          await new Promise(resolve => setTimeout(resolve, delay));
          delay *= 2; // Double the delay for next retry
        }
      }
      
      throw new Error('Authentication failed after retries');
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err?.response?.data?.message || 'Authentication failed'
      };
    }
  }
  
  async refreshToken(refreshToken: string, deviceFingerprint?: string): Promise<AuthResult> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/auth/refresh-token`, { 
        refreshToken,
        deviceFingerprint 
      });
      
      return {
        success: true,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err?.response?.data?.message || 'Failed to refresh token'
      };
    }
  }
  
  async logout(refreshToken: string): Promise<boolean> {
    try {
      await axios.post(`${this.apiBaseUrl}/auth/logout`, { refreshToken });
      return true;
    } catch (error) {
      console.error('Logout error:', error);
      return false;
    }
  }
}

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
      const response = await axios.post(`${this.apiBaseUrl}/auth/wallet/challenge`, { address });
      return response.data.challenge;
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      throw new Error(err?.response?.data?.message || 'Failed to get auth challenge');
    }
  }
  
  async authenticate(
    walletInfo: WalletInfo, 
    signature: string, 
    email?: string
  ): Promise<AuthResult> {
    try {
      const payload = {
        address: walletInfo.address,
        signature,
        chainId: walletInfo.chainId,
        email: email || undefined
      };
      
      const response = await axios.post(`${this.apiBaseUrl}/auth/wallet/verify`, payload);
      
      return {
        success: true,
        token: response.data.accessToken,
        refreshToken: response.data.refreshToken,
        userId: response.data.user?.id,
        isNewUser: response.data.isNewUser
      };
    } catch (error: unknown) {
      const err = error as { response?: { data?: { message?: string } } };
      return {
        success: false,
        error: err?.response?.data?.message || 'Authentication failed'
      };
    }
  }
  
  async refreshToken(refreshToken: string): Promise<AuthResult> {
    try {
      const response = await axios.post(`${this.apiBaseUrl}/auth/refresh-token`, { refreshToken });
      
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

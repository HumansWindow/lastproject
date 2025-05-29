/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from './modules/auth' instead.
 * 
 * Authentication Service
 */

import axios, { AxiosInstance } from 'axios';
import { endpoints, apiClientConfig } from '../../config/api.config';
import { getDeviceFingerprint } from '../security/modules/device-fingerprint';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export interface WalletChallenge {
  challenge: string;
  expiresAt: string;
}

export interface WalletAuthRequest {
  walletAddress: string;
  signature: string;
  message: string;
  deviceFingerprint?: string;
  deviceInfo?: any;
}

class AuthService {
  private client: AxiosInstance;
  private deviceFingerprint: string | null = null;

  constructor() {
    this.client = axios.create({
      ...apiClientConfig,
      withCredentials: true, // Important for cookies if used
    });

    // Set up request interceptor to add auth tokens
    this.client.interceptors.request.use(
      async (config) => {
        // Add auth token if available
        const token = this.getAccessToken();
        if (token) {
          config.headers.Authorization = `Bearer ${token}`;
        }

        // Add device fingerprint
        const fingerprint = await this.getDeviceFingerprint();
        if (fingerprint) {
          config.headers['X-Device-Fingerprint'] = fingerprint;
        }

        return config;
      },
      (error) => Promise.reject(error)
    );

    // Set up response interceptor for token refresh
    this.client.interceptors.response.use(
      (response) => response,
      async (error) => {
        const originalRequest = error.config;
        
        // If the error is due to an expired token and we haven't tried to refresh yet
        if (error.response?.status === 401 && !originalRequest._retry) {
          originalRequest._retry = true;
          
          try {
            // Try to refresh the token
            const refreshToken = this.getRefreshToken();
            if (!refreshToken) {
              // No refresh token available, user needs to login again
              this.clearTokens();
              return Promise.reject(error);
            }
            
            const response = await this.refreshToken(refreshToken);
            
            if (response?.accessToken) {
              // Save the new tokens
              this.setTokens(response.accessToken, response.refreshToken);
              
              // Update the original request with the new token
              originalRequest.headers.Authorization = `Bearer ${response.accessToken}`;
              
              // Retry the original request
              return this.client(originalRequest);
            }
          } catch (refreshError) {
            console.error('Token refresh failed:', refreshError);
            this.clearTokens();
            return Promise.reject(refreshError);
          }
        }
        
        return Promise.reject(error);
      }
    );
  }

  /**
   * Get or generate device fingerprint
   */
  private async getDeviceFingerprint(): Promise<string> {
    if (!this.deviceFingerprint) {
      try {
        this.deviceFingerprint = await getDeviceFingerprint();
      } catch (error) {
        console.error('Failed to get device fingerprint:', error);
        this.deviceFingerprint = `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
      }
    }
    // Always return a string, never null
    return this.deviceFingerprint || `fallback-${Date.now()}-${Math.random().toString(36).substring(2, 10)}`;
  }

  /**
   * Get access token from storage
   */
  private getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  /**
   * Get refresh token from storage
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  /**
   * Store authentication tokens
   */
  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem('accessToken', accessToken);
    localStorage.setItem('refreshToken', refreshToken);
  }

  /**
   * Clear authentication tokens
   */
  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }

  /**
   * Check if user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  /**
   * Request wallet connection challenge
   * @param walletAddress Wallet address
   * @returns Challenge message
   */
  public async requestWalletChallenge(walletAddress: string): Promise<WalletChallenge> {
    try {
      const response = await this.client.post<WalletChallenge>(
        endpoints.walletAuth.connect,
        { walletAddress }
      );
      return response.data;
    } catch (error) {
      console.error('Failed to request wallet challenge:', error);
      throw error;
    }
  }

  /**
   * Authenticate with wallet signature
   * @param payload Authentication payload
   * @returns Authentication response
   */
  public async walletAuthenticate(payload: WalletAuthRequest): Promise<AuthResponse> {
    try {
      // Include device fingerprint in the request
      const deviceFingerprint = await this.getDeviceFingerprint();
      const fullPayload = {
        ...payload,
        deviceFingerprint,
        deviceInfo: {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language
        }
      };

      const response = await this.client.post<AuthResponse>(
        endpoints.walletAuth.authenticate,
        fullPayload
      );

      if (response.data.accessToken) {
        this.setTokens(response.data.accessToken, response.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      console.error('Wallet authentication failed:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   * @param refreshToken Refresh token
   * @returns New auth tokens
   */
  public async refreshToken(refreshToken: string): Promise<AuthResponse> {
    try {
      const response = await this.client.post<AuthResponse>(
        endpoints.auth.refreshToken,
        { refreshToken }
      );
      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      throw error;
    }
  }

  /**
   * Get user profile
   * @returns User profile data
   */
  public async getUserProfile(): Promise<any> {
    try {
      const response = await this.client.get(endpoints.users.profile);
      return response.data;
    } catch (error) {
      console.error('Failed to fetch user profile:', error);
      throw error;
    }
  }

  /**
   * Log out user
   */
  public async logout(): Promise<void> {
    try {
      await this.client.post(endpoints.auth.logout);
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      this.clearTokens();
    }
  }
}

export const authService = new AuthService();
export default authService;
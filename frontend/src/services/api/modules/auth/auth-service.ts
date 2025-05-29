/**
 * Auth Service Module
 * 
 * Core authentication service implementation.
 */

import axios, { AxiosInstance } from 'axios';
import { endpoints, apiClientConfig } from '../../../../config/api.config';
import { getDeviceFingerprint } from '../../../security/device-fingerprint';

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: any;
}

export interface AuthRequest {
  email: string;
  password: string;
  deviceFingerprint?: string;
}

class AuthServiceImpl {
  private client: AxiosInstance;
  private deviceFingerprint: string | null = null;

  constructor() {
    this.client = axios.create({
      ...apiClientConfig,
      withCredentials: true,
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
  public clearTokens(): void {
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
   * Login with email and password
   */
  public async login(email: string, password: string): Promise<AuthResponse> {
    try {
      const deviceFingerprint = await this.getDeviceFingerprint();
      const response = await this.client.post<AuthResponse>(
        endpoints.auth.login,
        { email, password, deviceFingerprint }
      );

      if (response.data.accessToken) {
        this.setTokens(response.data.accessToken, response.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }

  /**
   * Register a new user
   */
  public async register(userData: any): Promise<any> {
    try {
      const response = await this.client.post(
        endpoints.auth.register,
        userData
      );
      return response.data;
    } catch (error) {
      console.error('Registration failed:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   */
  public async refreshToken(): Promise<AuthResponse> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) {
        throw new Error('No refresh token available');
      }

      const response = await this.client.post<AuthResponse>(
        endpoints.auth.refreshToken,
        { refreshToken }
      );

      if (response.data.accessToken) {
        this.setTokens(response.data.accessToken, response.data.refreshToken);
      }

      return response.data;
    } catch (error) {
      console.error('Token refresh failed:', error);
      this.clearTokens();
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

  /**
   * Get user profile
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
}

export const authServiceImpl = new AuthServiceImpl();
export default authServiceImpl;
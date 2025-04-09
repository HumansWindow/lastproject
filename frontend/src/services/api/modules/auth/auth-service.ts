import { apiClient } from '../../api-client';
import { UserInfo, AuthTokens, UserProfile } from '../../../../types/api-types';
import axios, { AxiosResponse } from 'axios';

/**
 * Service for handling authentication related operations
 */
class AuthService {
  private userEndpoint = '/api/user';
  private authEndpoint = '/api/auth';
  
  /**
   * Login the user with email and password
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<AuthTokens>(`${this.authEndpoint}/login`, {
        email,
        password,
      });
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Register a new user
   */
  async register(email: string, password: string, referralCode?: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<AuthTokens>(`${this.authEndpoint}/register`, {
        email,
        password,
        referralCode,
      });
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Get the current user profile
   */
  async getUserProfile(): Promise<{ data: UserProfile }> {
    try {
      const response = await apiClient.get<UserProfile>(`${this.userEndpoint}/profile`);
      return { data: response.data };
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }
  
  /**
   * Login with wallet signature
   */
  async loginWithWallet(address: string, signature: string, message: string): Promise<{ data: { user: UserProfile, accessToken: string, refreshToken: string } }> {
    try {
      const response = await apiClient.post(`${this.authEndpoint}/wallet-login`, {
        address,
        signature,
        message,
      });
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return { 
        data: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        }
      };
    } catch (error) {
      console.error('Wallet login error:', error);
      throw error;
    }
  }
  
  /**
   * Log out the current user
   */
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  
  /**
   * Check if the user is logged in
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  // ========================
  // BACKWARDS COMPATIBILITY METHODS
  // These methods are kept to maintain compatibility with existing components
  // ========================

  /**
   * @deprecated Use getUserProfile instead
   * Get current user info
   * @returns Promise with user info
   */
  async getUserInfo(): Promise<UserInfo> {
    try {
      const response = await apiClient.get<UserInfo>(`${this.authEndpoint}/me`);
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
      throw error;
    }
  }

  /**
   * Request password reset email
   * @param email User email
   * @returns Promise with success message
   */
  async forgotPassword(email: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.authEndpoint}/forgot-password`, { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  }

  /**
   * Reset password with token
   * @param token Reset token
   * @param newPassword New password
   * @returns Promise with success message
   */
  async resetPassword(token: string, newPassword: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.authEndpoint}/reset-password`, { 
        token, 
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  }

  /**
   * Update user password
   * @param currentPassword Current password
   * @param newPassword New password
   * @returns Promise with success message
   */
  async changePassword(currentPassword: string, newPassword: string): Promise<any> {
    try {
      const response = await apiClient.post(`${this.authEndpoint}/change-password`, {
        currentPassword,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Change password error:', error);
      throw error;
    }
  }

  /**
   * Refresh authentication token
   * @param refreshToken Refresh token
   * @returns Promise with new tokens
   */
  async refreshToken(refreshToken: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<AuthTokens>(`${this.authEndpoint}/refresh`, { refreshToken });
      
      // Store new tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      console.error('Token refresh error:', error);
      
      // Remove invalid tokens
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      throw error;
    }
  }

  /**
   * @deprecated Use isLoggedIn instead
   * Check if user is authenticated
   * @returns Whether user has a valid token
   */
  isAuthenticated(): boolean {
    return this.isLoggedIn();
  }

  /**
   * Get stored access token
   * @returns Access token or null
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();
export default authService;

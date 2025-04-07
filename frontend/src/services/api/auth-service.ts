import { apiClient } from './api-client';

/**
 * Auth token response interface
 */
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

/**
 * User info interface
 */
export interface UserInfo {
  id: string;
  email: string;
  username?: string;
  walletAddress?: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  [key: string]: any;
}

/**
 * Service for authentication operations
 */
class AuthService {
  /**
   * Login with email and password
   * @param email User email
   * @param password User password
   * @returns Promise with auth tokens
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<AuthTokens>('/auth/login', { email, password });
      
      // Store tokens in localStorage
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
   * @param email User email
   * @param password User password
   * @param referralCode Optional referral code
   * @returns Promise with auth tokens
   */
  async register(
    email: string, 
    password: string, 
    referralCode?: string
  ): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<AuthTokens>('/auth/register', { 
        email, 
        password,
        referralCode
      });
      
      // Store tokens in localStorage
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
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
      const response = await apiClient.post('/auth/forgot-password', { email });
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
      const response = await apiClient.post('/auth/reset-password', { 
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
      const response = await apiClient.post('/auth/change-password', {
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
   * Get current user info
   * @returns Promise with user info
   */
  async getUserInfo(): Promise<UserInfo> {
    try {
      const response = await apiClient.get<UserInfo>('/auth/me');
      return response.data;
    } catch (error) {
      console.error('Error fetching user info:', error);
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
      const response = await apiClient.post<AuthTokens>('/auth/refresh', { refreshToken });
      
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
   * Logout the current user
   * @returns Promise with success message
   */
  async logout(): Promise<any> {
    try {
      // Make API call to invalidate token on server
      const response = await apiClient.post('/auth/logout');
      
      // Remove tokens from localStorage
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      return response.data;
    } catch (error) {
      console.error('Logout error:', error);
      
      // Remove tokens even if API call fails
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      
      throw error;
    }
  }

  /**
   * Check if user is authenticated
   * @returns Whether user has a valid token
   */
  isAuthenticated(): boolean {
    return !!localStorage.getItem('accessToken');
  }

  /**
   * Get stored access token
   * @returns Access token or null
   */
  getAccessToken(): string | null {
    return localStorage.getItem('accessToken');
  }
}

// Create singleton instance
export const authService = new AuthService();

// Default export
export default authService;
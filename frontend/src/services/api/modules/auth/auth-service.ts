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
}

export const authService = new AuthService();
export default authService;

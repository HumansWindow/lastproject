/**
 * Authentication Service
 * 
 * Handles user authentication, token management, and session control.
 */
import * as React from 'react';
import axios from 'axios';
import jwtDecode from 'jwt-decode';
import { 
  LoginResponse as ApiLoginResponse, 
  UserProfile, 
  AuthTokens
} from '../../../../types/api-types';
import { apiClient } from '../../api-client';
import { securityService, SecurityEventType, AuthFactor } from '../../../security/security-service';

// Storage keys
const ACCESS_TOKEN_KEY = 'auth_access_token';
const REFRESH_TOKEN_KEY = 'auth_refresh_token';
const USER_DATA_KEY = 'auth_user_data';

// Token refresh timing (refresh when less than 5 minutes remaining)
const TOKEN_REFRESH_THRESHOLD = 5 * 60 * 1000;

// User interface
export interface User {
  id: string;
  email?: string;
  username?: string;
  walletAddress?: string;
  firstName?: string;
  lastName?: string;
  profileImageUrl?: string;
  isEmailVerified?: boolean;
  hasPassword?: boolean;
  hasMfa?: boolean;
  roles?: string[];
  createdAt?: string;
  lastLoginAt?: string;
}

// Login response interface
export interface LoginResponse {
  accessToken: string;
  refreshToken: string;
  userId: string;
  expiresIn: number;
  isNewUser?: boolean;
  requiresMfa?: boolean;
}

/**
 * Authentication service for managing user sessions
 */
class AuthService {
  private currentUser: User | null = null;
  private refreshTokenTimeout: any = null;
  
  constructor() {
    // Load user data from storage on initialization
    this.loadUserData();
    
    // Schedule token refresh if we already have tokens
    if (this.getAccessToken()) {
      this.scheduleTokenRefresh();
    }
  }
  
  /**
   * Load user data from storage
   */
  private loadUserData(): void {
    try {
      const userDataStr = localStorage.getItem(USER_DATA_KEY);
      if (userDataStr) {
        this.currentUser = JSON.parse(userDataStr);
      }
    } catch (error) {
      console.error('Error loading user data from storage:', error);
    }
  }
  
  /**
   * Save user data to storage
   */
  private saveUserData(user: User | null): void {
    if (user) {
      localStorage.setItem(USER_DATA_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_DATA_KEY);
    }
  }
  
  /**
   * Get the current access token
   */
  public getAccessToken(): string | null {
    return localStorage.getItem(ACCESS_TOKEN_KEY);
  }
  
  /**
   * Get the refresh token
   */
  private getRefreshToken(): string | null {
    return localStorage.getItem(REFRESH_TOKEN_KEY);
  }
  
  /**
   * Set authentication tokens and schedule refresh
   */
  public setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(ACCESS_TOKEN_KEY, accessToken);
    localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken);
    
    // Schedule token refresh
    this.scheduleTokenRefresh();
  }
  
  /**
   * Clear authentication tokens and user data
   */
  private clearTokens(): void {
    localStorage.removeItem(ACCESS_TOKEN_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
    localStorage.removeItem(USER_DATA_KEY);
    
    // Clear any scheduled refresh
    if (this.refreshTokenTimeout) {
      clearTimeout(this.refreshTokenTimeout);
      this.refreshTokenTimeout = null;
    }
    
    // Clear current user
    this.currentUser = null;
  }
  
  /**
   * Schedule a token refresh before the access token expires
   */
  private scheduleTokenRefresh(): void {
    try {
      const accessToken = this.getAccessToken();
      if (!accessToken) return;
      
      // Clear any existing refresh timeout
      if (this.refreshTokenTimeout) {
        clearTimeout(this.refreshTokenTimeout);
      }
      
      // Parse the JWT to get expiration time
      const payload = JSON.parse(atob(accessToken.split('.')[1]));
      const expiresAt = payload.exp * 1000; // Convert to milliseconds
      const now = Date.now();
      
      // Calculate time until refresh (5 minutes before expiration)
      const timeUntilRefresh = Math.max(0, expiresAt - now - TOKEN_REFRESH_THRESHOLD);
      
      // Schedule the refresh
      this.refreshTokenTimeout = setTimeout(() => {
        this.refreshToken();
      }, timeUntilRefresh);
      
      console.log(`Token refresh scheduled in ${Math.round(timeUntilRefresh / 1000)} seconds`);
    } catch (error) {
      console.error('Error scheduling token refresh:', error);
    }
  }
  
  /**
   * Refresh the access token using the refresh token
   */
  private async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = this.getRefreshToken();
      if (!refreshToken) return false;
      
      // Call the token refresh API
      const response = await apiClient.post<LoginResponse>('/auth/refresh-token', {
        refreshToken
      });
      
      // Update tokens
      this.setTokens(
        response.data.accessToken,
        response.data.refreshToken || refreshToken
      );
      
      return true;
    } catch (error) {
      console.error('Error refreshing token:', error);
      // If refresh fails, clear tokens and force re-login
      this.clearTokens();
      return false;
    }
  }
  
  /**
   * Check if the user is authenticated
   */
  public isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }
  
  /**
   * Login with email and password
   */
  public async loginWithPassword(email: string, password: string): Promise<User> {
    try {
      // Get device fingerprint for enhanced security
      const deviceFingerprint = await securityService.getDeviceFingerprint();
      
      // Evaluate login risk
      const riskAssessment = await securityService.isActionAllowed('login', {
        newDevice: !(await securityService.isDeviceTrusted()),
        email
      });
      
      // If risk is too high, block the attempt
      if (!riskAssessment.allowed) {
        securityService.recordEvent(
          SecurityEventType.LOGIN_FAILURE,
          {
            email,
            reason: 'high_risk',
            riskScore: riskAssessment.riskScore,
            riskReason: riskAssessment.reason
          },
          false
        );
        
        throw new Error(`Login blocked: ${riskAssessment.reason || 'High security risk'}`);
      }
      
      // Call login API
      const response = await apiClient.post<LoginResponse>('/auth/login', {
        email,
        password,
        deviceFingerprint
      });
      
      // Store tokens
      this.setTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
      
      // Mark the password factor as completed
      securityService.completeAuthFactor(AuthFactor.PASSWORD);
      
      // Register device as trusted
      await securityService.trustCurrentDevice();
      
      // Get user data
      const user = await this.fetchUserData();
      
      // Record successful login
      securityService.recordEvent(
        SecurityEventType.LOGIN_SUCCESS,
        {
          email,
          userId: user.id,
          requiresMfa: response.data.requiresMfa
        }
      );
      
      return user;
    } catch (error: any) {
      // Record failed login
      securityService.recordEvent(
        SecurityEventType.LOGIN_FAILURE,
        {
          email,
          error: error.message
        },
        false
      );
      
      throw error;
    }
  }
  
  /**
   * Fetch current user data from the API
   */
  public async fetchUserData(): Promise<User> {
    const response = await apiClient.get<User>('/users/me');
    this.currentUser = response.data;
    this.saveUserData(this.currentUser);
    return this.currentUser;
  }
  
  /**
   * Get the current user data
   */
  public async getCurrentUser(): Promise<User | null> {
    // If we don't have user data but have a token, fetch the data
    if (!this.currentUser && this.isAuthenticated()) {
      try {
        return await this.fetchUserData();
      } catch (error) {
        console.error('Error fetching user data:', error);
        return null;
      }
    }
    
    return this.currentUser;
  }
  
  /**
   * Register a new user
   */
  public async register(
    email: string,
    password: string,
    username?: string
  ): Promise<User> {
    try {
      // Get device fingerprint for enhanced security
      const deviceFingerprint = await securityService.getDeviceFingerprint();
      
      // Evaluate registration risk
      const riskAssessment = await securityService.isActionAllowed('registration', {
        email,
        newDevice: true
      });
      
      // If risk is too high, block the attempt
      if (!riskAssessment.allowed) {
        throw new Error(`Registration blocked: ${riskAssessment.reason || 'High security risk'}`);
      }
      
      // Call register API
      const response = await apiClient.post<LoginResponse>('/auth/register', {
        email,
        password,
        username,
        deviceFingerprint
      });
      
      // Store tokens
      this.setTokens(
        response.data.accessToken,
        response.data.refreshToken
      );
      
      // Mark the password factor as completed
      securityService.completeAuthFactor(AuthFactor.PASSWORD);
      
      // Register device as trusted
      await securityService.trustCurrentDevice();
      
      // Get user data
      const user = await this.fetchUserData();
      
      // Record successful registration
      securityService.recordEvent(
        SecurityEventType.LOGIN_SUCCESS,
        {
          email,
          userId: user.id,
          isNewUser: true
        }
      );
      
      return user;
    } catch (error) {
      console.error('Error during registration:', error);
      throw error;
    }
  }
  
  /**
   * Logout the current user
   */
  public async logout(): Promise<void> {
    try {
      const refreshToken = this.getRefreshToken();
      
      // Attempt to invalidate the token on the server
      if (refreshToken) {
        try {
          await apiClient.post('/auth/logout', { refreshToken });
        } catch (e) {
          // Ignore errors during logout API call
        }
      }
      
      // Record logout event before clearing user data
      securityService.recordEvent(SecurityEventType.LOGOUT, {
        userId: this.currentUser?.id
      });
      
      // Clear tokens and user data
      this.clearTokens();
      
      // Reset completed authentication factors
      securityService.resetAuthFactors();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }
}

// Create and export singleton instance
export const authService = new AuthService();
export default authService;
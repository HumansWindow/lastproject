/**
 * Profile Service
 * 
 * Handles user profile operations after wallet authentication
 */
import { apiClient } from '../services/api/api-client';
import axios from 'axios';
import { UserProfile } from '@/types/api-types';
import apiConfig from '@/config/api.config';
import { secureStorage } from '../utils/secure-storage';

const { API_URL } = apiConfig;

// Token storage key - must match the one used in auth context
const TOKEN_KEY = 'accessToken';

// Create a separate axios instance specifically for profile requests to avoid cache issues
const profileClient = axios.create({
  baseURL: API_URL,
  timeout: 15000,
  headers: {
    'Content-Type': 'application/json',
  }
});

// Copy authorization handling from apiClient
profileClient.interceptors.request.use(async (config) => {
  try {
    // Use secureStorage instead of localStorage directly to match auth context
    const token = secureStorage.getItem(TOKEN_KEY);
    
    if (token) {
      // Ensure Authorization header is properly formatted with Bearer prefix
      config.headers['Authorization'] = token.startsWith('Bearer ') ? token : `Bearer ${token}`;
      
      // Debug token to detect auth issues
      console.debug(`Using token: ${token.substring(0, 20)}...`);
      
      // Add request timestamp for debugging
      config.headers['X-Request-Time'] = new Date().toISOString();
    } else {
      console.warn('No authentication token found for API request');
    }
    
    return config;
  } catch (error) {
    console.error('Error setting auth token in request:', error);
    return config; // Continue with request even if token handling fails
  }
}, (error) => Promise.reject(error));

// Add response interceptor for debugging auth issues
profileClient.interceptors.response.use(
  (response) => {
    // Log successful responses for debugging if needed
    if (process.env.NODE_ENV !== 'production') {
      console.debug(`API Response [${response.config.method}] ${response.config.url}: Status ${response.status}`);
    }
    return response;
  }, 
  (error) => {
    // Enhanced error logging for authentication issues
    if (error.response) {
      const { status, config } = error.response;
      
      // Handle authentication errors
      if (status === 401) {
        console.error(`Authentication failed for request to ${config.url}. Token may be invalid or expired.`);
        
        // Clear secureStorage on auth failures to force re-login
        console.warn('Clearing stored tokens due to authentication failure');
        secureStorage.removeItem(TOKEN_KEY);
        secureStorage.removeItem('refreshToken');
      }
      
      // Log detailed information for other errors
      console.error(`API Error [${config.method}] ${config.url}: Status ${status}`, error.response.data);
    } else if (error.request) {
      // Request was made but no response received (network error)
      console.error('API Request failed (no response):', error.request);
    } else {
      // Error in setting up the request
      console.error('API Request setup error:', error.message);
    }
    
    return Promise.reject(error);
  }
);

/**
 * Service for handling user profile operations
 */
export const profileService = {
  /**
   * Get user profile information
   * @returns User profile data
   */
  async getUserProfile(): Promise<UserProfile> {
    try {
      // Check if token exists before making API call
      const token = secureStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.debug('No auth token found, skipping profile fetch');
        return {} as UserProfile; // Return empty profile if not authenticated
      }
      
      // Use the non-cached client for profile requests to avoid adapter issues
      const response = await profileClient.get('/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  },

  /**
   * Update user profile information
   * @param data Profile data to update
   * @returns Updated user profile
   */
  async updateUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      const response = await profileClient.put('/profile', data);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  },

  /**
   * Complete user profile after wallet authentication
   * This is used for first-time users who authenticated with wallet
   * @param data Profile data to save
   * @returns Completed user profile
   */
  async completeUserProfile(data: Partial<UserProfile>): Promise<UserProfile> {
    try {
      // Verify token before making the request
      const token = secureStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.error('No authentication token found when trying to complete profile');
      }
      
      const response = await profileClient.post('/profile/complete', data);
      return response.data;
    } catch (error) {
      console.error('Error completing user profile:', error);
      throw error;
    }
  },

  /**
   * Mark profile as "complete later"
   * This allows users to skip profile completion for now
   * @returns Updated user profile with completeLater flag
   */
  async markCompleteLater(): Promise<UserProfile> {
    try {
      const response = await profileClient.post('/profile/complete-later', {
        completeLater: true
      });
      return response.data;
    } catch (error) {
      console.error('Error marking profile as complete later:', error);
      throw error;
    }
  },

  /**
   * Check if user profile is complete
   * @returns Boolean indicating if profile is complete
   */
  async isProfileComplete(): Promise<boolean> {
    try {
      // Check if token exists before making API call
      const token = secureStorage.getItem(TOKEN_KEY);
      if (!token) {
        console.debug('No auth token found, profile considered incomplete');
        return false;
      }
      
      const profile = await this.getUserProfile();
      // All fields are optional now - profile is considered complete
      // if user has authenticated or if they've chosen to complete it later
      return !!profile.completeLater || !!profile.id;
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return false;
    }
  }
};

export default profileService;
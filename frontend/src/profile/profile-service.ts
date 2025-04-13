/**
 * Profile Service
 * 
 * Handles user profile operations after wallet authentication
 */
import { apiClient } from '../services/api/api-client';
import { UserProfile } from '@/types/api-types';

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
      const response = await apiClient.get('/users/profile');
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
      const response = await apiClient.put('/users/profile', data);
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
      const response = await apiClient.post('/users/profile/complete', data);
      return response.data;
    } catch (error) {
      console.error('Error completing user profile:', error);
      throw error;
    }
  },

  /**
   * Check if user profile is complete
   * @returns Boolean indicating if profile is complete
   */
  async isProfileComplete(): Promise<boolean> {
    try {
      const profile = await this.getUserProfile();
      // Check if essential fields are completed
      // You can customize this logic based on your requirements
      return !!(
        profile.firstName && 
        profile.lastName && 
        profile.email
      );
    } catch (error) {
      console.error('Error checking profile completeness:', error);
      return false;
    }
  }
};

export default profileService;
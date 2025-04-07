import { apiClient } from '../../api-client';

/**
 * User service for user-related operations
 */
class UserService {
  /**
   * Get the current user's profile
   * @returns Promise with user profile data
   */
  async getUserProfile(): Promise<any> {
    try {
      const response = await apiClient.get('/user/profile');
      return response.data;
    } catch (error) {
      console.error('Error fetching user profile:', error);
      throw error;
    }
  }

  /**
   * Update the current user's profile
   * @param profileData Profile data to update
   * @returns Promise with updated profile
   */
  async updateUserProfile(profileData: any): Promise<any> {
    try {
      const response = await apiClient.put('/user/profile', profileData);
      return response.data;
    } catch (error) {
      console.error('Error updating user profile:', error);
      throw error;
    }
  }

  /**
   * Update user profile picture
   * @param imageFile Profile image file
   * @returns Promise with update result
   */
  async updateProfilePicture(imageFile: File): Promise<any> {
    try {
      const formData = new FormData();
      formData.append('profileImage', imageFile);
      
      const response = await apiClient.post('/user/profile-picture', formData, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });
      return response.data;
    } catch (error) {
      console.error('Error updating profile picture:', error);
      throw error;
    }
  }

  /**
   * Get user settings
   * @returns Promise with user settings
   */
  async getUserSettings(): Promise<any> {
    try {
      const response = await apiClient.get('/user/settings');
      return response.data;
    } catch (error) {
      console.error('Error fetching user settings:', error);
      throw error;
    }
  }

  /**
   * Update user settings
   * @param settings Settings to update
   * @returns Promise with updated settings
   */
  async updateUserSettings(settings: any): Promise<any> {
    try {
      const response = await apiClient.put('/user/settings', settings);
      return response.data;
    } catch (error) {
      console.error('Error updating user settings:', error);
      throw error;
    }
  }

  /**
   * Get user's connected devices
   * @returns Promise with list of devices
   */
  async getConnectedDevices(): Promise<any> {
    try {
      const response = await apiClient.get('/user/devices');
      return response.data;
    } catch (error) {
      console.error('Error fetching connected devices:', error);
      throw error;
    }
  }

  /**
   * Remove a connected device
   * @param deviceId ID of device to remove
   * @returns Promise with removal result
   */
  async removeDevice(deviceId: string): Promise<any> {
    try {
      const response = await apiClient.delete(`/user/devices/${deviceId}`);
      return response.data;
    } catch (error) {
      console.error(`Error removing device ${deviceId}:`, error);
      throw error;
    }
  }
}

// Create singleton instance
export const userService = new UserService();

// Default export
export default userService;
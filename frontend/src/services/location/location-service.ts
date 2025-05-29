/**
 * Location Service
 * 
 * Provides functionality for detecting and managing user location information
 */

import { profileService, GeoLocationData } from "@/profile/profileService";

class LocationService {
  /**
   * Detect user's location using browser APIs and IP geolocation
   * 
   * @returns Promise<GeoLocationData> Location data including country, city, timezone, etc.
   */
  async detectLocation(): Promise<GeoLocationData> {
    try {
      // Use the existing profileService to detect location
      return await profileService.detectLocation();
    } catch (error) {
      console.error('Location detection failed:', error);
      throw new Error('Failed to detect location');
    }
  }

  /**
   * Get browser language preference
   * 
   * @returns string Language code (e.g., 'en', 'fr')
   */
  getBrowserLanguage(): string {
    return navigator.language.split('-')[0] || 'en';
  }

  /**
   * Get browser timezone
   * 
   * @returns string Timezone
   */
  getBrowserTimezone(): string {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }

  /**
   * Save user location preferences
   * 
   * @param locationData Location data to save
   * @returns Promise<void>
   */
  async saveLocationPreferences(locationData: {
    country?: string;
    city?: string;
    timezone?: string;
    language?: string;
  }): Promise<void> {
    try {
      // Use the profile service to update user preferences
      await profileService.updateUserProfile({
        country: locationData.country,
        city: locationData.city,
        timezone: locationData.timezone,
        language: locationData.language,
      });
    } catch (error) {
      console.error('Failed to save location preferences:', error);
      throw new Error('Failed to save location preferences');
    }
  }
}

export const locationService = new LocationService();
export default locationService;
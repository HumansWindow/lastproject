/**
 * Security Modules Index
 * 
 * This file centralizes exports from all security modules
 */

// Re-export the device fingerprint functionality
export { 
  getDeviceFingerprint,
  generateDeviceFingerprint,
  collectDeviceInfo,
  type DeviceInfo
} from './device-fingerprint';

// Security service utilities
export const securityUtils = {
  /**
   * Check if device is trusted
   */
  isDeviceTrusted: async (): Promise<boolean> => {
    try {
      // Check if device fingerprint exists in local storage
      const fingerprint = localStorage.getItem('deviceFingerprint');
      return !!fingerprint;
    } catch (err) {
      console.error('Error checking if device is trusted:', err);
      return false;
    }
  }
};
/**
 * Authentication Service Bridge
 * Provides backward compatibility for existing code that uses the old authentication APIs
 */

import { authService } from './index';
import { walletAuthService } from './index';

// Re-export the auth service with previous API method names
export const authServiceBridge = {
  // Map the old methods to the new implementations
  getUserProfile: authService.getUserProfile.bind(authService),
  logout: authService.logout.bind(authService),
  isAuthenticated: authService.isAuthenticated.bind(authService),
  
  // Legacy methods with appropriate mappings
  clearStorageData: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('deviceFingerprint');
    console.log('Storage data cleared via legacy method');
  }
};

export const walletAuthServiceBridge = {
  // Map the old methods to the new implementations
  authenticate: walletAuthService.authenticate.bind(walletAuthService),
  requestChallenge: walletAuthService.requestChallenge.bind(walletAuthService),
  
  // Legacy methods with appropriate mappings
  getChallenge: walletAuthService.requestChallenge.bind(walletAuthService)
};

// Export for backward compatibility
export default authServiceBridge;

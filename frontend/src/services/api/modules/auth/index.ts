/**
 * Authentication Services Exports
 * This file centralizes all authentication-related exports
 * to provide a consistent import path across the application.
 */

// Import services
import authServiceImpl from './auth-service';
import walletAuthServiceImpl from './wallet-auth-service';

// Import types from auth services
import type { AuthResponse as BasicAuthResponse } from './auth-service';
import type { WalletChallenge, WalletAuthRequest, AuthResponse as WalletAuthResponse } from './wallet-auth-service';

// Create an extended AuthResponse type that includes all fields from both implementations
export interface AuthResponse extends BasicAuthResponse {
  userId?: string;
  success?: boolean;
  error?: string;
}

// Export other types
export type { WalletChallenge, WalletAuthRequest };

// Export services
export { authServiceImpl, walletAuthServiceImpl };
export const authService = authServiceImpl;
export const walletAuthService = walletAuthServiceImpl;

// Create a unified auth service interface for consistent usage
export const unifiedAuthService = {
  // Common methods
  isAuthenticated: () => {
    return !!localStorage.getItem('accessToken');
  },
  
  getUserProfile: async () => {
    return authService.getUserProfile();
  },
  
  logout: async () => {
    return authService.logout();
  },

  // Wallet-specific methods
  wallet: {
    getChallenge: async (walletAddress: string) => {
      return walletAuthService.requestChallenge(walletAddress);
    },
    
    authenticate: async (request: WalletAuthRequest) => {
      return walletAuthService.authenticate(request);
    },
    
    isLinked: async (walletAddress: string) => {
      return walletAuthService.isWalletLinked(walletAddress);
    }
  }
};

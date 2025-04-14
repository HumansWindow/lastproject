import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import walletService from '../services/wallet';
import { profileService } from '../profile/profile-service';
import { useWallet } from './wallet';
import { UserProfile } from '@/types/api-types';
import { secureStorage } from '../utils/secure-storage';

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  isProfileComplete: boolean;
  
  authenticateWithWallet: (email?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  completeUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const TOKEN_KEY = 'accessToken';
const REFRESH_TOKEN_KEY = 'refreshToken';
const USER_KEY = 'user_profile';
const DEVICE_VERIFICATION_KEY = 'device_verification';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, walletInfo } = useWallet();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  
  // Initialize user from local storage and fetch current profile if authenticated
  useEffect(() => {
    const init = async () => {
      // Use secure storage instead of localStorage directly
      const token = secureStorage.getItem(TOKEN_KEY);
      
      if (token) {
        try {
          // We have a token, fetch the latest profile
          const profile = await profileService.getUserProfile();
          setUser(profile);
          setIsAuthenticated(true);
          
          // Check if profile is complete
          setIsProfileComplete(!!(
            profile.firstName && 
            profile.lastName && 
            (profile.email || profile.walletAddresses?.length)
          ));
        } catch (err) {
          // Invalid token or other error, clear it
          console.error('Error initializing user:', err);
          secureStorage.removeItem(TOKEN_KEY);
          secureStorage.removeItem(REFRESH_TOKEN_KEY);
          secureStorage.removeItem(USER_KEY);
          secureStorage.removeItem(DEVICE_VERIFICATION_KEY);
        }
      }
      
      setIsLoading(false);
    };
    
    init();
  }, []);
  
  const authenticateWithWallet = async (email?: string) => {
    if (!isConnected || !walletInfo) {
      setError('No wallet connected');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get challenge directly from the wallet service instead of auth property
      const challenge = await walletService.getChallenge(walletInfo.address);
      
      // Request user to sign the challenge
      const signature = await walletService.signMessage(challenge, walletInfo);
      
      // Generate device fingerprint for security
      const deviceFingerprint = await generateDeviceFingerprint();
      
      // Call authenticate directly on the wallet service instead of auth property
      const result = await walletService.authenticate(
        walletInfo,
        signature,
        email,
        challenge,
        deviceFingerprint
      );
      
      if (result.success && result.token && result.refreshToken) {
        // Store tokens securely
        secureStorage.setItem(TOKEN_KEY, result.token);
        secureStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
        secureStorage.setItem(DEVICE_VERIFICATION_KEY, deviceFingerprint);
        
        try {
          // Fetch the user profile
          const profile = await profileService.getUserProfile();
          setUser(profile);
          
          // Store user in secure storage
          secureStorage.setItem(USER_KEY, JSON.stringify(profile));
          
          // Check profile completeness
          const isComplete = !!(
            profile.firstName && 
            profile.lastName && 
            (profile.email || profile.walletAddresses?.length)
          );
          setIsProfileComplete(isComplete);
          
          setIsAuthenticated(true);
          return true;
        } catch (profileErr) {
          console.error('Error fetching profile after authentication:', profileErr);
          // Even if profile fetch fails, user is still authenticated
          setIsAuthenticated(true);
          setIsProfileComplete(false);
          return true;
        }
      } else {
        setError(result.error || 'Authentication failed');
        return false;
      }
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Authentication error');
      return false;
    } finally {
      setIsLoading(false);
    }
  };
  
  // Generate a device fingerprint for additional security
  const generateDeviceFingerprint = async (): Promise<string> => {
    // This is a simplified version - in production you'd use a more sophisticated fingerprinting method
    const userAgent = navigator.userAgent;
    const screenInfo = `${window.screen.width}x${window.screen.height}x${window.screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;
    
    // Create a string that combines device attributes
    const fingerprintString = `${userAgent}|${screenInfo}|${timezone}|${language}`;
    
    // Create a hash of the string (in production, use a proper hashing function)
    let hash = 0;
    for (let i = 0; i < fingerprintString.length; i++) {
      const char = fingerprintString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    
    return hash.toString(16);
  };
  
  const logout = async () => {
    try {
      const refreshToken = secureStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (refreshToken) {
        // Try to logout on backend
        await walletService.logout(refreshToken);
      }
      
      // Clear secure storage
      secureStorage.removeItem(TOKEN_KEY);
      secureStorage.removeItem(REFRESH_TOKEN_KEY);
      secureStorage.removeItem(USER_KEY);
      secureStorage.removeItem(DEVICE_VERIFICATION_KEY);
      
      // Clear state
      setUser(null);
      setIsAuthenticated(false);
      setIsProfileComplete(false);
      
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Logout error');
      return false;
    }
  };
  
  const updateUserProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!isAuthenticated) return false;
      
      const updatedProfile = await profileService.updateUserProfile(data);
      
      // Update local state
      setUser(updatedProfile);
      secureStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
      
      // Check profile completeness
      const isComplete = !!(
        updatedProfile.firstName && 
        updatedProfile.lastName && 
        (updatedProfile.email || updatedProfile.walletAddresses?.length)
      );
      setIsProfileComplete(isComplete);
      
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to update profile');
      return false;
    }
  };
  
  const completeUserProfile = async (data: Partial<UserProfile>) => {
    try {
      if (!isAuthenticated) return false;
      
      const completedProfile = await profileService.completeUserProfile(data);
      
      // Update local state
      setUser(completedProfile);
      secureStorage.setItem(USER_KEY, JSON.stringify(completedProfile));
      setIsProfileComplete(true);
      
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to complete profile');
      return false;
    }
  };
  
  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isLoading,
        error,
        isProfileComplete,
        authenticateWithWallet,
        logout,
        updateUserProfile,
        completeUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  
  return context;
};

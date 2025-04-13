import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import walletService from '../services/wallet';
import { profileService } from '../profile/profile-service';
import { useWallet } from './wallet';
import { UserProfile } from '@/types/api-types';

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
      const token = localStorage.getItem(TOKEN_KEY);
      
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
          localStorage.removeItem(TOKEN_KEY);
          localStorage.removeItem(REFRESH_TOKEN_KEY);
          localStorage.removeItem(USER_KEY);
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
      
      const result = await walletService.authenticate(email);
      
      if (result.success && result.token && result.refreshToken) {
        // Store tokens
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
        
        try {
          // Fetch the user profile
          const profile = await profileService.getUserProfile();
          setUser(profile);
          
          // Store user in localStorage
          localStorage.setItem(USER_KEY, JSON.stringify(profile));
          
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
  
  const logout = async () => {
    try {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (refreshToken) {
        // Try to logout on backend
        await walletService.logout(refreshToken);
      }
      
      // Clear local storage
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(REFRESH_TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
      
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
      localStorage.setItem(USER_KEY, JSON.stringify(updatedProfile));
      
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
      localStorage.setItem(USER_KEY, JSON.stringify(completedProfile));
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

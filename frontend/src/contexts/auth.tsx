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
      
      console.log("Starting wallet authentication process in auth context for", walletInfo.address);
      
      // 1. Get challenge with proper error handling and retry logic
      let challenge = ''; // Initialize with empty string to avoid "used before assigned" error
      let challengeAttempts = 0;
      const maxChallengeAttempts = 3;
      let challengeDelay = 1000;
      
      while (challengeAttempts < maxChallengeAttempts) {
        try {
          console.log(`Challenge attempt ${challengeAttempts + 1}/${maxChallengeAttempts}`);
          const challengeResult = await walletService.getChallenge(walletInfo.address);
          if (!challengeResult) {
            throw new Error("Empty challenge received");
          }
          challenge = challengeResult;
          console.log("Challenge received successfully:", challenge.substring(0, 20) + "...");
          break; // Success, exit the retry loop
        } catch (challengeError) {
          challengeAttempts++;
          console.error(`Challenge attempt ${challengeAttempts} failed:`, challengeError);
          
          if (challengeAttempts >= maxChallengeAttempts) {
            throw new Error(`Failed to get authentication challenge after ${maxChallengeAttempts} attempts: ${challengeError instanceof Error ? challengeError.message : String(challengeError)}`);
          }
          
          // Wait before retrying
          console.log(`Retrying challenge in ${challengeDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, challengeDelay));
          challengeDelay *= 1.5; // Increase delay for next retry
        }
      }
      
      // Verify that we actually got a challenge
      if (!challenge) {
        throw new Error("Failed to obtain a valid challenge");
      }
      
      // 2. Request user to sign the challenge with better error handling
      let signature = ''; // Initialize with empty string to avoid type issues
      let signAttempts = 0;
      const maxSignAttempts = 2; // Fewer retries for signing since it requires user interaction
      
      while (signAttempts < maxSignAttempts) {
        try {
          console.log(`Requesting wallet signature (attempt ${signAttempts + 1}/${maxSignAttempts})...`);
          const signResult = await walletService.signMessage(challenge, walletInfo);
          if (!signResult) {
            throw new Error("Empty signature received");
          }
          signature = signResult;
          console.log("Signature received successfully:", signature.substring(0, 15) + "...");
          break; // Success, exit the retry loop
        } catch (signError) {
          signAttempts++;
          console.error(`Signature attempt ${signAttempts} error:`, signError);
          
          // Check for user rejection specifically - don't retry in this case
          if (signError instanceof Error && 
              (signError.message.includes('denied') || 
               signError.message.includes('rejected') ||
               signError.message.includes('User denied'))) {
            throw new Error('User denied message signature');
          }
          
          if (signAttempts >= maxSignAttempts) {
            throw new Error(`Failed to sign message after ${maxSignAttempts} attempts: ${signError instanceof Error ? signError.message : String(signError)}`);
          }
          
          // Brief delay before retrying
          console.log("Retrying signature request in 1000ms...");
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      // Verify that we actually got a signature
      if (!signature) {
        throw new Error("Failed to obtain a valid signature");
      }
      
      // 3. Generate device fingerprint for security
      console.log("Generating device fingerprint");
      const deviceFingerprint = await generateDeviceFingerprint();
      
      // 4. Call authenticate with proper error handling and retry logic
      let result = undefined; // Initialize to explicitly track undefined state
      let authAttempts = 0;
      const maxAuthAttempts = 3;
      let authDelay = 1000;
      
      while (authAttempts < maxAuthAttempts) {
        try {
          console.log(`Sending authentication request to backend (attempt ${authAttempts + 1}/${maxAuthAttempts})`);
          const authResult = await walletService.authenticate(
            walletInfo,
            signature,
            challenge,
            email,
            deviceFingerprint
          );
          console.log("Authentication response received:", authResult.success ? 'Success' : 'Failed');
          
          // Assign the result to our variable
          result = authResult;
          
          if (!authResult.success) {
            const errorMsg = authResult.error || 'Authentication failed with no specific error';
            console.error("Authentication response error:", errorMsg);
            
            // Determine if we should retry based on the error
            if (errorMsg.includes('500') || 
                errorMsg.includes('server error') || 
                errorMsg.includes('timeout') ||
                errorMsg.includes('network')) {
              authAttempts++;
              
              if (authAttempts >= maxAuthAttempts) {
                throw new Error(`Backend authentication failed after ${maxAuthAttempts} attempts: ${errorMsg}`);
              }
              
              console.log(`Retrying authentication in ${authDelay}ms...`);
              await new Promise(resolve => setTimeout(resolve, authDelay));
              authDelay *= 1.5; // Increase delay for next retry
              continue;
            }
            
            // Non-retryable error
            throw new Error(errorMsg);
          }
          
          // Success! We have a valid result
          break;
        } catch (authError) {
          authAttempts++;
          console.error(`Authentication attempt ${authAttempts} error:`, authError);
          
          // Determine if we should retry
          const errorMessage = authError instanceof Error ? authError.message : String(authError);
          const isServerError = 
            errorMessage.includes('500') || 
            errorMessage.includes('server error') || 
            errorMessage.includes('timeout') ||
            errorMessage.includes('network');
            
          if (!isServerError || authAttempts >= maxAuthAttempts) {
            throw new Error(`Backend authentication failed: ${errorMessage}`);
          }
          
          console.log(`Retrying authentication in ${authDelay}ms...`);
          await new Promise(resolve => setTimeout(resolve, authDelay));
          authDelay *= 1.5; // Increase delay for next retry
        }
      }
      
      // Validate that we have a result and required tokens
      if (!result) {
        throw new Error('Authentication failed: No result received');
      }
      
      if (!result.token || !result.refreshToken) {
        throw new Error('Authentication successful but no tokens returned');
      }
      
      // 5. Store tokens securely
      console.log("Storing authentication tokens");
      secureStorage.setItem(TOKEN_KEY, result.token);
      secureStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      secureStorage.setItem(DEVICE_VERIFICATION_KEY, deviceFingerprint);
      
      // 6. Fetch the user profile with retry logic
      let profile;
      let profileAttempts = 0;
      const maxProfileAttempts = 2;
      
      while (profileAttempts < maxProfileAttempts) {
        try {
          console.log(`Fetching user profile (attempt ${profileAttempts + 1}/${maxProfileAttempts})`);
          profile = await profileService.getUserProfile();
          console.log("Profile retrieved successfully");
          break;
        } catch (profileErr) {
          profileAttempts++;
          console.error(`Profile fetch attempt ${profileAttempts} failed:`, profileErr);
          
          if (profileAttempts >= maxProfileAttempts) {
            console.warn('Failed to fetch profile after authentication, but authentication was successful');
            // We don't throw here since auth was successful - we'll try to fetch the profile later
            break;
          }
          
          // Brief delay before retrying
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
      
      if (profile) {
        setUser(profile);
        secureStorage.setItem(USER_KEY, JSON.stringify(profile));
        
        // Check profile completeness
        const isComplete = !!(
          profile.firstName && 
          profile.lastName && 
          (profile.email || profile.walletAddresses?.length)
        );
        setIsProfileComplete(isComplete);
      }
      
      setIsAuthenticated(true);
      return true;
    } catch (err: unknown) {
      // Comprehensive error handling
      console.error("Authentication process failed:", err);
      const errorMessage = err instanceof Error ? err.message : 'Unknown authentication error';
      setError(errorMessage);
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

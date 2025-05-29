import React, { createContext, useContext, useEffect, useState, ReactNode, useMemo, useCallback } from 'react';
import walletService from "../services/wallet/walletService";
import { profileService } from "../profile/profileService";
import { useWallet } from "../contexts/WalletProvider";
import { UserProfile } from "@/types/apiTypes";
import { secureStorage, clearCorruptedStorage } from "../utils/secureStorage";
import { authService } from '../services/api/modules/auth';
import { AuthResponse } from '../services/api/modules/auth'; // Import from the main auth module
import { WalletInfo, WalletProviderType, BlockchainType } from '../services/wallet/core/walletBase';
import { walletSelector } from '../services/wallet';
// Using only the standardized blockchain constants file
import { DEFAULT_BLOCKCHAIN_NETWORK, normalizeBlockchainType } from '../config/blockchain/constants';

// TypeScript declarations for custom window properties
declare global {
  interface Window {
    trustWalletFixer?: {
      fixAuthentication: () => Promise<void>;
      isReady: () => boolean;
    };
  }
}

interface AuthContextType {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  isAuthenticating: boolean; // New state for tracking authentication process
  authStage: string; // New state for tracking the stage of authentication
  error: string | null;
  isProfileComplete: boolean;
  
  authenticateWithWallet: (blockchainType?: string, email?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  updateUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
  completeUserProfile: (data: Partial<UserProfile>) => Promise<boolean>;
}

// Helper function to get blockchain name from BlockchainType enum
const getBlockchainName = (blockchain: BlockchainType | string): string => {
  if (typeof blockchain === 'string') return blockchain.toLowerCase();
  
  switch (blockchain) {
    case BlockchainType.ETHEREUM:
      return 'ethereum';
    case BlockchainType.BINANCE:
      return 'binance';
    case BlockchainType.SOLANA:
      return 'solana';
    case BlockchainType.POLYGON:
      return DEFAULT_BLOCKCHAIN_NETWORK;
    case BlockchainType.TON:
      return 'ton';
    default:
      return DEFAULT_BLOCKCHAIN_NETWORK; // Default to polygon if unknown
  }
};

// Helper function to get blockchain name from wallet info
const getBlockchainNameFromWallet = (walletInfo: WalletInfo): string => {
  // If wallet info has blockchain property, use it
  if (walletInfo.blockchain) {
    return getBlockchainName(walletInfo.blockchain);
  }
  
  // Otherwise, determine blockchain from provider type or chain ID
  if (walletInfo.providerType === WalletProviderType.PHANTOM) {
    return 'solana';
  } else if (walletInfo.providerType === WalletProviderType.BINANCE) {
    return 'binance';
  } else {
    // Default for MetaMask, Trust Wallet, etc. based on chainId
    if (walletInfo.chainId) {
      const chainIdNum = typeof walletInfo.chainId === 'string' ? 
        parseInt(walletInfo.chainId, 16) : walletInfo.chainId;
      
      // Handle common EVM chains
      switch (chainIdNum) {
        case 1: return 'ethereum';
        case 56: return 'binance';
        case 137: return 'polygon';
        default: return 'ethereum'; // Default to ethereum
      }
    }
  }
  
  // Fallback to default
  return DEFAULT_BLOCKCHAIN_NETWORK;
};

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
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false); // New state
  const [authStage, setAuthStage] = useState<string>(''); // New state
  const [error, setError] = useState<string | null>(null);
  const [isProfileComplete, setIsProfileComplete] = useState<boolean>(false);
  
  // Initialize user from local storage and fetch current profile if authenticated
  useEffect(() => {
    const init = async () => {
      try {
        // First try to clear any corrupted storage that might be causing issues
        const hasCorruptedStorage = secureStorage.getItem('_corrupted_flag') === 'true';
        if (hasCorruptedStorage) {
          console.warn('Detected previously corrupted storage, cleaning up...');
          clearCorruptedStorage();
          secureStorage.removeItem('_corrupted_flag');
        }
        
        // Use secure storage instead of localStorage directly
        const token = secureStorage.getItem(TOKEN_KEY);
        
        // Only proceed with profile fetch if we have a token
        if (token) {
          console.debug('Found stored auth token, will fetch profile');
          try {
            // We have a token, fetch the latest profile
            const profile = await profileService.getUserProfile();
            
            // Only set user if we got a non-empty profile
            if (profile && Object.keys(profile).length > 0) {
              setUser(profile);
              setIsAuthenticated(true);
              
              // Check if profile is complete
              setIsProfileComplete(!!(
                profile.firstName && 
                profile.lastName && 
                (profile.email ?? profile.walletAddresses?.length)
              ));
            } else {
              console.debug('Empty profile returned despite valid token, clearing auth state');
              secureStorage.removeItem(TOKEN_KEY);
              secureStorage.removeItem(REFRESH_TOKEN_KEY);
              secureStorage.removeItem(USER_KEY);
            }
          } catch (err) {
            // Invalid token or other error, clear it
            console.error('Error initializing user:', err);
            secureStorage.removeItem(TOKEN_KEY);
            secureStorage.removeItem(REFRESH_TOKEN_KEY);
            secureStorage.removeItem(USER_KEY);
            secureStorage.removeItem(DEVICE_VERIFICATION_KEY);
          }
        } else {
          console.debug('No auth token found, skipping profile fetch');
        }
      } catch (e) {
        console.error('Error during auth initialization:', e);
        // Mark storage as corrupted for next reload
        secureStorage.setItem('_corrupted_flag', 'true');
      } finally {
        setIsLoading(false);
      }
    };
    
    init();
  }, []);
  
  // Helper function to get challenge from wallet service with retry logic
  const getAuthChallenge = useCallback(async (address: string, blockchainType?: string): Promise<string> => {
    let challenge = '';
    let challengeAttempts = 0;
    const maxChallengeAttempts = 3;
    let challengeDelay = 1000;
    
    while (challengeAttempts < maxChallengeAttempts) {
      try {
        console.log(`Challenge attempt ${challengeAttempts + 1}/${maxChallengeAttempts}`);
        // Pass blockchain type when getting challenge if available
        const challengeResult = blockchainType 
          ? await walletService.getChallengeWithBlockchain(address, blockchainType)
          : await walletService.getChallenge(address);
        
        if (!challengeResult) {
          throw new Error("Empty challenge received");
        }
        
        // Handle different challenge response formats
        if (typeof challengeResult === 'string') {
          challenge = challengeResult;
        } else {
          setAuthStage('processing challenge');
          // If the challenge result contains a message, use it; if not, try to use the nonce
          // This ensures compatibility with different backend implementations
          const messageToSign = 
               (challengeResult as any)?.message ||
               (challengeResult as any)?.nonce;
          
          // Validate messageToSign and throw an error if it's empty
          if (!messageToSign) {
            throw new Error('Authentication challenge is missing both message and nonce.');
          }
        }
        
        console.log("Challenge received successfully:", challenge.substring(0, 20) + "...");
        return challenge;
      } catch (challengeError) {
        challengeAttempts++;
        console.error(`Challenge attempt ${challengeAttempts} failed:`, challengeError);
        
        if (challengeAttempts >= maxChallengeAttempts) {
          throw new Error(`Failed to get authentication challenge after ${maxChallengeAttempts} attempts: ${challengeError instanceof Error ? challengeError.message : String(challengeError)}`);
        }
        
        console.log(`Retrying challenge in ${challengeDelay}ms...`);
        await new Promise(resolve => setTimeout(resolve, challengeDelay));
        challengeDelay *= 1.5; // Increase delay for next retry
      }
    }
    
    return challenge;
  }, []);
  
  // Helper function to sign challenge with retry logic
  const signWalletChallenge = useCallback(async (challenge: string): Promise<string> => {
    let signature = '';
    let signAttempts = 0;
    const maxSignAttempts = 2; // Fewer retries for signing since it requires user interaction
    
    while (signAttempts < maxSignAttempts) {
      try {
        console.log(`Requesting wallet signature (attempt ${signAttempts + 1}/${maxSignAttempts})...`);
        const signResult = await walletService.signMessage(challenge);
        
        if (!signResult) {
          throw new Error("Empty signature received");
        }
        
        // Extract signature from result, handling different response formats
        if (typeof signResult === 'string') {
          signature = signResult;
        } else if (typeof signResult === 'object' && signResult !== null) {
          // Define potential response types
          type SignatureResponse = {
            signature?: string | { toString(): string };
            toString?: () => string;
          };
          
          // Cast to our expected type
          const typedResult = signResult as SignatureResponse;
          
          // Check explicitly for signature property
          if ('signature' in typedResult && typedResult.signature) {
            if (typeof typedResult.signature === 'string') {
              signature = typedResult.signature;
            } else if (typedResult.signature && typeof typedResult.signature === 'object' && 
                       'toString' in typedResult.signature && 
                       typeof typedResult.signature.toString === 'function') {
              signature = typedResult.signature.toString();
            } else {
              signature = String(typedResult.signature);
            }
          }
          // If no signature property, try using toString if available
          else if (typeof typedResult.toString === 'function') {
            signature = typedResult.toString();
          }
        }
                      
        console.log("Signature received successfully:", signature.substring(0, 15) + "...");
        return signature;
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
        
        console.log("Retrying signature request in 1000ms...");
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return signature;
  }, []);
  
  // Helper function to check if an error is retryable
  const isRetryableError = useCallback((errorMsg: string): boolean => {
    return errorMsg.includes('500') || 
      errorMsg.includes('server error') || 
      errorMsg.includes('timeout') ||
      errorMsg.includes('network');
  }, []);

  // Helper function to handle retry delay
  const handleRetryDelay = useCallback(async (delay: number): Promise<number> => {
    await new Promise(resolve => setTimeout(resolve, delay));
    return delay * 1.5; // Increase delay for next retry
  }, []);
  
  // Helper function to process authentication result
  const processAuthResult = useCallback((authResult: AuthResponse): { success: boolean; result?: any; errorMsg?: string } => {
    // Log authentication response status
    if (authResult.accessToken) {
      console.log('✅ Authentication successful: Access token received, treating as valid authentication');
    } else if (authResult.success) {
      console.log('✅ Authentication successful: Backend reported success flag');
    } else {
      console.log('❌ Authentication failed: No access token or success flag');
    }

    // Check if authentication was successful
    if (!authResult.success && !authResult.accessToken) {
      const errorMsg = authResult.error ?? 'Authentication failed with no specific error';
      console.error("Authentication response error:", errorMsg);
      return { success: false, errorMsg };
    }
    
    // If we have user data, make sure to adapt userId if needed
    if (authResult.user && !authResult.userId && authResult.user.id) {
      authResult.userId = authResult.user.id;
    }
    
    return { success: true, result: authResult };
  }, []);
  
  // Helper function to handle backend authentication with retry logic
  const performBackendAuth = useCallback(async (
    walletInfo: any, 
    signature: string, 
    challenge: string, 
    blockchainType?: string,
    email?: string, 
    deviceFingerprint?: string
  ) => {
    let authAttempts = 0;
    const maxAuthAttempts = 3;
    let authDelay = 1000;
    
    while (authAttempts < maxAuthAttempts) {
      try {
        console.log(`Sending authentication request to backend (attempt ${authAttempts + 1}/${maxAuthAttempts})`);
        
        // Log authentication payload details (for debugging)
        console.log('Authentication payload:', {
          address: walletInfo.address,
          signatureLength: signature.length,
          challenge: challenge.substring(0, 20) + '...',
          blockchain: blockchainType || (walletInfo.blockchain ? getBlockchainName(walletInfo.blockchain) : 'not specified'),
          hasEmail: !!email,
          hasDeviceFingerprint: !!deviceFingerprint
        });
        
        // Convert chainId from string to number if needed
        const adaptedWalletInfo = {
          ...walletInfo,
          chainId: typeof walletInfo.chainId === 'string' ? parseInt(walletInfo.chainId, 10) : walletInfo.chainId,
          // Ensure blockchain type is included
          blockchain: blockchainType || (walletInfo.blockchain ? getBlockchainName(walletInfo.blockchain) : 'ethereum')
        };
        
        const authResult = await walletService.authenticate(
          adaptedWalletInfo,
          signature,
          challenge,
          email,
          deviceFingerprint
        );
        
        console.log("Authentication response received:", 
          authResult ? JSON.stringify({
            hasToken: !!authResult.accessToken,
            hasRefreshToken: !!authResult.refreshToken,
            hasError: !!authResult.error,
            success: authResult.success,
            userId: authResult.userId
          }) : 'No response'
        );

        // Process the authentication result
        const processed = processAuthResult(authResult);
        
        if (!processed.success) {
          // Check if error is retryable
          if (isRetryableError(processed.errorMsg!)) {
            authAttempts++;
            
            // Check if we've reached max attempts
            if (authAttempts >= maxAuthAttempts) {
              throw new Error(`Backend authentication failed after ${maxAuthAttempts} attempts: ${processed.errorMsg}`);
            }
            
            // Wait before retrying
            console.log(`Retrying authentication in ${authDelay}ms...`);
            authDelay = await handleRetryDelay(authDelay);
            continue;
          }
          
          // Non-retryable error
          throw new Error(processed.errorMsg);
        }
        
        return processed.result;
      } catch (authError) {
        authAttempts++;
        console.error(`Authentication attempt ${authAttempts} error:`, authError);
        
        const errorMessage = authError instanceof Error ? authError.message : String(authError);
        
        // Check if error is retryable
        if (!isRetryableError(errorMessage) || authAttempts >= maxAuthAttempts) {
          throw new Error(`Backend authentication failed: ${errorMessage}`);
        }
        
        // Wait before retrying
        console.log(`Retrying authentication in ${authDelay}ms...`);
        authDelay = await handleRetryDelay(authDelay);
      }
    }
    
    throw new Error('Authentication failed: Maximum attempts reached');
  }, [isRetryableError, handleRetryDelay, processAuthResult]);
  
  // Helper function to fetch user profile with retry logic
  const fetchUserProfileWithRetry = useCallback(async (): Promise<any> => {
    let profile = null;
    let profileAttempts = 0;
    const maxProfileAttempts = 2;
    
    while (profileAttempts < maxProfileAttempts) {
      try {
        console.log(`Fetching user profile (attempt ${profileAttempts + 1}/${maxProfileAttempts})`);
        profile = await profileService.getUserProfile();
        console.log("Profile retrieved successfully");
        return profile;
      } catch (profileErr) {
        profileAttempts++;
        console.error(`Profile fetch attempt ${profileAttempts} failed:`, profileErr);
        
        if (profileAttempts >= maxProfileAttempts) {
          console.warn('Failed to fetch profile after authentication, but authentication was successful');
          return null;
        }
        
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    return profile;
  }, []);
  
  // Generate a device fingerprint for additional security
  const generateDeviceFingerprint = useCallback(async (): Promise<string> => {
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
  }, []);
  
  // Updated authenticateWithWallet to handle direct blockchain type and check wallet state
  const authenticateWithWallet = useCallback(async (blockchainType?: string, email?: string) => {
    try {
      // Wait a moment to ensure wallet connection is fully established
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Define `currentWalletInfo` with a proper type and default value
      const currentWalletInfo: WalletInfo = walletInfo || {
        address: '',
        chainId: '',
        provider: null,
        blockchain: BlockchainType.POLYGON,
        providerType: WalletProviderType.METAMASK, // Use a valid WalletProviderType value
      };
      
      // Define `blockchainType` with a proper fallback
      const resolvedBlockchainType: string = blockchainType || 'polygon';
      
      // Define `effectiveBlockchainType` with a proper fallback
      let effectiveBlockchainType: string = resolvedBlockchainType || getBlockchainNameFromWallet(currentWalletInfo);
      
      // Simplify null checks using optional chaining
      if (currentWalletInfo?.address) {
        console.log("Wallet info is valid:", currentWalletInfo);
      } else {
        console.error("Wallet info missing during authentication:", { contextWallet: currentWalletInfo });
      }
      
      // Emergency fallback: Check localStorage for wallet address if wallet info is missing
      const lastAddress = localStorage.getItem('lastConnectedWalletAddress');
      const lastWalletType = localStorage.getItem('lastConnectedWalletType');
      const lastBlockchain = localStorage.getItem('lastConnectedBlockchain');
      
      if (!currentWalletInfo && lastAddress && lastWalletType) {
        console.log("Found wallet info in localStorage, using as fallback:", { 
          address: lastAddress,
          walletType: lastWalletType,
          blockchain: lastBlockchain || 'polygon' 
        });
          
        // Create emergency wallet info object from localStorage data
        const emergencyWalletInfo = {
          address: lastAddress,
          providerType: lastWalletType as unknown as WalletProviderType,
          blockchain: (lastBlockchain || 'polygon') as unknown as BlockchainType,
          chainId: lastBlockchain === 'ethereum' ? '1' : lastBlockchain === 'binance' ? '56' : '137',
          provider: null
        };
          
        // Try using this emergency wallet info for authentication
        setIsAuthenticating(true);
        setAuthStage('starting emergency auth');
        setError(null);
            
        // Get blockchain type if not explicitly provided
        const emergencyBlockchain = blockchainType || lastBlockchain || 'polygon';
            
        console.log("Starting emergency wallet authentication process for", emergencyWalletInfo.address,
                    `with blockchain type: ${emergencyBlockchain}`);
          
        // Step 1: Get challenge with blockchain info
        setAuthStage('emergency challenge');
        const challenge = await getAuthChallenge(emergencyWalletInfo.address, emergencyBlockchain);
        if (!challenge) {
          throw new Error("Failed to obtain a valid challenge");
        }
            
        // Step 2: Sign the challenge - this will attempt to use active wallet
        setAuthStage('emergency signing');
        // Use explicit signing with address to bypass wallet context issues
        let signature;
        try {
          // Try direct signing first
          // Use optional chaining for accessing trustWalletFixer
          if (window.trustWalletFixer?.fixAuthentication) {
            await window.trustWalletFixer.fixAuthentication();
          }
          signature = await signWalletChallenge(challenge);
        } catch (signError) {
          console.error("Emergency sign attempt failed:", signError);
          throw new Error("Please connect your wallet first");
        }
            
        if (!signature) {
          throw new Error("Failed to obtain a valid signature");
        }
            
        // Step 3: Generate device fingerprint
        setAuthStage('emergency fingerprint');
        console.log("Generating device fingerprint");
        const deviceFingerprint = await generateDeviceFingerprint();
            
        // Step 4: Perform backend authentication
        setAuthStage('emergency backend authentication');
        const result = await performBackendAuth(
          emergencyWalletInfo,
          signature,
          challenge,
          emergencyBlockchain,
          email,
          deviceFingerprint
        );
            
        if (!result) {
          throw new Error('Emergency authentication failed: No result received');
        }
            
        if (!result.success && !result.accessToken) {
          throw new Error(result.error ?? 'Emergency authentication failed with server error');
        }
            
        // Step 5: Store tokens securely
        setAuthStage('storing tokens');
        console.log("Storing authentication tokens from emergency auth");
            
        if (result.accessToken) {
          secureStorage.setItem(TOKEN_KEY, result.accessToken);
        } else {
          console.warn('No access token returned, authentication may not persist');
        }
            
        if (result.refreshToken) {
          secureStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
        }
            
        secureStorage.setItem(DEVICE_VERIFICATION_KEY, deviceFingerprint);
            
        // Step 6: Fetch user profile
        setAuthStage('fetching profile');
        const profile = await fetchUserProfileWithRetry();
            
        if (profile) {
          setUser(profile);
          secureStorage.setItem(USER_KEY, JSON.stringify(profile));
            
          const isComplete = !!(
            profile.firstName && 
            profile.lastName && 
            (profile.email ?? profile.walletAddresses?.length)
          );
          setIsProfileComplete(isComplete);
        }
            
        setAuthStage('complete');
        setIsAuthenticated(true);
        setIsAuthenticating(false);
        setIsLoading(false);
        return true;
      }
      
      // If no emergency fallback available, try reconnection
      if (typeof walletService.reconnectLastWallet === 'function') {
        console.log("Attempting to reconnect to last wallet...");
        try {
          const reconnectResult = await walletService.reconnectLastWallet();
          if (reconnectResult && reconnectResult.address) {
            console.log("Successfully reconnected to wallet:", reconnectResult.address);
            
            // Use the reconnected wallet info
            // Waiting for the wallet context to update
            await new Promise(resolve => setTimeout(resolve, 300));
          } else {
            throw new Error("Failed to reconnect to previous wallet");
          }
        } catch (reconnectErr) {
          console.error("Error reconnecting to wallet:", reconnectErr);
          throw new Error("Please connect your wallet first");
        }
      } else {
        throw new Error("Please connect your wallet first");
      }
      
      // If we've made it here, use the context's wallet info or a reconnected one
      const effectiveWalletInfo = walletInfo || currentWalletInfo;
      if (!effectiveWalletInfo || !effectiveWalletInfo.address) {
        throw new Error("Unable to obtain wallet information");
      }
      
      setIsAuthenticating(true);
      setAuthStage('starting');
      setError(null);
      walletService.clearStorageData?.();
      
      // Get blockchain type from wallet info if not explicitly provided
      effectiveBlockchainType = blockchainType || getBlockchainNameFromWallet(effectiveWalletInfo);
      
      console.log("Starting wallet authentication process in auth context for", effectiveWalletInfo.address,
                 `with blockchain type: ${effectiveBlockchainType}`);
      
      // Step 1: Get challenge with blockchain info
      setAuthStage('challenge');
      const challenge = await getAuthChallenge(effectiveWalletInfo.address, effectiveBlockchainType);
      if (!challenge) {
        throw new Error("Failed to obtain a valid challenge");
      }
      
      // Step 2: Sign the challenge
      setAuthStage('signing');
      const signature = await signWalletChallenge(challenge);
      if (!signature) {
        throw new Error("Failed to obtain a valid signature");
      }
      
      // Step 3: Generate device fingerprint
      setAuthStage('fingerprint');
      console.log("Generating device fingerprint");
      const deviceFingerprint = await generateDeviceFingerprint();
      
      // Step 4: Perform backend authentication with blockchain info and correct wallet info
      setAuthStage('backend-authentication');
      // Include the blockchain type in the wallet info passed to authentication
      const augmentedWalletInfo = {
        ...effectiveWalletInfo,
        chainId: typeof effectiveWalletInfo.chainId === 'string' ? 
          parseInt(effectiveWalletInfo.chainId, 16) : effectiveWalletInfo.chainId,
        blockchain: effectiveBlockchainType
      };
      
      const result = await performBackendAuth(
        augmentedWalletInfo, 
        signature, 
        challenge, 
        effectiveBlockchainType,
        email, 
        deviceFingerprint
      );
      
      if (!result) {
        throw new Error('Authentication failed: No result received');
      }
      
      if (!result.success && !result.accessToken) {
        throw new Error(result.error ?? 'Authentication failed with server error');
      }
      
      // Step 5: Store tokens securely
      setAuthStage('storing-tokens');
      console.log("Storing authentication tokens");
      
      if (result.accessToken) {
        secureStorage.setItem(TOKEN_KEY, result.accessToken);
      } else {
        console.warn('No access token returned, authentication may not persist');
      }
      
      if (result.refreshToken) {
        secureStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
      }
      
      secureStorage.setItem(DEVICE_VERIFICATION_KEY, deviceFingerprint);
      
      // Step 6: Fetch user profile
      setAuthStage('fetching-profile');
      const profile = await fetchUserProfileWithRetry();
      
      if (profile) {
        setUser(profile);
        secureStorage.setItem(USER_KEY, JSON.stringify(profile));
        
        const isComplete = !!(
          profile.firstName && 
          profile.lastName && 
          (profile.email ?? profile.walletAddresses?.length)
        );
        setIsProfileComplete(isComplete);
      }
      
      setIsAuthenticated(true);
      setIsLoading(false);
      setIsAuthenticating(false);
      setAuthStage('complete');
      return true;
    } catch (err) {
      setIsAuthenticating(false);
      setIsLoading(false);
      setError(err instanceof Error ? err.message : String(err));
      console.error("Authentication error:", err);
      return false;
    }
  }, [walletInfo, getAuthChallenge, signWalletChallenge, performBackendAuth, fetchUserProfileWithRetry, generateDeviceFingerprint]);
  
  // Logout function
  const logout = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Clear user data and tokens
      setUser(null);
      setIsAuthenticated(false);
      secureStorage.removeItem(TOKEN_KEY);
      secureStorage.removeItem(REFRESH_TOKEN_KEY);
      secureStorage.removeItem(USER_KEY);
      secureStorage.removeItem(DEVICE_VERIFICATION_KEY);
      
      // Optionally, notify the wallet service
      await walletService.logout?.();
      
      console.log("Logout successful");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("Logout error:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, []);
  
  // Update user profile function
  const updateUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the profile service to update the user profile
      const updatedProfile = await profileService.updateUserProfile(data);
      
      // Update the user state and secure storage
      setUser(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
      secureStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...updatedProfile }));
      
      console.log("User profile updated successfully");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("Error updating user profile:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Complete user profile function (for onboarding or profile completion flows)
  const completeUserProfile = useCallback(async (data: Partial<UserProfile>) => {
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Call the profile service to complete the user profile
      const updatedProfile = await profileService.completeUserProfile(data);
      
      // Update the user state and secure storage
      setUser(prev => prev ? { ...prev, ...updatedProfile } : updatedProfile);
      secureStorage.setItem(USER_KEY, JSON.stringify({ ...user, ...updatedProfile }));
      
      console.log("User profile completed successfully");
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      console.error("Error completing user profile:", err);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [user]);
  
  // Memoized value for context provider
  const value = useMemo(() => ({
    user,
    isAuthenticated,
    isLoading,
    isAuthenticating,
    authStage,
    error,
    isProfileComplete,
    authenticateWithWallet,
    logout,
    updateUserProfile,
    completeUserProfile,
  }), [user, isAuthenticated, isLoading, isAuthenticating, authStage, error, isProfileComplete, authenticateWithWallet, logout, updateUserProfile, completeUserProfile]);
  
  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use the AuthContext
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// Added to suppress spell-check warnings for specific terms
// cSpell:ignore SOLANA solana retryable Retryable

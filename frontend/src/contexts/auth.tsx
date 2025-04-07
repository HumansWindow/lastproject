import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api/modules/auth/auth-service';
import { useRouter } from 'next/router';
import { UserProfile, LoginResponse } from '../types/api-types';

// Define an extended user type that includes all the properties we need
interface ExtendedUserProfile extends UserProfile {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
  isAdmin?: boolean;
  walletAddress?: string;
  lastLoginAt?: string;
  roles?: string[];
}

interface AuthContextType {
  user: ExtendedUserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  setUserFromWalletAuth: (userData: ExtendedUserProfile) => void;
  walletLogin: (address: string, signature: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null,
  setUserFromWalletAuth: () => {},
  walletLogin: async () => {}
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<ExtendedUserProfile | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Helper function to create ExtendedUserProfile from UserProfile
  const createExtendedUserProfile = (userData: UserProfile): ExtendedUserProfile => {
    return {
      ...userData,
      isAdmin: userData.role === 'admin',
      walletAddress: userData.walletAddresses?.[0],
      lastLoginAt: userData.updatedAt,
      roles: userData.role ? [userData.role] : []
    };
  };
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken');
        if (token) {
          // Get user profile after login
          const response = await authService.getUserProfile();
          setUser(createExtendedUserProfile(response.data));
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        // Clear token if it's invalid
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const response = await authService.login(email, password);
      
      if (response.accessToken) {
        localStorage.setItem('accessToken', response.accessToken);
        
        if (response.refreshToken) {
          localStorage.setItem('refreshToken', response.refreshToken);
        }
        
        // Get user profile after login
        const userProfileResponse = await authService.getUserProfile();
        setUser(createExtendedUserProfile(userProfileResponse.data));
        
        router.push('/dashboard');
      } else {
        throw new Error('No access token received');
      }
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };
  
  // Implement wallet login functionality
  const walletLogin = async (address: string, signature: string): Promise<void> => {
    try {
      setError(null);
      const response = await authService.loginWithWallet(address, signature, "wallet-login-message");
      
      if (response.data.accessToken) {
        localStorage.setItem('accessToken', response.data.accessToken);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
        
        // If user data is in the response, use it directly
        if (response.data.user) {
          setUser(createExtendedUserProfile(response.data.user));
        } else {
          // Otherwise fetch it separately
          const userProfileResponse = await authService.getUserProfile();
          setUser(createExtendedUserProfile(userProfileResponse.data));
        }
      } else {
        throw new Error('No access token received');
      }
    } catch (err: any) {
      console.error('Wallet login error:', err);
      setError(err.response?.data?.message || 'Wallet login failed');
      throw err;
    }
  };
  
  const register = async (email: string, password: string, referralCode?: string) => {
    try {
      setError(null);
      await authService.register(email, password, referralCode);
      router.push('/login?registered=true');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    setUser(null);
    router.push('/login');
  };
  
  // Method to update user state when wallet connects
  const setUserFromWalletAuth = (userData: ExtendedUserProfile) => {
    setUser(userData);
  };
  
  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      register,
      logout,
      error,
      setUserFromWalletAuth,
      walletLogin
    }}>
      {children}
    </AuthContext.Provider>
  );
};

import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import { useRouter } from 'next/router';
import { UserProfile, UserResponse } from '../types/api-types';

interface AuthContextType {
  user: UserResponse | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  setUserFromWalletAuth: (userData: UserResponse) => void;
  walletLogin: (address: string, signature: string) => Promise<void>; // Type is Promise<void>
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
  walletLogin: async () => {} // Default implementation
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<UserResponse | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('accessToken'); // Changed from access_token to accessToken
        if (token) {
          const { data } = await authService.getUserProfile(); // Changed from getUserInfo to getUserProfile
          
          // Convert UserProfile to UserResponse
          const userResponse: UserResponse = {
            id: data.id,
            email: data.email,
            firstName: data.firstName,
            lastName: data.lastName,
            walletAddress: data.walletAddress,
            isAdmin: data.role === 'admin', // Convert role to isAdmin
            isEmailVerified: data.isEmailVerified,
            createdAt: data.createdAt,
            lastLoginAt: data.updatedAt, // Use updatedAt as lastLoginAt
            roles: data.role ? [data.role] : [] // Convert role to roles array
          };
          
          setUser(userResponse);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        // Clear token if it's invalid
        localStorage.removeItem('accessToken'); // Changed from access_token to accessToken
        localStorage.removeItem('refreshToken'); // Changed from refresh_token to refreshToken
      } finally {
        setIsLoading(false);
      }
    };
    
    checkAuthStatus();
  }, []);
  
  const login = async (email: string, password: string) => {
    try {
      setError(null);
      const { data } = await authService.login(email, password);
      
      localStorage.setItem('accessToken', data.accessToken); // Changed from access_token to accessToken
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken); // Changed from refresh_token to refreshToken
      }
      
      // Convert UserProfile to UserResponse
      const userResponse: UserResponse = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        walletAddress: data.user.walletAddress,
        isAdmin: data.user.role === 'admin',
        isEmailVerified: data.user.isEmailVerified,
        createdAt: data.user.createdAt,
        lastLoginAt: data.user.updatedAt,
        roles: data.user.role ? [data.user.role] : []
      };
      
      setUser(userResponse);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
      throw err;
    }
  };
  
  // Implement wallet login functionality - fixed to return void
  const walletLogin = async (address: string, signature: string): Promise<void> => {
    try {
      setError(null);
      // Call the wallet authentication API endpoint - fixed method name
      const { data } = await authService.loginWithWallet(address, signature, "wallet-login-message");
      
      localStorage.setItem('accessToken', data.accessToken); // Changed from access_token to accessToken
      if (data.refreshToken) {
        localStorage.setItem('refreshToken', data.refreshToken); // Changed from refresh_token to refreshToken
      }
      
      // Convert UserProfile to UserResponse
      const userResponse: UserResponse = {
        id: data.user.id,
        email: data.user.email,
        firstName: data.user.firstName,
        lastName: data.user.lastName,
        walletAddress: data.user.walletAddress,
        isAdmin: data.user.role === 'admin',
        isEmailVerified: data.user.isEmailVerified,
        createdAt: data.user.createdAt,
        lastLoginAt: data.user.updatedAt,
        roles: data.user.role ? [data.user.role] : []
      };
      
      setUser(userResponse);
      // No return value - function returns void
    } catch (err: any) {
      console.error('Wallet login error:', err);
      setError(err.response?.data?.message || 'Wallet login failed');
      throw err;
    }
  };
  
  const register = async (email: string, password: string, referralCode?: string) => {
    try {
      setError(null);
      const { data } = await authService.register(email, password, referralCode);
      
      // Usually we'd automatically log in after registration, but you might want different behavior
      router.push('/login?registered=true');
    } catch (err: any) {
      console.error('Registration error:', err);
      setError(err.response?.data?.message || 'Registration failed');
      throw err;
    }
  };
  
  const logout = () => {
    localStorage.removeItem('accessToken'); // Changed from access_token to accessToken
    localStorage.removeItem('refreshToken'); // Changed from refresh_token to refreshToken
    setUser(null);
    router.push('/login');
  };
  
  // Method to update user state when wallet connects
  const setUserFromWalletAuth = (userData: UserResponse) => {
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

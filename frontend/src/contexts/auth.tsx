import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import walletService from '../services/wallet';
import { useWallet } from './wallet';

interface User {
  id: string;
  address?: string;
  email?: string;
  name?: string;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  
  authenticateWithWallet: (email?: string) => Promise<boolean>;
  logout: () => Promise<boolean>;
  updateUserProfile: (data: Partial<User>) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Local storage keys
const TOKEN_KEY = 'auth_token';
const REFRESH_TOKEN_KEY = 'refresh_token';
const USER_KEY = 'user';

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { isConnected, walletInfo } = useWallet();
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  
  // Initialize user from local storage
  useEffect(() => {
    const storedUser = localStorage.getItem(USER_KEY);
    
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
        setIsAuthenticated(true);
      } catch {
        // Invalid stored user, clear it
        localStorage.removeItem(USER_KEY);
      }
    }
    
    setIsLoading(false);
  }, []);
  
  // Handle token refresh
  useEffect(() => {
    const refreshTokenIfNeeded = async () => {
      const refreshToken = localStorage.getItem(REFRESH_TOKEN_KEY);
      
      if (refreshToken && isAuthenticated) {
        // You might want to check token expiration before refreshing
        const result = await walletService.refreshToken(refreshToken);
        
        if (result.success && result.token && result.refreshToken) {
          localStorage.setItem(TOKEN_KEY, result.token);
          localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
        } else {
          // If refresh fails, log out
          await logout();
        }
      }
    };
    
    // Set up refresh interval
    const intervalId = setInterval(refreshTokenIfNeeded, 15 * 60 * 1000); // Every 15 minutes
    
    return () => clearInterval(intervalId);
  }, [isAuthenticated]);
  
  const authenticateWithWallet = async (email?: string) => {
    if (!isConnected || !walletInfo) {
      setError('No wallet connected');
      return false;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      const result = await walletService.authenticate(email);
      
      if (result.success && result.token && result.refreshToken && result.userId) {
        // Store tokens
        localStorage.setItem(TOKEN_KEY, result.token);
        localStorage.setItem(REFRESH_TOKEN_KEY, result.refreshToken);
        
        // Create user object from wallet info
        const newUser = {
          id: result.userId,
          address: walletInfo.address,
          email: email,
        };
        
        // Store user in localStorage
        localStorage.setItem(USER_KEY, JSON.stringify(newUser));
        
        setUser(newUser);
        setIsAuthenticated(true);
        return true;
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
      
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Logout error');
      return false;
    }
  };
  
  const updateUserProfile = async (data: Partial<User>) => {
    // Implement profile update logic
    try {
      if (!user) return false;
      
      const updatedUser = { ...user, ...data };
      localStorage.setItem(USER_KEY, JSON.stringify(updatedUser));
      setUser(updatedUser);
      
      return true;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to update profile');
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
        authenticateWithWallet,
        logout,
        updateUserProfile,
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

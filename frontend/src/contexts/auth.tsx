import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';
import { useRouter } from 'next/router';

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;  // Added this property to fix the TypeScript error
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  error: string | null;
  setUserFromWalletAuth: (userData: User) => void; // Export this method
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: () => {},
  error: null,
  setUserFromWalletAuth: () => {} // Add default implementation
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider: React.FC<{children: React.ReactNode}> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  
  // Check if user is logged in on initial load
  useEffect(() => {
    const checkAuthStatus = async () => {
      try {
        const token = localStorage.getItem('access_token');
        if (token) {
          const { data } = await authService.getUserInfo();
          setUser(data.user);
        }
      } catch (err) {
        console.error('Error checking auth status:', err);
        // Clear token if it's invalid
        localStorage.removeItem('access_token');
        localStorage.removeItem('refresh_token');
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
      
      localStorage.setItem('access_token', data.accessToken);
      if (data.refreshToken) {
        localStorage.setItem('refresh_token', data.refreshToken);
      }
      
      setUser(data.user);
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      setError(err.response?.data?.message || 'Login failed');
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
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    setUser(null);
    router.push('/login');
  };
  
  // Method to update user state when wallet connects
  const setUserFromWalletAuth = (userData: User) => {
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
      setUserFromWalletAuth // Export the method in the provider
    }}>
      {children}
    </AuthContext.Provider>
  );
};

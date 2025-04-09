import React, { createContext, useState, useContext, useEffect, useRef, ReactNode, useCallback } from 'react';
import { ethers } from 'ethers';
import { walletAuthService, WalletAuthResult } from '../services/api/modules/auth/wallet-auth-service';
import { useAuth } from './auth'; // Import the auth context

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: (email?: string) => Promise<string | null>;
  disconnect: () => void;
  error: string | null;
  signMessage: (message: string) => Promise<string | null>;
  resetConnection: () => Promise<string | null>;
  networkName: string | null;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnecting: false,
  isConnected: false,
  connect: async () => null,
  disconnect: () => {},
  error: null,
  signMessage: async () => null,
  resetConnection: async () => null,
  networkName: null
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [networkName, setNetworkName] = useState<string | null>(null);
  
  // Use the auth context to update user state when wallet connects
  const { setUserFromWalletAuth } = useAuth();
  
  // Use refs to store cleanup functions
  const accountsCleanupRef = useRef<() => void>(() => {});
  const chainCleanupRef = useRef<() => void>(() => {});
  
  // Update network name when connection changes - wrapped in useCallback
  const updateNetworkName = useCallback(async () => {
    if (isConnected) {
      const name = await walletAuthService.getNetworkName();
      setNetworkName(name);
    } else {
      setNetworkName(null);
    }
  }, [isConnected]);
  
  // Check if a wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const isConnected = await walletAuthService.checkConnection();
        if (isConnected) {
          const currentAddress = await walletAuthService.getCurrentAddress();
          if (currentAddress) {
            setAddress(currentAddress);
            setIsConnected(true);
            await updateNetworkName();
          }
        }
      } catch (err) {
        console.error('Error checking wallet connection:', err);
      }
    };
    
    checkConnection();
    
    // Set up listeners for wallet events
    if (walletAuthService.isWalletAvailable()) {
      // Store cleanup functions
      accountsCleanupRef.current = walletAuthService.setupAccountChangeListener((accounts) => {
        if (accounts.length === 0) {
          // User disconnected their wallet
          disconnect();
        } else if (accounts[0] !== address) {
          // User switched accounts
          setAddress(accounts[0]);
          updateNetworkName();
        }
      });
      
      chainCleanupRef.current = walletAuthService.setupChainChangeListener((chainId) => {
        console.log('Chain changed to:', chainId);
        // Update network name when chain changes
        updateNetworkName();
      });
    }
    
    // Clean up event listeners on unmount
    return () => {
      accountsCleanupRef.current();
      chainCleanupRef.current();
    };
  }, [address, updateNetworkName]); // Add missing dependencies
  
  const connect = async (email?: string): Promise<string | null> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // If email is provided and is a string, validate it
      // Otherwise proceed with wallet-only auth
      if (email !== undefined && typeof email === 'string' && email.trim() !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError('Please enter a valid email address or leave the field empty for wallet-only authentication');
          setIsConnecting(false);
          return null;
        }
        console.log('Connecting with wallet and email:', email);
      } else {
        console.log('Connecting with wallet only (no email)');
        // Make sure email is undefined when empty, not an empty string or other falsy value
        email = undefined;
      }
      
      const result = await walletAuthService.authenticate(email);
      
      if (!result.success) {
        // Authentication failed
        const errorMessage = result.error || 'Failed to connect wallet';
        setError(errorMessage);
        return null;
      }
      
      // Authentication successful
      const walletAddress = result.walletAddress || await walletAuthService.getCurrentAddress();
      if (!walletAddress) {
        setError('Unable to get wallet address after authentication');
        return null;
      }
      
      setAddress(walletAddress);
      setIsConnected(true);
      await updateNetworkName();
      
      // Check if user data is available in the result
      if (result.userId) {
        setUserFromWalletAuth({
          id: result.userId,
          walletAddress: walletAddress,
          isNewUser: result.isNewUser || false,
          // Add required properties with default values
          email: '',
          role: 'user',
          emailVerified: false,
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        });
      }
      
      return walletAddress;
    } catch (error: any) {
      console.error('Wallet connection error:', error);
      
      // Friendly error messages based on the error type
      if (error.response?.data?.message) {
        if (Array.isArray(error.response.data.message)) {
          setError(error.response.data.message[0]);
        } else {
          setError(error.response.data.message);
        }
      } else if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to connect wallet. Please try again.');
      }
      
      return null;
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnect = () => {
    walletAuthService.disconnect();
    setAddress(null);
    setIsConnected(false);
    setNetworkName(null);
  };
  
  // Add signMessage implementation
  const signMessage = async (message: string): Promise<string | null> => {
    setError(null);
    try {
      if (!address) {
        setError('No wallet connected. Please connect a wallet first.');
        return null;
      }
      
      // Use the wallet service to sign the message
      const signature = await walletAuthService.signMessage(message);
      return signature;
    } catch (error: any) {
      console.error('Message signing error:', error);
      
      if (error.message) {
        setError(error.message);
      } else {
        setError('Failed to sign message. Please try again.');
      }
      
      return null;
    }
  };
  
  // Reset wallet connection (useful for troubleshooting)
  const resetConnection = async (): Promise<string | null> => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // Disconnect and reconnect
      disconnect();
      const newAddress = await walletAuthService.resetConnection();
      
      if (newAddress) {
        setAddress(newAddress);
        setIsConnected(true);
        await updateNetworkName();
        return newAddress;
      } else {
        setError('Failed to reset wallet connection');
        return null;
      }
    } catch (error: any) {
      console.error('Error resetting wallet connection:', error);
      setError(error.message || 'Failed to reset connection');
      return null;
    } finally {
      setIsConnecting(false);
    }
  };
  
  return (
    <WalletContext.Provider value={{
      address,
      isConnecting,
      isConnected,
      connect,
      disconnect,
      error,
      signMessage,
      resetConnection,
      networkName
    }}>
      {children}
    </WalletContext.Provider>
  );
};

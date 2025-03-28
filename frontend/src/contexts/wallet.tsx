import React, { createContext, useState, useContext, useEffect, useRef, ReactNode } from 'react';
import { walletAuthService } from '../services/wallet-auth.service';

interface WalletContextType {
  address: string | null;
  isConnecting: boolean;
  isConnected: boolean;
  connect: (email?: string) => Promise<void>;
  disconnect: () => void;
  error: string | null;
}

const WalletContext = createContext<WalletContextType>({
  address: null,
  isConnecting: false,
  isConnected: false,
  connect: async () => {},
  disconnect: () => {},
  error: null
});

export const useWallet = () => useContext(WalletContext);

export const WalletProvider: React.FC<{children: ReactNode}> = ({ children }) => {
  const [address, setAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  
  // Use refs to store cleanup functions
  const accountsCleanupRef = useRef<() => void>(() => {});
  const chainCleanupRef = useRef<() => void>(() => {});
  
  // Check if a wallet is already connected on mount
  useEffect(() => {
    const checkConnection = async () => {
      try {
        const currentAddress = await walletAuthService.getCurrentAddress();
        if (currentAddress) {
          setAddress(currentAddress);
          setIsConnected(true);
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
        }
      });
      
      chainCleanupRef.current = walletAuthService.setupChainChangeListener((chainId) => {
        console.log('Chain changed to:', chainId);
        // You can add specific logic for chain changes if needed
      });
    }
    
    // Clean up event listeners on unmount
    return () => {
      accountsCleanupRef.current();
      chainCleanupRef.current();
    };
  }, []);
  
  const connect = async (email?: string) => {
    setIsConnecting(true);
    setError(null);
    
    try {
      // If email is provided and is a string, validate it
      // Otherwise proceed with wallet-only auth
      if (email !== undefined && typeof email === 'string' && email.trim() !== '') {
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
          setError('Please enter a valid email address or leave the field empty for wallet-only authentication');
          setIsConnecting(false);
          return;
        }
        console.log('Connecting with wallet and email:', email);
      } else {
        console.log('Connecting with wallet only (no email)');
        // Make sure email is undefined when empty, not an empty string or other falsy value
        email = undefined;
      }
      
      const result = await walletAuthService.authenticate(email);
      setAddress(result.wallet || await walletAuthService.getCurrentAddress());
      setIsConnected(true);
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
    } finally {
      setIsConnecting(false);
    }
  };
  
  const disconnect = () => {
    walletAuthService.disconnect();
    setAddress(null);
    setIsConnected(false);
  };
  
  return (
    <WalletContext.Provider value={{
      address,
      isConnecting,
      isConnected,
      connect,
      disconnect,
      error
    }}>
      {children}
    </WalletContext.Provider>
  );
};

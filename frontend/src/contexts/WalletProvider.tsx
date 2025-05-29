import React, { createContext, useContext, useState, useEffect, ReactNode, useMemo, useCallback } from 'react';
import walletService from "../services/wallet/walletExtensions";
import { WalletInfo, WalletEvent, WalletProviderType } from '../services/wallet/core/walletBase';

interface WalletContextType {
  connect: (providerType: WalletProviderType) => Promise<boolean>;
  disconnect: () => Promise<boolean>;
  switchNetwork: (chainId: string) => Promise<boolean>;
  isConnected: boolean;
  isConnecting: boolean;
  walletInfo: WalletInfo | null;
  error: string | null;
  providerType: WalletProviderType | null;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

export const WalletProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [walletInfo, setWalletInfo] = useState<WalletInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [providerType, setProviderType] = useState<WalletProviderType | null>(null);
  
  useEffect(() => {
    // Set up event listeners for wallet events
    const handleConnection = (info: WalletInfo) => {
      setWalletInfo(info);
      setIsConnected(true);
      setIsConnecting(false);
      setError(null);
    };
    
    const handleDisconnection = () => {
      setWalletInfo(null);
      setIsConnected(false);
      setProviderType(null);
      setError(null);
    };
    
    const handleError = (err: any) => {
      setError(typeof err === 'string' ? err : (err?.message ?? 'Unknown wallet error'));
      setIsConnecting(false);
    };
    
    const handleAccountChanged = (newInfo: WalletInfo) => {
      setWalletInfo(newInfo);
    };

    const handleChainChanged = (newInfo: WalletInfo) => {
      setWalletInfo(newInfo);
    };
    
    // Register event listeners only if the methods exist
    if (typeof walletService.on === 'function') {
      walletService.on(WalletEvent.CONNECTED, handleConnection);
      walletService.on(WalletEvent.DISCONNECTED, handleDisconnection);
      walletService.on(WalletEvent.ERROR, handleError);
      walletService.on(WalletEvent.ACCOUNT_CHANGED, handleAccountChanged);
      walletService.on(WalletEvent.CHAIN_CHANGED, handleChainChanged);
      
      // Remove event listeners on cleanup
      return () => {
        if (typeof walletService.off === 'function') {
          walletService.off(WalletEvent.CONNECTED, handleConnection);
          walletService.off(WalletEvent.DISCONNECTED, handleDisconnection);
          walletService.off(WalletEvent.ERROR, handleError);
          walletService.off(WalletEvent.ACCOUNT_CHANGED, handleAccountChanged);
          walletService.off(WalletEvent.CHAIN_CHANGED, handleChainChanged);
        }
      };
    }
    
    return undefined;
  }, []);
  
  // Try to restore wallet connection on initial load
  useEffect(() => {
    const checkConnection = async () => {
      const isAlreadyConnected = typeof walletService.isConnected === 'function' 
        ? walletService.isConnected() 
        : false;
      
      if (isAlreadyConnected) {
        const info = typeof walletService.getWalletInfo === 'function'
          ? walletService.getWalletInfo()
          : null;
          
        if (info) {
          setWalletInfo(info);
          setIsConnected(true);
        }
      }
    };
    
    checkConnection();
  }, []);
  
  const connect = async (type: WalletProviderType) => {
    try {
      setIsConnecting(true);
      setError(null);
      setProviderType(type);
      
      if (typeof walletService.connect !== 'function') {
        throw new Error('Wallet connection method not available');
      }
      
      const info = await walletService.connect(type);
      return !!info;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message ?? 'Failed to connect wallet');
      return false;
    }
  };
  
  const disconnect = async () => {
    try {
      if (typeof walletService.disconnect !== 'function') {
        throw new Error('Wallet disconnection method not available');
      }
      
      const success = await walletService.disconnect();
      return success;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message ?? 'Failed to disconnect wallet');
      return false;
    }
  };
  
  const switchNetwork = useCallback(async (chainId: string) => {
    if (!providerType) {
      setError('No wallet provider connected');
      return false;
    }
    
    try {
      if (typeof walletService.switchNetwork !== 'function') {
        throw new Error('Network switching method not available');
      }
      
      const success = await walletService.switchNetwork(chainId, providerType);
      if (!success) {
        setError('Failed to switch network');
      }
      return success;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message ?? 'Failed to switch network');
      return false;
    }
  }, [providerType]);
  
  // Create memoized context value to prevent unnecessary re-renders
  const contextValue = useMemo(() => ({
    connect,
    disconnect,
    switchNetwork,
    isConnected,
    isConnecting,
    walletInfo,
    error,
    providerType
  }), [
    isConnected, 
    isConnecting, 
    walletInfo, 
    error, 
    providerType,
    switchNetwork
    // connect and disconnect are stable function references
    // created in the component body, so they don't need to be dependencies
  ]);
  
  return (
    <WalletContext.Provider value={contextValue}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  
  if (context === undefined) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  
  return context;
};

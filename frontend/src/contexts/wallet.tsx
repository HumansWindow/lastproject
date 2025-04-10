import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import walletService, { 
  WalletEvent, 
  WalletInfo, 
  WalletProviderType 
} from '../services/wallet';

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
      setError(typeof err === 'string' ? err : (err?.message || 'Unknown wallet error'));
      setIsConnecting(false);
    };
    
    const handleAccountChanged = (newInfo: WalletInfo) => {
      setWalletInfo(newInfo);
    };

    const handleChainChanged = (newInfo: WalletInfo) => {
      setWalletInfo(newInfo);
    };
    
    // Register event listeners
    walletService.on(WalletEvent.CONNECTED, handleConnection);
    walletService.on(WalletEvent.DISCONNECTED, handleDisconnection);
    walletService.on(WalletEvent.ERROR, handleError);
    walletService.on(WalletEvent.ACCOUNT_CHANGED, handleAccountChanged);
    walletService.on(WalletEvent.CHAIN_CHANGED, handleChainChanged);
    
    // Remove event listeners on cleanup
    return () => {
      walletService.off(WalletEvent.CONNECTED, handleConnection);
      walletService.off(WalletEvent.DISCONNECTED, handleDisconnection);
      walletService.off(WalletEvent.ERROR, handleError);
      walletService.off(WalletEvent.ACCOUNT_CHANGED, handleAccountChanged);
      walletService.off(WalletEvent.CHAIN_CHANGED, handleChainChanged);
    };
  }, []);
  
  // Try to restore wallet connection on initial load
  useEffect(() => {
    const checkConnection = async () => {
      const isAlreadyConnected = walletService.isConnected();
      
      if (isAlreadyConnected) {
        const info = walletService.getWalletInfo();
        setWalletInfo(info);
        setIsConnected(true);
      }
    };
    
    checkConnection();
  }, []);
  
  const connect = async (type: WalletProviderType) => {
    try {
      setIsConnecting(true);
      setError(null);
      setProviderType(type);
      
      const info = await walletService.connect(type);
      return !!info;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to connect wallet');
      return false;
    }
  };
  
  const disconnect = async () => {
    try {
      const success = await walletService.disconnect();
      return success;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to disconnect wallet');
      return false;
    }
  };
  
  const switchNetwork = async (chainId: string) => {
    if (!providerType) {
      setError('No wallet provider connected');
      return false;
    }
    
    try {
      const success = await walletService.switchNetwork(chainId, providerType);
      if (!success) {
        setError('Failed to switch network');
      }
      return success;
    } catch (err: unknown) {
      const error = err as { message?: string };
      setError(error?.message || 'Failed to switch network');
      return false;
    }
  };
  
  return (
    <WalletContext.Provider
      value={{
        connect,
        disconnect,
        switchNetwork,
        isConnected,
        isConnecting,
        walletInfo,
        error,
        providerType
      }}
    >
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

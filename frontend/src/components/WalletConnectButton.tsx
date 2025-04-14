import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWallet } from '../contexts/wallet';
import { useAuth } from '../contexts/auth';
import { WalletProviderType } from '../services/wallet';

interface WalletConnectButtonProps {
  className?: string;
  providerType?: WalletProviderType;
  autoAuthenticate?: boolean;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ 
  className = '',
  providerType = WalletProviderType.METAMASK,
  autoAuthenticate = true
}) => {
  const { isConnected, isConnecting, walletInfo, connect, disconnect, error } = useWallet();
  const { authenticateWithWallet, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const hasAttemptedAuth = useRef<boolean>(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  const displayAddress = walletInfo?.address 
    ? `${walletInfo.address.substring(0, 6)}...${walletInfo.address.substring(walletInfo.address.length - 4)}`
    : '';
  
  // Connect with specified provider
  const handleConnect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Reset authentication tracking when connecting
    hasAttemptedAuth.current = false;
    connect(providerType);
  };
  
  // Disconnect wallet
  const handleDisconnect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    disconnect();
    // Reset authentication attempt tracking when disconnecting
    hasAttemptedAuth.current = false;
    
    // Clear any pending authentication timeout
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
  };
  
  // Memoize authentication function to prevent dependency changes
  const performAuthentication = useCallback(async () => {
    if (
      autoAuthenticate && 
      isConnected && 
      !isAuthenticated && 
      !isAuthLoading &&
      !isAuthenticating && 
      !hasAttemptedAuth.current
    ) {
      try {
        // Mark that we're starting authentication to prevent duplicate attempts
        setIsAuthenticating(true);
        hasAttemptedAuth.current = true;
        
        console.log("Starting wallet authentication with address:", walletInfo?.address);
        await authenticateWithWallet();
        console.log("Wallet authentication completed successfully");
      } catch (err) {
        console.error("Authentication failed:", err);
        // Reset auth attempt flag after a delay to allow for retries if it was a temporary error
        authTimeoutRef.current = setTimeout(() => {
          hasAttemptedAuth.current = false;
        }, 5000);
      } finally {
        setIsAuthenticating(false);
      }
    }
  }, [autoAuthenticate, isConnected, isAuthenticated, isAuthLoading, authenticateWithWallet, walletInfo?.address]);
  
  // Auto authenticate when wallet is connected
  useEffect(() => {
    // Only run this effect when the wallet first connects
    if (isConnected && !hasAttemptedAuth.current && !isAuthenticating) {
      performAuthentication();
    }
    
    // Cleanup function to clear any timeouts
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [isConnected, performAuthentication]); // Simplified dependency array
  
  return (
    <div className="wallet-connect-container">
      {!isConnected ? (
        <button 
          className={`wallet-connect-button ${className}`} 
          onClick={handleConnect}
          disabled={isConnecting || isAuthLoading || isAuthenticating}
        >
          {isConnecting ? 'Connecting...' : `Connect ${getProviderName(providerType)}`}
        </button>
      ) : (
        <div className="wallet-connected">
          <span className="wallet-address">{displayAddress}</span>
          <button className={`disconnect-button ${className}`} onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      )}
      {error && <p className="wallet-error">{error}</p>}
    </div>
  );
};

// Helper function to get provider display name
function getProviderName(providerType: WalletProviderType): string {
  const providerNames = {
    [WalletProviderType.METAMASK]: 'MetaMask',
    [WalletProviderType.COINBASE]: 'Coinbase',
    [WalletProviderType.WALLETCONNECT]: 'WalletConnect',
    [WalletProviderType.TRUST]: 'Trust Wallet',
    [WalletProviderType.PHANTOM]: 'Phantom',
    [WalletProviderType.BINANCE]: 'Binance Wallet'
  };
  
  return providerNames[providerType] || 'Wallet';
}

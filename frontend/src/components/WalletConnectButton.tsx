import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWallet } from '../contexts/wallet';
import { useAuth } from '../contexts/auth';
import { WalletProviderType } from '../services/wallet';

interface WalletConnectButtonProps {
  className?: string;
  providerType?: WalletProviderType;
  autoAuthenticate?: boolean;
}

// Global authentication lock to prevent multiple simultaneous auth requests across component instances
const globalAuthLock = {
  inProgress: false,
  lockTime: 0,
  setLock: (state: boolean) => {
    globalAuthLock.inProgress = state;
    globalAuthLock.lockTime = state ? Date.now() : 0;
  },
  isLocked: () => {
    // Auto-release lock after 10 seconds to prevent permanent deadlocks
    if (globalAuthLock.inProgress && (Date.now() - globalAuthLock.lockTime > 10000)) {
      globalAuthLock.inProgress = false;
      return false;
    }
    return globalAuthLock.inProgress;
  }
};

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ 
  className = '',
  providerType = WalletProviderType.METAMASK,
  autoAuthenticate = true
}) => {
  const { isConnected, isConnecting, walletInfo, connect, disconnect, error } = useWallet();
  const { authenticateWithWallet, isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const [isAuthenticating, setIsAuthenticating] = useState<boolean>(false);
  const authInProgressRef = useRef<boolean>(false); // Use ref to track actual auth state across renders
  const hasAttemptedAuth = useRef<boolean>(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authAttemptCountRef = useRef<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);
  
  const displayAddress = walletInfo?.address 
    ? `${walletInfo.address.substring(0, 6)}...${walletInfo.address.substring(walletInfo.address.length - 4)}`
    : '';
  
  // Connect with specified provider
  const handleConnect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Reset authentication tracking when connecting
    hasAttemptedAuth.current = false;
    authAttemptCountRef.current = 0;
    authInProgressRef.current = false;
    globalAuthLock.setLock(false); // Release global lock when reconnecting
    setAuthError(null);
    connect(providerType);
  };
  
  // Disconnect wallet
  const handleDisconnect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Clear any pending authentication timeout
    if (authTimeoutRef.current) {
      clearTimeout(authTimeoutRef.current);
      authTimeoutRef.current = null;
    }
    hasAttemptedAuth.current = false;
    authInProgressRef.current = false;
    globalAuthLock.setLock(false); // Release global lock when disconnecting
    setAuthError(null);
    disconnect();
  };
  
  // Memoize authentication function to prevent dependency changes
  const performAuthentication = useCallback(async () => {
    // Strict guard against parallel authentication attempts, checking both local and global locks
    if (
      !autoAuthenticate ||
      !isConnected ||
      isAuthenticated ||
      isAuthLoading ||
      isAuthenticating ||
      hasAttemptedAuth.current ||
      authInProgressRef.current || // Use ref to check actual in-progress state
      globalAuthLock.isLocked() || // Check global lock
      !walletInfo?.address
    ) {
      console.log("Authentication skipped - already in progress or not needed");
      return;
    }
    
    // Set in-progress flag immediately to prevent parallel calls
    authInProgressRef.current = true;
    globalAuthLock.setLock(true); // Set global lock
    
    try {
      // Increment attempt counter for debugging
      authAttemptCountRef.current += 1;
      // Mark that we're starting authentication to prevent duplicate attempts
      setIsAuthenticating(true);
      hasAttemptedAuth.current = true;
      setAuthError(null);
      
      console.log("Starting wallet authentication with address:", walletInfo.address);
      
      // Add delay to ensure wallet UI is ready and to prevent rapid sequential requests
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      const result = await authenticateWithWallet();
      if (result) {
        console.log("Wallet authentication completed successfully");
      } else {
        throw new Error("Authentication failed with an unknown error");
      }
    } catch (err) {
      console.error("Authentication failed:", err);
      // Extract and set error message
      const errorMessage = err instanceof Error ? err.message : 'Unknown authentication error';
      setAuthError(errorMessage);
      
      // Reset auth attempt flag after a delay to allow for retries if it was a temporary error
      authTimeoutRef.current = setTimeout(() => {
        hasAttemptedAuth.current = false;
        authInProgressRef.current = false; // Clear in-progress flag
        globalAuthLock.setLock(false); // Release global lock
        // Only retry up to 3 times to prevent infinite loops
        if (authAttemptCountRef.current < 3) {
          setIsAuthenticating(false);
        }
      }, 5000);
    } finally {
      setIsAuthenticating(false);
      // Only release locks after timeout or success
      if (!authTimeoutRef.current) {
        authInProgressRef.current = false;
        globalAuthLock.setLock(false); // Release global lock
      }
    }
  }, [autoAuthenticate, isConnected, isAuthenticated, isAuthLoading, authenticateWithWallet, walletInfo?.address, isAuthenticating]);
  
  // Auto authenticate when wallet is connected
  useEffect(() => {
    // Only run this effect when the wallet first connects and authentication hasn't been attempted
    if (isConnected && !hasAttemptedAuth.current && !isAuthenticating && !isAuthenticated && !authInProgressRef.current && !globalAuthLock.isLocked()) {
      // Use a timeout to ensure this doesn't happen during initial rendering cycles and strict mode
      const timeoutId = setTimeout(() => {
        if (!globalAuthLock.isLocked()) { // Check lock again right before starting
          performAuthentication();
        }
      }, 1000); // Increased delay to avoid race conditions
      
      return () => clearTimeout(timeoutId);
    }
    
    // Cleanup function to clear any timeouts
    return () => {
      if (authTimeoutRef.current) {
        clearTimeout(authTimeoutRef.current);
      }
    };
  }, [isConnected, isAuthenticated, performAuthentication, isAuthenticating]);
  
  // Manually trigger authentication if needed
  const handleRetryAuth = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Reset authentication flags to allow a retry
    hasAttemptedAuth.current = false;
    authInProgressRef.current = false;
    globalAuthLock.setLock(false); // Release global lock when manually retrying
    setAuthError(null);
    performAuthentication();
  };
  
  return (
    <div className="wallet-connect-container">
      {!isConnected ? (
        <button 
          className={`wallet-connect-button ${className}`} 
          onClick={handleConnect}
          disabled={isConnecting || isAuthLoading || isAuthenticating || globalAuthLock.isLocked()}
        >
          {isConnecting ? 'Connecting...' : `Connect ${getProviderName(providerType)}`}
        </button>
      ) : (
        <div className="wallet-connected">
          <span className="wallet-address">{displayAddress}</span>
          {isAuthenticated ? (
            <span className="auth-status success">✓ Authenticated</span>
          ) : isAuthenticating || isAuthLoading ? (
            <span className="auth-status pending">Authenticating...</span>
          ) : authError ? (
            <div className="auth-error-container">
              <span className="auth-status error">Authentication failed</span>
              <button 
                onClick={handleRetryAuth} 
                className="retry-auth-button"
                disabled={isAuthenticating || isAuthLoading || authInProgressRef.current || globalAuthLock.isLocked()}
              >
                Retry
              </button>
            </div>
          ) : null}
          <button className={`disconnect-button ${className}`} onClick={handleDisconnect}>
            Disconnect
          </button>
        </div>
      )}
      {error && <p className="wallet-error">{error}</p>}
      {authError && <p className="auth-error">{authError}</p>}
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

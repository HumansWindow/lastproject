import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useWallet } from '../contexts/wallet';
import { useAuth } from '../contexts/auth';
import { WalletProviderType } from '../services/wallet';
import { WalletSelectorModal } from './wallet-selector';
import styles from '../styles/components/WalletConnectButton.module.css';

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
  const { authenticateWithWallet, isAuthenticated, isLoading: isAuthLoading, isAuthenticating, authStage } = useAuth();
  const authInProgressRef = useRef<boolean>(false); // Use ref to track actual auth state across renders
  const hasAttemptedAuth = useRef<boolean>(false);
  const authTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const authAttemptCountRef = useRef<number>(0);
  const [authError, setAuthError] = useState<string | null>(null);
  const [showWalletModal, setShowWalletModal] = useState<boolean>(false);
  const [showDropdown, setShowDropdown] = useState<boolean>(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  
  const displayAddress = walletInfo?.address 
    ? `${walletInfo.address.substring(0, 6)}...${walletInfo.address.substring(walletInfo.address.length - 4)}`
    : '';

  // Get current auth stage for display
  const getAuthStageText = () => {
    switch (authStage) {
      case 'challenge':
        return 'Getting challenge...';
      case 'signing':
        return 'Waiting for signature...';
      case 'fingerprint':
        return 'Generating security key...';
      case 'backend-authentication':
        return 'Authenticating with backend...';
      case 'storing-tokens':
        return 'Storing credentials...';
      case 'fetching-profile':
        return 'Loading profile...';
      default:
        return 'Authenticating...';
    }
  };
  
  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    }
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);
  
  // Handle showing the wallet selector modal instead of directly connecting
  const handleShowWalletSelector = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    // Reset authentication tracking when opening modal
    hasAttemptedAuth.current = false;
    authAttemptCountRef.current = 0;
    authInProgressRef.current = false;
    globalAuthLock.setLock(false); // Release global lock when reconnecting
    setAuthError(null);
    setShowWalletModal(true);
  };
  
  // Handle wallet connection from selector
  const handleWalletConnect = (result: any) => {
    if (result && result.success && result.walletInfo) {
      // Wallet was successfully connected via selector
      setShowWalletModal(false);
      // The wallet context should update automatically via events
      console.log("Wallet connected successfully from selector:", result.walletInfo.address);
    } else if (result && result.error) {
      setAuthError(result.error);
    }
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
    setShowDropdown(false); // Close dropdown after disconnecting
  };

  // Toggle dropdown menu
  const toggleDropdown = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setShowDropdown(prev => !prev);
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
      hasAttemptedAuth.current = true;
      setAuthError(null);
      
      console.log("Starting wallet authentication with address:", walletInfo.address);
      
      // Add delay to ensure wallet UI is ready and to prevent rapid sequential requests
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Call the authenticateWithWallet function with a proper email parameter (optional)
      // We need to catch and handle the error here to prevent bubbling up
      try {
        const result = await authenticateWithWallet();
        if (result) {
          console.log("Wallet authentication completed successfully");
        } else {
          console.warn("Authentication returned false but without throwing an error");
          // Don't throw error here, as we want to treat this as a warning not an error
        }
      } catch (authErr) {
        // Only set error message if the error is meaningful and not just "Authentication failed with no specific error"
        const errMsg = authErr instanceof Error ? authErr.message : 'Unknown authentication error';
        if (errMsg.includes('no specific error')) {
          console.warn("Got 'no specific error' message - this may be a validation issue");
          // Don't set error since this is likely just the accessToken/refreshToken validation issue
        } else {
          throw authErr; // Re-throw if it's a real error
        }
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
          hasAttemptedAuth.current = false;
        }
      }, 5000);
    } finally {
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

  // Effect to clear error when user becomes authenticated
  useEffect(() => {
    if (isAuthenticated && authError) {
      setAuthError(null);
    }
  }, [isAuthenticated, authError]);
  
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
  
  // New wallet button UI with dropdown for connected wallets
  return (
    <div className={styles['wallet-connect-container']}>
      {!isConnected ? (
        <button 
          className={`${styles['wallet-connect-button']} ${className}`} 
          onClick={handleShowWalletSelector}
          disabled={isConnecting || isAuthLoading || isAuthenticating || globalAuthLock.isLocked()}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className={styles['wallet-connected-dropdown']} ref={dropdownRef}>
          <button 
            className={`${styles['wallet-address-button']} ${className} ${showDropdown ? styles.active : ''}`}
            onClick={toggleDropdown}
            disabled={isAuthenticating} // Disable button while authenticating
          >
            <span className={styles['wallet-address']}>{displayAddress}</span>
            {isAuthenticated && <span className={styles['auth-indicator']}>✓</span>}
            {isAuthenticating && <span className={styles['auth-indicator-spinner']}></span>}
            <span className={styles['dropdown-arrow']}>{showDropdown ? '▲' : '▼'}</span>
          </button>
          
          {showDropdown && (
            <div className={styles['wallet-dropdown-menu']}>
              <div className={styles['wallet-info']}>
                <div className={styles['wallet-type']}>
                  {walletInfo?.blockchain} via {getProviderName(walletInfo?.providerType || WalletProviderType.METAMASK)}
                </div>
                <div className={styles['wallet-address-full']}>{walletInfo?.address}</div>
                {isAuthenticated && <div className={styles['auth-status-full']}>Authenticated ✓</div>}
                {isAuthenticating && (
                  <div className={styles['auth-status-full']}>
                    <span className={styles['auth-spinner']}></span>
                    {getAuthStageText()}
                  </div>
                )}
              </div>
              
              <div className={styles['wallet-actions']}>
                <button 
                  className={styles['wallet-action-button']}
                  onClick={handleShowWalletSelector}
                  disabled={isAuthenticating}
                >
                  Switch Wallet
                </button>
                
                {!isAuthenticated && !isAuthenticating && authError && (
                  <button 
                    className={styles['wallet-action-button']}
                    onClick={handleRetryAuth}
                    disabled={isAuthenticating || isAuthLoading}
                  >
                    Retry Authentication
                  </button>
                )}
                
                <button 
                  className={`${styles['wallet-action-button']} ${styles.disconnect}`}
                  onClick={handleDisconnect}
                  disabled={isAuthenticating} // Disable disconnect while authenticating
                >
                  Disconnect
                </button>
              </div>
            </div>
          )}
          
          {/* Show authentication status if not in dropdown */}
          {!showDropdown && !isAuthenticated && (
            <React.Fragment>
              {isAuthenticating ? (
                <span className={`${styles['auth-status']} ${styles.pending}`}>
                  <span className={styles['auth-spinner']}></span>
                  {getAuthStageText()}
                </span>
              ) : authError ? (
                <div className={styles['auth-error-indicator']}>
                  <span className={`${styles['auth-status']} ${styles.error}`}>!</span>
                  <button 
                    onClick={handleRetryAuth} 
                    className={styles['retry-auth-button']}
                    disabled={isAuthenticating || isAuthLoading || authInProgressRef.current || globalAuthLock.isLocked()}
                  >
                    Retry
                  </button>
                </div>
              ) : null}
            </React.Fragment>
          )}
        </div>
      )}
      
      {/* Error messages */}
      {error && <p className={styles['wallet-error']}>{error}</p>}
      {authError && <p className={styles['auth-error']}>{authError}</p>}
      
      {/* Add the wallet selector modal */}
      <WalletSelectorModal
        show={showWalletModal}
        onHide={() => setShowWalletModal(false)}
        onConnect={handleWalletConnect}
      />
    </div>
  );
};

// Helper function to get provider display name
function getProviderName(providerType: WalletProviderType): string {
  const providerNames: Record<string, string> = {
    [WalletProviderType.METAMASK]: 'MetaMask',
    [WalletProviderType.COINBASE]: 'Coinbase',
    [WalletProviderType.WALLETCONNECT]: 'WalletConnect',
    [WalletProviderType.TRUST]: 'Trust Wallet',
    [WalletProviderType.PHANTOM]: 'Phantom',
    [WalletProviderType.BINANCE]: 'Binance Wallet',
    [WalletProviderType.TONKEEPER]: 'TONKeeper',
    [WalletProviderType.TONWALLET]: 'TON Wallet',
    [WalletProviderType.SOLFLARE]: 'Solflare'
  };
  
  return providerNames[providerType] || 'Wallet';
}

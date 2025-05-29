// filepath: /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/frontend/src/components/WalletConnectButton.tsx
import React, { useState, useEffect, useRef } from 'react';
import { Button, Snackbar, Alert } from '@mui/material';
import { useWallet } from '../contexts/WalletProvider';
import { useAuth } from '../contexts/AuthProvider';
import { WalletProviderType, BlockchainType } from '../services/wallet/core/walletBase';
import { WalletSelectorModal } from './wallet-selector/WalletSelectorModal';
import { walletAuthService } from '../services/api/modules/auth';
import walletService from '../services/wallet/walletService';
import { DEFAULT_BLOCKCHAIN_NETWORK, normalizeBlockchainType } from '../config/blockchain/constants';

// TypeScript declarations for custom window properties
declare global {
  interface Window {
    walletAuthDebug?: {
      enabled: boolean;
      info: (message: string, data?: any) => void;
      error: (message: string, error?: any) => void;
      warn: (message: string, data?: any) => void;
    };
  }
}

interface WalletConnectButtonProps {
  variant?: 'contained' | 'outlined' | 'text';
  size?: 'small' | 'medium' | 'large';
  fullWidth?: boolean;
  color?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
  className?: string;
  onConnected?: (address: string) => void;
  onError?: (error: string) => void;
  onAuthenticated?: () => void;
  redirectAfterAuth?: boolean;
  redirectUrl?: string;
}

// Update WalletConnectionResult type to match the expected structure
interface WalletConnectionResult {
  success?: boolean;
  walletInfo?: {
    providerType?: string;
    blockchain?: string;
    address?: string;
  };
  provider?: {
    getProvider?: () => any;
    checkNetworkCompatibility?: () => Promise<{ compatible: boolean; needsSwitch?: boolean; targetChainId?: number }>;
    switchNetwork?: (chainId: number) => Promise<boolean>;
  };
  error?: string;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({
  variant = 'contained',
  size = 'medium',
  fullWidth = false,
  color = 'primary',
  className = '',
  onConnected,
  onError,
  onAuthenticated,
  redirectAfterAuth = false,
  redirectUrl = '/profile'
}) => {
  const { isConnected, isConnecting, connect, disconnect, walletInfo, error: walletError } = useWallet();
  const { isAuthenticated, isAuthenticating, authenticateWithWallet, error: authError, authStage } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [buttonText, setButtonText] = useState('Connect Wallet');
  const [lastConnectionAttempt, setLastConnectionAttempt] = useState<number | null>(null);
  const [isModalOpen, setModalOpen] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const authInProgressRef = useRef(false);
  
  // Update button text based on state
  useEffect(() => {
    if (isLoading || isConnecting || isAuthenticating) {
      if (isConnecting) setButtonText('Connecting...');
      else if (isAuthenticating) setButtonText(`Authenticating (${authStage || 'processing'})...`);
      else setButtonText('Processing...');
    } else if (isAuthenticated && isConnected) {
      const address = walletInfo?.address || '';
      setButtonText(`Connected: ${address.slice(0, 6)}...${address.slice(-4)}`);
    } else if (isConnected) {
      setButtonText('Authenticate');
    } else {
      setButtonText('Connect Wallet');
    }
  }, [isLoading, isConnecting, isAuthenticating, isConnected, isAuthenticated, walletInfo, authStage]);

  // Handle wallet errors
  useEffect(() => {
    if (walletError) {
      setErrorMessage(walletError);
      setShowError(true);
      if (onError) onError(walletError);
    }
  }, [walletError, onError]);

  // Handle auth errors
  useEffect(() => {
    if (authError) {
      setErrorMessage(authError);
      setShowError(true);
      if (onError) onError(authError);
      // Reset auth in progress flag when there's an error
      authInProgressRef.current = false;
    }
  }, [authError, onError]);

  // Reset loading state when authentication process completes
  useEffect(() => {
    if (!isAuthenticating && authInProgressRef.current) {
      authInProgressRef.current = false;
      setIsLoading(false);
    }
  }, [isAuthenticating]);

  const handleCloseError = () => {
    setShowError(false);
  };

  const handleModalClose = () => {
    setModalOpen(false);
  };

  // Consolidate duplicate declarations of getBlockchainName
  const getBlockchainName = (blockchain: BlockchainType): string => {
    switch (blockchain) {
      case BlockchainType.ETHEREUM:
        return 'ethereum';
      case BlockchainType.BINANCE:
        return 'binance';
      case BlockchainType.SOLANA:
        return 'solana';
      case BlockchainType.POLYGON:
        return DEFAULT_BLOCKCHAIN_NETWORK;
      case BlockchainType.TON:
        return 'ton';
      default:
        return DEFAULT_BLOCKCHAIN_NETWORK; // Default to polygon for unknown types
    }
  };

  // Remove duplicate declarations of getAuthDiagnostics
  // Ensure only one definition exists
  const getAuthDiagnostics = async (walletAddress: string, blockchain: string) => {
    try {
      const healthCheck = await walletAuthService.checkHealth();
      console.log('Backend health check:', healthCheck);

      const localAuth = {
        hasAccessToken: !!localStorage.getItem('accessToken'),
        hasRefreshToken: !!localStorage.getItem('refreshToken'),
        hasDeviceFingerprint: !!localStorage.getItem('deviceFingerprint'),
        lastWalletType: localStorage.getItem('lastConnectedWalletType') ?? 'none',
      };

      const challenge = await walletAuthService.requestChallenge(walletAddress, blockchain);
      return {
        walletAddress,
        blockchain,
        isEndpointAvailable: !!healthCheck?.status,
        challengeResult: { success: true, challenge },
        localStorageState: localAuth,
        timestamp: new Date().toISOString(),
      };
    } catch (error) {
      return { error, walletAddress, blockchain, timestamp: new Date().toISOString() };
    }
  };

  // Refactor handleWalletSelect to reduce cognitive complexity
  const handleWalletSelect = (result: WalletConnectionResult): void => {
    (async () => {
      try {
        if (authInProgressRef.current) {
          console.log('Wallet selection processing already in progress, ignoring duplicate');
          return;
        }

        authInProgressRef.current = true;

        if (result.success && result.walletInfo) {
          // Add delay for context synchronization
          if (result.walletInfo?.providerType?.toLowerCase().includes('trust')) {
            console.log('Trust Wallet detected - waiting for context synchronization...');
            await new Promise(resolve => setTimeout(resolve, 2000));
          }

          await processWalletConnection(result);
        } else if (result.error) {
          handleWalletError(result.error);
        }
      } catch (error) {
        handleAuthenticationError(error);
      } finally {
        setIsLoading(false);
        authInProgressRef.current = false;
      }
    })();
  };

  const processWalletConnection = async (result: WalletConnectionResult) => {
    const isTrustWallet = result.walletInfo?.providerType === WalletProviderType.TRUST;
    const blockchainType = isTrustWallet
      ? await processTrustWallet(result)
      : (result.walletInfo?.blockchain as BlockchainType || BlockchainType.POLYGON);

    const blockchainName = getBlockchainName(blockchainType);
    console.log(`🔗 Wallet connected successfully: ${result.walletInfo?.address ?? 'unknown'} (${blockchainName})`);

    localStorage.setItem('lastConnectedBlockchain', blockchainName);
    localStorage.setItem('lastConnectedWalletAddress', result.walletInfo?.address ?? '');
    localStorage.setItem('lastConnectedWalletType', result.walletInfo?.providerType ?? '');

    if (isTrustWallet) {
      await syncWalletInfo(result.walletInfo);
    }

    const success = await authenticateWithWallet(blockchainName);
    if (success) {
      console.log('✅ Authentication successful!');
      onAuthenticated?.();
      if (redirectAfterAuth && redirectUrl) {
        console.log(`🔄 Redirecting to: ${redirectUrl}`);
        window.location.href = redirectUrl;
      }
    } else {
      // Enhance warning with more context
      console.warn('❌ Authentication failed. Blockchain:', blockchainName, 'Wallet Address:', result.walletInfo?.address ?? 'unknown');
      setErrorMessage('Authentication failed. Please check the console for details and try again.');
      setShowError(true);
    }
  };

  const handleWalletError = (error: string) => {
    console.error('❌ Wallet connection error:', error);
    setErrorMessage(error);
    setShowError(true);
    onError?.(error);
  };

  const handleAuthenticationError = (error: unknown) => {
    console.error('❌ Wallet authentication failed:', error);
    setErrorMessage('Authentication failed. Please try again.');
    setShowError(true);
    onError?.(error instanceof Error ? error.message : 'Unknown error');
  };

  // Track if authentication is in progress to prevent duplicate requests
  const authInProcessRef = useRef(false);
  
  // Fix type mismatches by providing default values or type assertions
  // Refactor handleWalletSelect to reduce cognitive complexity
  const processTrustWallet = async (result: WalletConnectionResult) => {
    if (!result.walletInfo) {
      throw new Error('Wallet info is missing');
    }

    const blockchainType = BlockchainType.POLYGON;
    console.log('Trust Wallet detected - ensuring Polygon blockchain type');
    result.walletInfo.blockchain = blockchainType;

    try {
      const trustProvider = result.provider?.getProvider?.();
      if (trustProvider && typeof trustProvider.checkNetworkCompatibility === 'function') {
        console.log('Running Trust Wallet network compatibility check...');
        const networkStatus = await trustProvider.checkNetworkCompatibility();

        if (!networkStatus.compatible && networkStatus.needsSwitch && typeof trustProvider.switchNetwork === 'function') {
          console.log('Attempting to switch to Polygon network automatically...');
          const switched = await trustProvider.switchNetwork(networkStatus.targetChainId);
          if (!switched) {
            throw new Error('Failed to switch to Polygon network. Manual switch required.');
          }
          console.log('Successfully switched to Polygon network');
        }
      }
    } catch (networkError) {
      console.error('Error checking Trust Wallet network compatibility:', networkError);
      throw networkError;
    }

    return blockchainType;
  };

  // Fix type mismatches and strict mode issues
  const syncWalletInfo = async (walletInfo: WalletConnectionResult['walletInfo']) => {
    if (!walletInfo || !walletInfo.address) {
      throw new Error('Wallet address is required for synchronization');
    }

    const safeWalletInfo = {
      address: walletInfo.address,
      blockchain: BlockchainType.POLYGON,
      chainId: 137, // Polygon chain ID
      providerType: WalletProviderType.TRUST,
    };

    console.log('Manually syncing wallet info for', safeWalletInfo.address);
    await walletService.syncWalletInfo(safeWalletInfo);
    console.log('Trust Wallet info manually synced to wallet context');
  };

  const handleClick = async () => {
    try {
      setIsLoading(true);
      
      // If already authenticated, disconnect
      if (isAuthenticated && isConnected) {
        await disconnect();
        return;
      }
      
      // If connected but not authenticated, authenticate
      if (isConnected && walletInfo) {
        if (authInProgressRef.current) {
          console.log('Authentication already in progress, skipping duplicate attempt');
          return;
        }
        
        try {
          const blockchainName = getBlockchainName(walletInfo.blockchain);
          console.log(`🔐 Attempting to authenticate with already connected wallet: ${walletInfo.address} (${blockchainName})`);
          authInProgressRef.current = true;
          
          // Pass blockchain name as first parameter to authenticateWithWallet
          const success = await authenticateWithWallet(normalizeBlockchainType(blockchainName));
          
          if (success) {
            console.log('✅ Authentication successful!');
            onAuthenticated?.();
            if (redirectAfterAuth && redirectUrl) {
              window.location.href = redirectUrl;
            }
          } else {
            console.warn('❌ Authentication failed without error');
            // Get detailed diagnostics
            const diagnostics = await getAuthDiagnostics(walletInfo.address, blockchainName);
            console.error('Authentication diagnostics:', diagnostics);
            
            setErrorMessage('Authentication failed. Please check console for details and try again.');
            setShowError(true);
          }
        } catch (authErr) {
          console.error('❌ Auth error:', authErr);
          setErrorMessage(authErr instanceof Error ? authErr.message : 'Authentication failed');
          setShowError(true);
        } finally {
          authInProgressRef.current = false;
        }
        return;
      }
      
      // Prevent rapid repeated clicks (debounce)
      const now = Date.now();
      if (lastConnectionAttempt && now - lastConnectionAttempt < 3000) {
        console.log('Connection attempt throttled, please wait');
        return;
      }
      
      setLastConnectionAttempt(now);
      
      // Open wallet selector modal instead of connecting directly
      setModalOpen(true);
    } catch (error) {
      console.error('❌ Wallet operation failed:', error);
      const message = error instanceof Error ? error.message : 'Connection failed';
      setErrorMessage(message);
      setShowError(true);
      onError?.(message);
    } finally {
      setIsLoading(false);
    }
  };

  // Choose button color based on connection state
  const buttonColor = isAuthenticated ? 'success' : color;

  return (
    <>
      <Button
        variant={variant}
        size={size}
        fullWidth={fullWidth}
        color={buttonColor}
        className={className}
        onClick={handleClick}
        disabled={isLoading || isConnecting || isAuthenticating}
      >
        {buttonText}
      </Button>
      
      <WalletSelectorModal
        open={isModalOpen}
        onClose={handleModalClose}
        onSelect={handleWalletSelect}
      />
      
      <Snackbar 
        open={showError} 
        autoHideDuration={6000} 
        onClose={handleCloseError}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert onClose={handleCloseError} severity="error" sx={{ width: '100%' }}>
          {errorMessage ?? "An error occurred during wallet operation"}
        </Alert>
      </Snackbar>
    </>
  );
};

export default WalletConnectButton;

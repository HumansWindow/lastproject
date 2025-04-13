import React, { useEffect } from 'react';
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
  
  const displayAddress = walletInfo?.address 
    ? `${walletInfo.address.substring(0, 6)}...${walletInfo.address.substring(walletInfo.address.length - 4)}`
    : '';
  
  // Connect with specified provider
  const handleConnect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    connect(providerType);
  };
  
  // Disconnect wallet
  const handleDisconnect = (event: React.MouseEvent<HTMLButtonElement>) => {
    event.preventDefault();
    disconnect();
  };
  
  // Auto authenticate when wallet is connected
  useEffect(() => {
    const performAuthentication = async () => {
      if (autoAuthenticate && isConnected && !isAuthenticated && !isAuthLoading) {
        try {
          await authenticateWithWallet();
        } catch (err) {
          console.error("Authentication failed:", err);
        }
      }
    };
    
    performAuthentication();
  }, [isConnected, isAuthenticated, isAuthLoading, autoAuthenticate, authenticateWithWallet]);
  
  return (
    <div className="wallet-connect-container">
      {!isConnected ? (
        <button 
          className={`wallet-connect-button ${className}`} 
          onClick={handleConnect}
          disabled={isConnecting || isAuthLoading}
        >
          {isConnecting ? 'Connecting...' : `Connect ${getProviderName(providerType)}`}
        </button>
      ) : (
        <div className="wallet-connected">
          <span className="wallet-address">{displayAddress}</span>
          <button className="disconnect-button" onClick={handleDisconnect}>
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

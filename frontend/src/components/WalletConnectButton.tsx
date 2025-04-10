import React from 'react';
import { useWallet } from '../contexts/wallet';
import { WalletProviderType } from '../services/wallet';

interface WalletConnectButtonProps {
  className?: string;
  providerType?: WalletProviderType;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ 
  className = '',
  providerType = WalletProviderType.METAMASK
}) => {
  const { isConnected, isConnecting, walletInfo, connect, disconnect, error } = useWallet();
  
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
  
  return (
    <div className="wallet-connect-container">
      {!isConnected ? (
        <button 
          className={`wallet-connect-button ${className}`} 
          onClick={handleConnect}
          disabled={isConnecting}
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

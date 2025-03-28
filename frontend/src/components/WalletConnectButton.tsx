import React from 'react';
import { useWallet } from '../contexts/wallet';

interface WalletConnectButtonProps {
  className?: string;
}

export const WalletConnectButton: React.FC<WalletConnectButtonProps> = ({ className = '' }) => {
  const { isConnected, isConnecting, address, connect, disconnect, error } = useWallet();
  
  const displayAddress = address ? `${address.substring(0, 6)}...${address.substring(address.length - 4)}` : '';
  
  return (
    <div className="wallet-connect-container">
      {!isConnected ? (
        <button 
          className={`wallet-connect-button ${className}`} 
          onClick={connect}
          disabled={isConnecting}
        >
          {isConnecting ? 'Connecting...' : 'Connect Wallet'}
        </button>
      ) : (
        <div className="wallet-connected">
          <span className="wallet-address">{displayAddress}</span>
          <button className="disconnect-button" onClick={disconnect}>
            Disconnect
          </button>
        </div>
      )}
      {error && <p className="wallet-error">{error}</p>}
    </div>
  );
};

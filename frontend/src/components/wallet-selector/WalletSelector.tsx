import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { Spinner } from 'react-bootstrap';
import styles from './WalletSelector.module.css';
import { walletSelector, WalletConnectionResult, WalletProviderType, AvailableWallet } from '@/services/wallet';

interface WalletSelectorProps {
  onConnect: (result: WalletConnectionResult) => void;
  onCancel: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ onConnect, onCancel }) => {
  const [wallets, setWallets] = useState<AvailableWallet[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [connecting, setConnecting] = useState<WalletProviderType | null>(null);
  const [connectingStage, setConnectingStage] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const detectAvailableWallets = async () => {
      try {
        const available = await walletSelector.getAvailableWallets();
        setWallets(available || []);
      } catch (err: any) {
        console.error('Error detecting wallets:', err);
        setError('Failed to detect wallets');
      } finally {
        setLoading(false);
      }
    };

    detectAvailableWallets();
  }, []);

  // Connect to a wallet when selected
  const handleConnectWallet = async (wallet: AvailableWallet) => {
    try {
      setConnecting(wallet.providerType);
      setConnectingStage('initializing');
      setError(null);

      // Initialize connection
      setConnectingStage('connecting');
      const result = await walletSelector.connectWallet(wallet.providerType);
      
      if (result.success) {
        setConnectingStage('authenticating');
        // Artificial delay to show connecting state and give backend time to respond
        await new Promise(resolve => setTimeout(resolve, 1000));
        onConnect(result);
      } else {
        setError(result.error || `Failed to connect to ${wallet.name}`);
        setConnecting(null);
      }
    } catch (err: any) {
      console.error('Error connecting to wallet:', err);
      setError(err.message || `Failed to connect to ${wallet.name}`);
      setConnecting(null);
    }
  };

  // Get the appropriate wallet logo with fallback
  const getWalletLogo = (walletType: WalletProviderType): string => {
    // Always return the default wallet SVG as a fallback in case specific icons aren't found
    const defaultSvg = '/assets/wallets/default-wallet.svg';
    
    try {
      // Use a more specific path that already exists in the project
      return defaultSvg;
    } catch (e) {
      // If there's any issue, return the default SVG
      return defaultSvg;
    }
  };

  // Get loading text based on stage
  const getConnectingText = (wallet: AvailableWallet): string => {
    switch(connectingStage) {
      case 'initializing':
        return 'Initializing...';
      case 'connecting':
        return 'Connecting...';
      case 'authenticating':
        return 'Waiting for backend...';
      default:
        return `Connecting to ${wallet.name}...`;
    }
  };

  // Filter out wallets that aren't installed, except for WalletConnect
  const installedWallets = wallets.filter(
    wallet => wallet.installed || wallet.providerType === WalletProviderType.WALLETCONNECT
  );

  return (
    <div className={styles.walletSelectorContainer}>
      <div className={styles.walletSelectorHeader}>
        <h3>Connect Wallet</h3>
        <button 
          type="button" 
          className="btn-close" 
          aria-label="Close" 
          onClick={onCancel}
          disabled={connecting !== null}
        ></button>
      </div>
      
      {error && (
        <div className="alert alert-danger" role="alert">
          {error}
        </div>
      )}

      {loading ? (
        <div className={styles.loadingContainer}>
          <Spinner animation="border" role="status">
            <span className="visually-hidden">Loading...</span>
          </Spinner>
          <p>Detecting available wallets...</p>
        </div>
      ) : (
        <div className={styles.walletsGrid}>
          {installedWallets.map((wallet) => (
            <div 
              key={wallet.providerType}
              className={`${styles.walletCard} ${connecting !== null && connecting !== wallet.providerType ? styles.disabled : ''}`}
              onClick={() => !connecting && handleConnectWallet(wallet)}
            >
              <div className={styles.walletCardInner}>
                <div className={styles.walletLogoContainer}>
                  <Image
                    src={getWalletLogo(wallet.providerType)}
                    alt={`${wallet.name} logo`}
                    width={48}
                    height={48}
                    loading="eager"
                    unoptimized={true}
                  />
                  {connecting === wallet.providerType && (
                    <div className={styles.connectingOverlay}>
                      <Spinner animation="border" size="sm" />
                      <span className={styles.connectingText}>{getConnectingText(wallet)}</span>
                    </div>
                  )}
                </div>
                <div className={styles.walletName}>
                  {wallet.name}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className={styles.walletSelectorFooter}>
        <p className={styles.walletDisclaimer}>
          By connecting your wallet, you agree to our Terms of Service and Privacy Policy
        </p>
      </div>
    </div>
  );
};

export default WalletSelector;
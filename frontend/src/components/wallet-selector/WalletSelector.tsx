import React, { useEffect, useState } from 'react';
import { walletSelector, AvailableWallet, WalletProviderType, WalletConnectionResult } from '@/services/wallet';
import styles from './WalletSelector.module.css';
import Image from 'next/image';
import { Spinner } from 'react-bootstrap';

interface WalletSelectorProps {
  onConnect: (result: WalletConnectionResult) => void;
  onCancel: () => void;
}

const WalletSelector: React.FC<WalletSelectorProps> = ({ onConnect, onCancel }) => {
  const [wallets, setWallets] = useState<AvailableWallet[]>([]);
  const [connecting, setConnecting] = useState<WalletProviderType | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Detect available wallets when component mounts
  useEffect(() => {
    const detectAvailableWallets = async () => {
      try {
        setLoading(true);
        const availableWallets = walletSelector.getAvailableWallets();
        setWallets(availableWallets);
      } catch (err) {
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
      setError(null);

      const result = await walletSelector.connectWallet(wallet.providerType);
      
      if (result.success) {
        onConnect(result);
      } else {
        setError(result.error || `Failed to connect to ${wallet.name}`);
      }
    } catch (err: any) {
      console.error('Error connecting to wallet:', err);
      setError(err.message || `Failed to connect to ${wallet.name}`);
    } finally {
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
              className={styles.walletCard}
              onClick={() => handleConnectWallet(wallet)}
            >
              <div className={styles.walletCardInner}>
                <div className={styles.walletLogoContainer}>
                  <Image
                    src={getWalletLogo(wallet.providerType)}
                    alt={`${wallet.name} logo`}
                    width={48}
                    height={48}
                    priority={true}
                    unoptimized={true}
                  />
                  {connecting === wallet.providerType && (
                    <div className={styles.connectingOverlay}>
                      <Spinner animation="border" size="sm" />
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
import React, { useState, useEffect } from 'react';
import WalletDebugPanel from './WalletDebugPanel';
import styles from './WalletDebugWrapper.module.css';

interface Props {
  children: React.ReactNode;
  autoStartDebugging?: boolean;
}

/**
 * Wrapper component that adds wallet debugging capabilities to any component
 */
const WalletDebugWrapper: React.FC<Props> = ({ 
  children, 
  autoStartDebugging = false 
}) => {
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(autoStartDebugging);
  
  // Only show debug UI in development mode
  const isDev = process.env.NODE_ENV === 'development';
  
  // Check for URL parameter to auto-show debug panel
  useEffect(() => {
    if (typeof window !== 'undefined' && isDev) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.has('wallet-debug')) {
        setShowDebugPanel(true);
      }
    }
  }, [isDev]);
  
  if (!isDev) {
    return <>{children}</>;
  }

  return (
    <>
      {children}
      
      {showDebugPanel && (
        <WalletDebugPanel 
          visible={showDebugPanel} 
          onClose={() => setShowDebugPanel(false)}
        />
      )}
      
      <button
        onClick={() => setShowDebugPanel(!showDebugPanel)}
        className={styles.debugToggleButton}
        title="Toggle Wallet Debug Panel"
      >
        {showDebugPanel ? '🔍' : '🔌'}
      </button>
    </>
  );
};

export default WalletDebugWrapper;
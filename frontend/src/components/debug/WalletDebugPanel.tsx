import React, { useState, useEffect, useRef } from 'react';
import walletConnectionDebugger from '../../utils/wallet-connection-debugger';
import styles from './WalletDebugPanel.module.css';

interface LogEntry {
  timestamp: string;
  message: string;
  isError: boolean;
}

interface Props {
  visible?: boolean;
  onClose?: () => void;
}

const WalletDebugPanel: React.FC<Props> = ({ visible = true, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isActive, setIsActive] = useState<boolean>(visible);
  const [minimized, setMinimized] = useState<boolean>(false);
  const [autoFix, setAutoFix] = useState<boolean>(false);
  const [testingEndpoint, setTestingEndpoint] = useState<boolean>(false);
  const [testWalletAddress, setTestWalletAddress] = useState<string>('');
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Listen for wallet authentication logs
  useEffect(() => {
    if (!isActive) return;
    
    const handleWalletAuthLog = (event: CustomEvent) => {
      const { timestamp, message, isError } = event.detail;
      setLogs(prevLogs => [...prevLogs, { timestamp, message, isError }]);
      
      // Scroll to bottom on new log
      setTimeout(() => {
        if (logsContainerRef.current) {
          logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
        }
      }, 50);
    };
    
    // Start monitoring
    walletConnectionDebugger.startMonitoring();
    
    // Add event listener with type assertion
    window.addEventListener(
      'wallet-auth:log',
      handleWalletAuthLog as EventListener
    );
    
    return () => {
      // Clean up event listener
      window.removeEventListener(
        'wallet-auth:log', 
        handleWalletAuthLog as EventListener
      );
      
      // Stop monitoring when component is unmounted
      walletConnectionDebugger.stopMonitoring();
    };
  }, [isActive]);

  useEffect(() => {
    setIsActive(visible);
  }, [visible]);

  const updateLogs = () => {
    const currentLogs = walletConnectionDebugger.getLogs();
    if (currentLogs.length > 0) {
      const formattedLogs = currentLogs.map((log: string) => {
        const isError = log.includes('ERROR') || log.includes('Error') || log.includes('error');
        // Extract timestamp if available or use current time
        const timestampMatch = log.match(/^\[(.*?)\]/);
        const timestamp = timestampMatch ? timestampMatch[1] : new Date().toISOString();
        
        return {
          timestamp,
          message: log,
          isError
        };
      });
      
      setLogs(prevLogs => {
        // Deduplicate logs based on message content
        const allLogs = [...prevLogs, ...formattedLogs];
        const uniqueLogs = allLogs.filter((log, index, self) => 
          index === self.findIndex(l => l.message === log.message)
        );
        return uniqueLogs;
      });
    }
  };

  const handleClose = () => {
    setIsActive(false);
    if (onClose) onClose();
  };

  const handleClearLogs = () => {
    setLogs([]);
    walletConnectionDebugger.clearLogs();
  };

  const handleMinimize = () => {
    setMinimized(!minimized);
  };

  const handleTestConnectivity = async () => {
    setTestingEndpoint(true);
    await walletConnectionDebugger.testBackendConnectivity();
    setTestingEndpoint(false);
  };

  const handleFixConnectivity = async () => {
    setAutoFix(true);
    await walletConnectionDebugger.fixConnectivityIssues();
    setAutoFix(false);
  };

  const handleTestWalletAuth = async () => {
    if (testWalletAddress) {
      await walletConnectionDebugger.testWalletAuth(testWalletAddress);
    } else {
      // Using console.log instead of directly accessing the log method
      console.log('Please enter a wallet address to test');
      // Dispatch a custom event to add this message to our logs
      const event = new CustomEvent('wallet-auth:log', {
        detail: { 
          message: 'Please enter a wallet address to test', 
          isError: true, 
          timestamp: new Date().toISOString() 
        }
      });
      window.dispatchEvent(event);
    }
  };

  if (!isActive) return null;

  return (
    <div className={styles.debugPanelContainer}>
      <div className={styles.debugPanelHeader}>
        <h3>Wallet Connection Debugger</h3>
        <div className={styles.debugPanelControls}>
          <button onClick={handleMinimize}>
            {minimized ? 'Expand' : 'Minimize'}
          </button>
          <button onClick={handleClose}>Close</button>
        </div>
      </div>
      
      {!minimized && (
        <>
          <div className={styles.debugPanelActions}>
            <button 
              onClick={handleTestConnectivity}
              disabled={testingEndpoint}
            >
              {testingEndpoint ? 'Testing...' : 'Test Connectivity'}
            </button>
            <button 
              onClick={handleFixConnectivity}
              disabled={autoFix}
            >
              {autoFix ? 'Fixing...' : 'Auto-Fix Connection'}
            </button>
            <button onClick={handleClearLogs}>
              Clear Logs
            </button>
          </div>
          
          <div className={styles.walletTestContainer}>
            <input
              type="text"
              placeholder="Enter wallet address to test"
              value={testWalletAddress}
              onChange={(e) => setTestWalletAddress(e.target.value)}
              className={styles.walletAddressInput}
            />
            <button 
              onClick={handleTestWalletAuth}
              disabled={!testWalletAddress}
              className={styles.testWalletButton}
            >
              Test Wallet Auth
            </button>
          </div>
          
          <div 
            className={styles.logsContainer}
            ref={logsContainerRef}
          >
            {logs.length === 0 ? (
              <div className={styles.emptyLogs}>No logs yet. Start by testing connectivity.</div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index}
                  className={`${styles.logEntry} ${log.isError ? styles.errorLog : styles.successLog}`}
                >
                  <span className={styles.timestamp}>[{log.timestamp}]</span>
                  <span className={styles.message}>{log.message}</span>
                </div>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default WalletDebugPanel;
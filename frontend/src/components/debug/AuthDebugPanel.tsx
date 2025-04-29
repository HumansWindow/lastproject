import React, { useEffect, useState, useRef } from 'react';
import walletService from '../../services/wallet';

interface LogEntry {
  timestamp: string;
  message: string;
  isError: boolean;
}

interface Props {
  visible?: boolean;
  onClose?: () => void;
}

const AuthDebugPanel: React.FC<Props> = ({ visible = true, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [isActive, setIsActive] = useState<boolean>(visible);
  const [minimized, setMinimized] = useState<boolean>(false);
  const logsContainerRef = useRef<HTMLDivElement>(null);

  // Listen for wallet authentication logs
  useEffect(() => {
    if (!isActive) return;
    
    // Legacy logs update - if needed
    updateLogs();
    
    // Listen for new wallet-auth:log events
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
    
    // Add event listener with type assertion
    window.addEventListener(
      'wallet-auth:log',
      handleWalletAuthLog as EventListener
    );
    
    // Enable debugging in wallet authenticator
    if (walletService.authenticator) {
      walletService.authenticator.enableDebug(true);
    }
    
    return () => {
      // Clean up event listener
      window.removeEventListener(
        'wallet-auth:log', 
        handleWalletAuthLog as EventListener
      );
      
      // Disable debugging when component is unmounted
      if (walletService.authenticator) {
        walletService.authenticator.enableDebug(false);
      }
    };
  }, [isActive]);

  useEffect(() => {
    setIsActive(visible);
  }, [visible]);

  const updateLogs = () => {
    // Legacy method for backward compatibility
    const currentLogs = walletService.getDebugLogs?.() || [];
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
    if (walletService.clearDebugLogs) {
      walletService.clearDebugLogs();
    }
  };

  const toggleMinimized = () => {
    setMinimized(!minimized);
  };

  if (!isActive) return null;

  return (
    <div 
      style={{
        position: 'fixed',
        bottom: '10px',
        right: '10px',
        width: minimized ? '200px' : '400px',
        height: minimized ? '40px' : '300px',
        background: 'rgba(0, 0, 0, 0.8)',
        color: '#00ff00',
        padding: '10px',
        fontFamily: 'monospace',
        fontSize: '12px',
        zIndex: 9999,
        border: '1px solid #333',
        borderRadius: '5px',
        overflow: 'hidden',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: minimized ? 'none' : '1px solid #444',
        paddingBottom: '5px',
        marginBottom: minimized ? '0' : '5px'
      }}>
        <div style={{ fontWeight: 'bold' }}>🔍 Wallet Auth Debugger</div>
        <div>
          <button
            onClick={toggleMinimized}
            style={{
              background: '#333',
              border: 'none',
              color: 'white',
              marginRight: '5px',
              padding: '2px 5px',
              cursor: 'pointer'
            }}
          >
            {minimized ? '+' : '-'}
          </button>
          <button
            onClick={handleClose}
            style={{
              background: '#333',
              border: 'none',
              color: 'white',
              padding: '2px 5px',
              cursor: 'pointer'
            }}
          >
            X
          </button>
        </div>
      </div>
      
      {!minimized && (
        <>
          <div 
            ref={logsContainerRef}
            style={{ 
              overflowY: 'auto', 
              flex: 1, 
              paddingRight: '5px'
            }}
          >
            {logs.length === 0 ? (
              <div style={{ color: '#888', fontStyle: 'italic' }}>No logs yet...</div>
            ) : (
              logs.map((log, index) => (
                <div 
                  key={index} 
                  style={{ 
                    color: log.isError ? '#ff5555' : '#00ff00',
                    marginBottom: '3px',
                    fontSize: '11px',
                    whiteSpace: 'pre-wrap',
                    wordBreak: 'break-word'
                  }}
                >
                  <span style={{ color: '#888' }}>{log.timestamp.slice(-13)}</span>
                  {" "}
                  {log.isError ? '❌ ' : '✓ '}
                  {log.message}
                </div>
              ))
            )}
          </div>
          
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between',
            marginTop: '8px',
            borderTop: '1px solid #444',
            paddingTop: '8px'
          }}>
            <span style={{ fontSize: '10px' }}>{logs.length} logs</span>
            <button
              onClick={handleClearLogs}
              style={{
                background: '#333',
                border: 'none',
                color: 'white',
                padding: '2px 5px',
                cursor: 'pointer',
                fontSize: '10px'
              }}
            >
              Clear Logs
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default AuthDebugPanel;

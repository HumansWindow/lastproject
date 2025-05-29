import React, { useEffect, useState, useRef } from 'react';
import { walletService } from "../../services/wallet/walletService";

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
    
    // Enable debugging in wallet service - use static method
    if (walletService.constructor && typeof (walletService.constructor as any).setDebugEnabled === 'function') {
      (walletService.constructor as any).setDebugEnabled(true);
    }
    
    return () => {
      // Clean up event listener
      window.removeEventListener(
        'wallet-auth:log', 
        handleWalletAuthLog as EventListener
      );
      
      // Disable debugging when component is unmounted - use static method
      if (walletService.constructor && typeof (walletService.constructor as any).setDebugEnabled === 'function') {
        (walletService.constructor as any).setDebugEnabled(false);
      }
    };
  }, [isActive]);

  useEffect(() => {
    setIsActive(visible);
  }, [visible]);

  const updateLogs = () => {
    // Legacy method for backward compatibility - use static method through constructor
    const currentLogs = walletService.constructor && 
      typeof (walletService.constructor as any).getDebugLogs === 'function' ? 
      (walletService.constructor as any).getDebugLogs() || [] : [];
      
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
    // Use static method through constructor
    if (walletService.constructor && typeof (walletService.constructor as any).clearDebugLogs === 'function') {
      (walletService.constructor as any).clearDebugLogs();
    }
  };

  const handleMinimize = () => {
    setMinimized(!minimized);
  };

  if (!isActive) {
    return null;
  }
  
  // Panel styles
  const containerStyle: React.CSSProperties = {
    position: 'fixed',
    bottom: '20px',
    right: '20px',
    width: minimized ? '200px' : '400px',
    maxHeight: minimized ? '40px' : '400px',
    backgroundColor: '#f8f9fa',
    border: '1px solid #dee2e6',
    borderRadius: '4px',
    boxShadow: '0 0.5rem 1rem rgba(0, 0, 0, 0.15)',
    zIndex: 1050,
    overflow: 'hidden',
    transition: 'all 0.3s ease',
  };

  const headerStyle: React.CSSProperties = {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '8px 12px',
    backgroundColor: '#e9ecef',
    borderBottom: minimized ? 'none' : '1px solid #dee2e6',
  };

  const buttonStyle: React.CSSProperties = {
    background: 'none',
    border: 'none',
    cursor: 'pointer',
    padding: '4px',
    marginLeft: '5px',
  };

  const logContainerStyle: React.CSSProperties = {
    maxHeight: '320px',
    overflowY: 'auto',
    padding: '10px',
    display: minimized ? 'none' : 'block',
  };

  const logEntryStyle = (isError: boolean): React.CSSProperties => ({
    margin: '4px 0',
    padding: '4px 8px',
    borderRadius: '3px',
    backgroundColor: isError ? '#f8d7da' : '#d4edda',
    color: isError ? '#721c24' : '#155724',
    fontSize: '12px',
    fontFamily: 'monospace',
    whiteSpace: 'pre-wrap',
    wordBreak: 'break-word',
  });

  const controlsStyle: React.CSSProperties = {
    display: minimized ? 'none' : 'flex',
    justifyContent: 'flex-end',
    padding: '8px',
    borderTop: '1px solid #dee2e6',
  };

  const clearButtonStyle: React.CSSProperties = {
    background: 'none',
    border: '1px solid #6c757d',
    borderRadius: '4px',
    padding: '4px 8px',
    cursor: 'pointer',
    fontSize: '12px',
    color: '#6c757d',
  };

  return (
    <div style={containerStyle}>
      <div style={headerStyle}>
        <span style={{ fontWeight: 'bold', fontSize: '14px' }}>
          Wallet Auth Debug
        </span>
        <div>
          <button style={buttonStyle} onClick={handleMinimize} title={minimized ? 'Expand' : 'Minimize'}>
            {minimized ? '🔼' : '🔽'}
          </button>
          <button style={buttonStyle} onClick={handleClose} title="Close">
            ❌
          </button>
        </div>
      </div>
      
      <div ref={logsContainerRef} style={logContainerStyle}>
        {logs.length === 0 ? (
          <div style={{ padding: '8px', color: '#6c757d', fontSize: '12px', fontStyle: 'italic' }}>
            No logs yet. Connect a wallet to see authentication activity.
          </div>
        ) : (
          logs.map((log, index) => (
            <div key={index} style={logEntryStyle(log.isError)}>
              <span style={{ opacity: 0.7 }}>[{log.timestamp}]</span> {log.message}
            </div>
          ))
        )}
      </div>

      <div style={controlsStyle}>
        <button style={clearButtonStyle} onClick={handleClearLogs}>
          Clear Logs
        </button>
      </div>
    </div>
  );
};

export default AuthDebugPanel;

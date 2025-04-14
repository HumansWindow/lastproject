import React, { useEffect, useState } from 'react';
import walletService from '../../services/wallet';

interface Props {
  visible?: boolean;
  onClose?: () => void;
}

const AuthDebugPanel: React.FC<Props> = ({ visible = true, onClose }) => {
  const [logs, setLogs] = useState<string[]>([]);
  const [isActive, setIsActive] = useState<boolean>(visible);
  const [minimized, setMinimized] = useState<boolean>(false);

  useEffect(() => {
    if (!isActive) return;
    updateLogs();
    const interval = setInterval(updateLogs, 1000);
    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    setIsActive(visible);
  }, [visible]);

  const updateLogs = () => {
    const currentLogs = walletService.getDebugLogs?.() || [];
    setLogs(currentLogs);
  };

  const handleClose = () => {
    setIsActive(false);
    if (onClose) onClose();
  };

  const handleClearLogs = () => {
    walletService.clearDebugLogs?.();
    setLogs([]);
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
        <div style={{ fontWeight: 'bold' }}>🔍 Auth Debugger</div>
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
          <div style={{ 
            overflowY: 'auto', 
            flex: 1, 
            paddingRight: '5px'
          }}>
            {logs.length === 0 ? (
              <div style={{ color: '#888', fontStyle: 'italic' }}>No logs yet...</div>
            ) : (
              logs.map((log, index) => {
                const isError = log.includes('❌ ERROR');
                return (
                  <div 
                    key={index} 
                    style={{ 
                      color: isError ? '#ff5555' : '#00ff00',
                      marginBottom: '3px',
                      fontSize: '11px',
                      whiteSpace: 'pre-wrap',
                      wordBreak: 'break-word'
                    }}
                  >
                    {log}
                  </div>
                );
              })
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

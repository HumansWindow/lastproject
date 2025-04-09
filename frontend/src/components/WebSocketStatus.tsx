import React from 'react';
import { useWebSocketContext } from '../contexts/websocket';
import { ConnectionStatus } from '../services/realtime';
import { useTranslation } from 'react-i18next';

export interface WebSocketStatusProps {
  showDetails?: boolean;
  showErrorDetails?: boolean; // Add this property
  showReconnectAttempts?: boolean; // Add this property
  showConnectionDuration?: boolean; // Add this property
  showDiagnosticInfo?: boolean; // Add this property
  className?: string;
}

// Helper to format duration in ms to human-readable time
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  if (minutes < 60) return `${minutes}m ${remainingSeconds}s`;
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  return `${hours}h ${remainingMinutes}m`;
};

const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  showDetails = false,
  showConnectionDuration = false,
  showDiagnosticInfo = false,
  className = ''
}) => {
  const { 
    connectionStatus, 
    isConnected, 
    reset, 
    connectionDuration,
    failureReason
  } = useWebSocketContext();
  const { t } = useTranslation();
  
  // Determine status color
  let statusColor = 'bg-gray-500'; // Default (unknown)
  let statusText = '';
  
  switch (connectionStatus) {
    case ConnectionStatus.CONNECTED:
      statusColor = 'bg-green-500';
      statusText = t('common.websocket_connected');
      break;
    case ConnectionStatus.CONNECTING:
      statusColor = 'bg-yellow-500';
      statusText = t('common.websocket_connecting');
      break;
    case ConnectionStatus.RECONNECTING:
      statusColor = 'bg-yellow-500';
      statusText = t('common.websocket_reconnecting');
      break;
    case ConnectionStatus.DISCONNECTED:
      statusColor = 'bg-gray-500';
      statusText = t('common.websocket_disconnected');
      break;
    case ConnectionStatus.ERROR:
      statusColor = 'bg-red-500';
      statusText = t('common.websocket_error');
      break;
  }
  
  // Just render the indicator dot if details not needed
  if (!showDetails) {
    return (
      <div className={`ws-status-indicator ${className}`}>
        <div 
          className={`w-3 h-3 rounded-full ${statusColor}`} 
          title={statusText}
        />
      </div>
    );
  }
  
  // Render full status with details
  return (
    <div className={`ws-status ${className} p-2 border rounded flex flex-col`}>
      <div className="flex items-center mb-1">
        <div className={`w-3 h-3 rounded-full ${statusColor} mr-2`} />
        <span className="text-sm font-medium">{statusText}</span>
      </div>
      
      {/* Connection duration if connected and requested */}
      {isConnected && showConnectionDuration && (
        <div className="text-xs text-gray-600 ml-5">
          {t('common.connection_time', { time: formatDuration(connectionDuration) })}
        </div>
      )}
      
      {/* Error message if there is one */}
      {failureReason && connectionStatus === ConnectionStatus.ERROR && (
        <div className="text-xs text-red-600 ml-5 my-1">
          {t('common.connection_failed', { reason: failureReason })}
        </div>
      )}
      
      {/* Diagnostic info if requested */}
      {showDiagnosticInfo && (
        <div className="text-xs text-gray-500 ml-5 mb-1">
          Status: {connectionStatus} | 
          Duration: {formatDuration(connectionDuration)}
        </div>
      )}
      
      {/* Retry button for reconnecting */}
      {(connectionStatus === ConnectionStatus.ERROR || 
        connectionStatus === ConnectionStatus.DISCONNECTED) && (
        <button
          className="mt-2 px-3 py-1 text-xs bg-blue-500 text-white rounded hover:bg-blue-600"
          onClick={() => reset()}
        >
          {t('common.retry_connection')}
        </button>
      )}
    </div>
  );
};

export default WebSocketStatus;
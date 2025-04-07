import React, { useEffect, useState, useCallback } from 'react';
import { realtimeService } from '../services/realtime/websocket/realtime-service';
import { ConnectionStatus, WebSocketError } from '../services/realtime/websocket/websocket-manager';
import { Tooltip, Badge } from 'react-bootstrap';
import OverlayTrigger from 'react-bootstrap/OverlayTrigger';

interface WebSocketStatusProps {
  showDetails?: boolean;
  className?: string;
  showErrorDetails?: boolean;
  showReconnectAttempts?: boolean;
  showDiagnosticInfo?: boolean;
  showConnectionDuration?: boolean;
}

/**
 * Component to display WebSocket connection status with detailed information
 */
const WebSocketStatus: React.FC<WebSocketStatusProps> = ({ 
  showDetails = false, 
  className = '',
  showErrorDetails = false,
  showReconnectAttempts = false,
  showDiagnosticInfo = false,
  showConnectionDuration = false
}) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [lastError, setLastError] = useState<WebSocketError | null>(null);
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [isExpanded, setIsExpanded] = useState<boolean>(false);
  const [connectionTime, setConnectionTime] = useState<number | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [lastConnected, setLastConnected] = useState<number | null>(null);
  const [connectionDuration, setConnectionDuration] = useState<string>('');
  const [messagesReceived, setMessagesReceived] = useState<number>(0);
  const [lastPingTime, setLastPingTime] = useState<number | null>(null);
  
  // Calculate and update connection duration
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;
    
    if (status === ConnectionStatus.CONNECTED && connectionTime) {
      interval = setInterval(() => {
        const duration = Date.now() - connectionTime;
        setConnectionDuration(formatDuration(duration));
      }, 1000);
    } else if (interval) {
      clearInterval(interval);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [status, connectionTime]);
  
  // Periodically check latency when connected
  useEffect(() => {
    let pingInterval: ReturnType<typeof setInterval> | null = null;
    
    if (status === ConnectionStatus.CONNECTED && showDiagnosticInfo) {
      pingInterval = setInterval(() => {
        checkLatency();
      }, 30000); // Check every 30 seconds
    }
    
    return () => {
      if (pingInterval) {
        clearInterval(pingInterval);
      }
    };
  }, [status, showDiagnosticInfo]);
  
  // Check connection latency
  const checkLatency = useCallback(async () => {
    if (status === ConnectionStatus.CONNECTED) {
      try {
        setLastPingTime(Date.now());
        const startTime = Date.now();
        await realtimeService.ping();
        const pingLatency = Date.now() - startTime;
        setLatency(pingLatency);
      } catch (error) {
        console.error('Ping failed:', error);
        setLatency(null);
      }
    }
  }, [status]);
  
  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribeStatus = realtimeService.onConnectionStatusChange((newStatus) => {
      setStatus(newStatus);
      
      if (newStatus === ConnectionStatus.CONNECTED) {
        setConnectionTime(Date.now());
        setLastConnected(Date.now());
        checkLatency();
      } else if (newStatus === ConnectionStatus.RECONNECTING) {
        setReconnectAttempts(prev => prev + 1);
      }
    });
    
    // Subscribe to WebSocket errors
    let unsubscribeErrors = () => {};
    if (typeof realtimeService.onError === 'function') {
      unsubscribeErrors = realtimeService.onError((error) => {
        setLastError(error);
      });
    }
    
    // Subscribe to WebSocket messages to count them
    let unsubscribeMessages = () => {};
    if (showDiagnosticInfo && typeof realtimeService.onMessage === 'function') {
      unsubscribeMessages = realtimeService.onMessage(() => {
        setMessagesReceived(prev => prev + 1);
      });
    }
    
    // Clean up subscriptions on unmount
    return () => {
      unsubscribeStatus();
      unsubscribeErrors();
      unsubscribeMessages();
    };
  }, [checkLatency, showDiagnosticInfo]);
  
  // Get status color based on connection state
  const getStatusColor = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'bg-green-500';
      case ConnectionStatus.CONNECTING:
        return 'bg-yellow-500';
      case ConnectionStatus.RECONNECTING:
        return 'bg-yellow-400';
      case ConnectionStatus.ERROR:
        return 'bg-red-500';
      default:
        return 'bg-gray-500';
    }
  };
  
  // Get status badge variant
  const getStatusBadgeVariant = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'success';
      case ConnectionStatus.CONNECTING:
        return 'warning';
      case ConnectionStatus.RECONNECTING:
        return 'warning';
      case ConnectionStatus.ERROR:
        return 'danger';
      default:
        return 'secondary';
    }
  };
  
  // Get status text based on connection state
  const getStatusText = () => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return 'Connected';
      case ConnectionStatus.CONNECTING:
        return 'Connecting...';
      case ConnectionStatus.RECONNECTING:
        return `Reconnecting... (Attempt ${reconnectAttempts})`;
      case ConnectionStatus.ERROR:
        return 'Connection Error';
      default:
        return 'Disconnected';
    }
  };
  
  // Format error message for display
  const getErrorMessage = () => {
    if (!lastError) return '';
    
    return `${lastError.code ? `[${lastError.code}] ` : ''}${lastError.message}`;
  };
  
  // Format time for display
  const formatTime = (timestamp: number | null) => {
    if (!timestamp) return 'Never';
    return new Date(timestamp).toLocaleTimeString();
  };
  
  // Format duration in ms to a human-readable string
  const formatDuration = (milliseconds: number): string => {
    if (milliseconds < 1000) {
      return `${milliseconds}ms`;
    }
    
    const seconds = Math.floor(milliseconds / 1000) % 60;
    const minutes = Math.floor(milliseconds / (1000 * 60)) % 60;
    const hours = Math.floor(milliseconds / (1000 * 60 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m ${seconds}s`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  // Tooltip for detailed information
  const renderTooltip = (props: any) => (
    <Tooltip id="websocket-status-tooltip" {...props}>
      <div className="text-left">
        <div><strong>Status:</strong> {getStatusText()}</div>
        {status === ConnectionStatus.CONNECTED && (
          <div><strong>Connected for:</strong> {connectionDuration}</div>
        )}
        {lastConnected && (
          <div><strong>Last connected:</strong> {formatTime(lastConnected)}</div>
        )}
        {latency !== null && (
          <div><strong>Latency:</strong> {latency}ms</div>
        )}
        {lastError && showErrorDetails && (
          <div><strong>Error:</strong> {getErrorMessage()}</div>
        )}
      </div>
    </Tooltip>
  );
  
  // Basic display with indicator and optional text
  const basicDisplay = (
    <div className={`flex items-center ${className}`}>
      <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
      {showDetails && (
        <>
          <span className="ml-2 text-sm">{getStatusText()}</span>
          {showConnectionDuration && status === ConnectionStatus.CONNECTED && (
            <span className="ml-2 text-xs text-gray-500">({connectionDuration})</span>
          )}
        </>
      )}
    </div>
  );
  
  // Enhanced display with error details and more information
  const enhancedDisplay = (
    <div className="flex flex-col">
      <div className={`flex items-center ${className}`}>
        <div className={`w-3 h-3 rounded-full ${getStatusColor()}`} />
        <span className="ml-2 text-sm">{getStatusText()}</span>
        <button 
          className="ml-2 text-sm text-blue-500" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-2 text-sm ml-5 flex flex-col space-y-1">
          {showConnectionDuration && status === ConnectionStatus.CONNECTED && (
            <div><strong>Connected for:</strong> {connectionDuration}</div>
          )}
          {showReconnectAttempts && reconnectAttempts > 0 && (
            <div><strong>Reconnection attempts:</strong> {reconnectAttempts}</div>
          )}
          {lastConnected && (
            <div><strong>Last connected:</strong> {formatTime(lastConnected)}</div>
          )}
          {showErrorDetails && lastError && (
            <div className="text-red-500">
              <strong>Error:</strong> {getErrorMessage()}
            </div>
          )}
        </div>
      )}
    </div>
  );
  
  // Diagnostic display with Badge and more details
  const diagnosticDisplay = (
    <div className="flex flex-col">
      <div className="flex items-center gap-2">
        <Badge bg={getStatusBadgeVariant()}>
          {getStatusText()}
        </Badge>
        <button 
          className="text-sm text-blue-500" 
          onClick={() => setIsExpanded(!isExpanded)}
        >
          {isExpanded ? 'Hide Details' : 'Show Details'}
        </button>
      </div>
      
      {isExpanded && (
        <div className="mt-2 text-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <tbody className="divide-y divide-gray-200">
              <tr>
                <td className="px-2 py-1 font-medium">Status:</td>
                <td className="px-2 py-1">{getStatusText()}</td>
              </tr>
              {status === ConnectionStatus.CONNECTED && (
                <tr>
                  <td className="px-2 py-1 font-medium">Connected for:</td>
                  <td className="px-2 py-1">{connectionDuration}</td>
                </tr>
              )}
              {reconnectAttempts > 0 && (
                <tr>
                  <td className="px-2 py-1 font-medium">Reconnect attempts:</td>
                  <td className="px-2 py-1">{reconnectAttempts}</td>
                </tr>
              )}
              <tr>
                <td className="px-2 py-1 font-medium">Last connected:</td>
                <td className="px-2 py-1">{formatTime(lastConnected)}</td>
              </tr>
              {latency !== null && (
                <tr>
                  <td className="px-2 py-1 font-medium">Latency:</td>
                  <td className="px-2 py-1">{latency}ms</td>
                </tr>
              )}
              {messagesReceived > 0 && (
                <tr>
                  <td className="px-2 py-1 font-medium">Messages received:</td>
                  <td className="px-2 py-1">{messagesReceived}</td>
                </tr>
              )}
              {lastError && (
                <tr>
                  <td className="px-2 py-1 font-medium text-red-500">Last error:</td>
                  <td className="px-2 py-1 text-red-500">{getErrorMessage()}</td>
                </tr>
              )}
            </tbody>
          </table>
          
          {latency === null && status === ConnectionStatus.CONNECTED && (
            <button
              className="mt-2 px-3 py-1 text-sm bg-blue-500 text-white rounded"
              onClick={checkLatency}
            >
              Check Connection
            </button>
          )}
        </div>
      )}
    </div>
  );
  
  // Choose display based on props
  let content;
  
  if (showDiagnosticInfo) {
    content = diagnosticDisplay;
  } else if (showErrorDetails || showReconnectAttempts || showConnectionDuration) {
    content = enhancedDisplay;
  } else {
    content = basicDisplay;
  }
  
  // If we're showing detailed display, return the content directly
  // Otherwise wrap it in a tooltip
  if (showDetails && (showErrorDetails || showReconnectAttempts || showDiagnosticInfo)) {
    return content;
  }
  
  // For minimal display, wrap in tooltip
  return (
    <OverlayTrigger
      placement="bottom"
      delay={{ show: 250, hide: 400 }}
      overlay={renderTooltip}
    >
      <div>{content}</div>
    </OverlayTrigger>
  );
};

export default WebSocketStatus;
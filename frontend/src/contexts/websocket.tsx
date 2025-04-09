import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { realtimeService } from '../services/realtime';
import { ConnectionStatus } from '../types/realtime-types';
import { useTranslation } from 'react-i18next';

// Define the WebSocket context interface
interface WebSocketContextInterface {
  connectionStatus: ConnectionStatus;
  isConnected: boolean;
  connect: (token: string) => Promise<void>;
  disconnect: () => void;
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
  reset: () => Promise<void>;
  connectionDuration: number;
  failureReason: string | null;
}

// Create the WebSocket context
const WebSocketContext = createContext<WebSocketContextInterface | undefined>(undefined);

// WebSocket provider props
interface WebSocketProviderProps {
  children: ReactNode;
  autoConnect?: boolean;
}

// Map from service enum values to our enum values
const mapServiceStatusToAppStatus = (serviceStatus: any): ConnectionStatus => {
  switch(serviceStatus) {
    case 'connected': return ConnectionStatus.CONNECTED;
    case 'connecting': return ConnectionStatus.CONNECTING;
    case 'disconnected': return ConnectionStatus.DISCONNECTED;
    case 'reconnecting': return ConnectionStatus.RECONNECTING;
    case 'error': return ConnectionStatus.ERROR;
    default: return ConnectionStatus.DISCONNECTED;
  }
};

// WebSocket provider component
export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({ 
  children,
  autoConnect = true
}) => {
  // State
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(() => 
    mapServiceStatusToAppStatus(realtimeService.getConnectionStatus())
  );
  const [connectionDuration, setConnectionDuration] = useState<number>(0);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  
  // Translations
  const { t } = useTranslation();
  
  // Update connection status when it changes
  useEffect(() => {
    const updateStatus = (status: ConnectionStatus) => {
      setConnectionStatus(status);
      setFailureReason(realtimeService.getConnectionFailureReason());
      
      if (status === ConnectionStatus.CONNECTED) {
        // Show a success message when connected
        console.log(t('common.websocket_connected'));
      } else if (status === ConnectionStatus.RECONNECTING) {
        // Show a reconnecting message
        console.log(t('common.websocket_reconnecting'));
      }
    };
    
    // Subscribe to status changes
    const unsubscribe = realtimeService.subscribe('connectionStatus', (data: any) => {
      updateStatus(mapServiceStatusToAppStatus(data.status));
    });
    
    // Initialize with current status
    updateStatus(mapServiceStatusToAppStatus(realtimeService.getConnectionStatus()));
    
    // Cleanup on unmount
    return () => {
      unsubscribe();
    };
  }, [t]);
  
  // Update connection duration when connected
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;
    
    if (connectionStatus === ConnectionStatus.CONNECTED) {
      interval = setInterval(() => {
        setConnectionDuration(realtimeService.getConnectionDuration());
      }, 1000);
    }
    
    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [connectionStatus]);
  
  // Auto-connect on component mount if autoConnect is true
  useEffect(() => {
    if (autoConnect) {
      const token = localStorage.getItem('accessToken');
      if (token) {
        realtimeService.connect(token).catch((error: Error) => {
          console.error('Failed to auto-connect WebSocket:', error);
          setFailureReason(error.message || 'Unknown error');
        });
      }
    }
    
    // Cleanup on unmount
    return () => {
      // Only disconnect if we auto-connected
      if (autoConnect) {
        realtimeService.disconnect();
      }
    };
  }, [autoConnect]);
  
  // Create context value
  const contextValue: WebSocketContextInterface = {
    connectionStatus,
    isConnected: connectionStatus === ConnectionStatus.CONNECTED,
    connect: realtimeService.connect.bind(realtimeService),
    disconnect: realtimeService.disconnect.bind(realtimeService),
    subscribe: realtimeService.subscribe.bind(realtimeService),
    reset: realtimeService.reset.bind(realtimeService),
    connectionDuration,
    failureReason
  };
  
  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};

// Hook for using the WebSocket context
export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (!context) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

export default WebSocketContext;
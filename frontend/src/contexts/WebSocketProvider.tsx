import React, { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { RealtimeServiceInterface, WebSocketStatus } from '../types/realtimeTypes';

// Import the global realtimeService (using named import instead of default)
import { realtimeService as globalRealtimeService } from '../services/realtime';

interface WebSocketContextType {
  isConnected: boolean;
  connectionStatus: WebSocketStatus;
  connectionDuration: number;
  failureReason: string | null;
  connect: (token?: string) => Promise<boolean>;
  disconnect: () => void;
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
  reset: () => void;
}

const defaultContext: WebSocketContextType = {
  isConnected: false,
  connectionStatus: 'disconnected',
  connectionDuration: 0,
  failureReason: null,
  connect: async () => false,
  disconnect: () => {},
  subscribe: () => () => {},
  reset: () => {},
};

const WebSocketContext = createContext<WebSocketContextType>(defaultContext);

export const useWebSocket = () => useContext(WebSocketContext);

interface WebSocketProviderProps {
  children: ReactNode;
  defaultToken?: string;
  enableAutoConnect?: boolean;
}

const typecastRealtimeService = globalRealtimeService as unknown as RealtimeServiceInterface;

export const WebSocketProvider: React.FC<WebSocketProviderProps> = ({
  children,
  defaultToken,
  enableAutoConnect = false,
}) => {
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [connectionStatus, setConnectionStatus] = useState<WebSocketStatus>('disconnected');
  const [connectionDuration, setConnectionDuration] = useState<number>(0);
  const [failureReason, setFailureReason] = useState<string | null>(null);
  const [durationUpdateInterval, setDurationUpdateInterval] = useState<NodeJS.Timeout | null>(null);

  // Handle connection failure
  const handleConnectionFailure = useCallback(() => {
    setFailureReason(typecastRealtimeService.getConnectionFailureReason?.() ?? 'Unknown error');
    setIsConnected(false);
    setConnectionStatus('disconnected');
    if (durationUpdateInterval) {
      clearInterval(durationUpdateInterval);
      setDurationUpdateInterval(null);
    }
  }, [durationUpdateInterval]);

  // Setup connection status updates
  useEffect(() => {
    // Get initial status
    setConnectionStatus(
      typecastRealtimeService.getConnectionStatus?.() || 'disconnected'
    );

    // Subscribe to connection status changes
    const unsubscribe = typecastRealtimeService.subscribe?.('connectionStatus', (data: any) => {
      const newStatus = data?.status || 'disconnected';
      setConnectionStatus(newStatus);
      setIsConnected(newStatus === 'connected');
    });

    // Get current connection status again to ensure we're in sync
    setConnectionStatus(
      typecastRealtimeService.getConnectionStatus?.() || 'disconnected'
    );

    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);

  // Track connection duration
  useEffect(() => {
    if (isConnected) {
      // Start tracking duration
      if (typecastRealtimeService.getConnectionDuration) {
        setConnectionDuration(typecastRealtimeService.getConnectionDuration());
      }

      // Update every second
      const interval = setInterval(() => {
        if (typecastRealtimeService.getConnectionDuration) {
          setConnectionDuration(typecastRealtimeService.getConnectionDuration());
        }
      }, 1000);

      setDurationUpdateInterval(interval);
      return () => clearInterval(interval);
    } else if (durationUpdateInterval) {
      // If disconnected, stop tracking
      clearInterval(durationUpdateInterval);
      setDurationUpdateInterval(null);
    }
    return () => {};
  }, [isConnected, durationUpdateInterval]);

  // Connect to WebSocket
  const connect = useCallback(async (token?: string) => {
    if (typecastRealtimeService.connect) {
      return await typecastRealtimeService.connect(token);
    }
    return false;
  }, []);

  // Disconnect from WebSocket
  const disconnect = useCallback(() => {
    if (typecastRealtimeService.disconnect) {
      typecastRealtimeService.disconnect();
    }
    setIsConnected(false);
    setConnectionStatus('disconnected');
  }, []);

  // Context value
  const contextValue: WebSocketContextType = {
    isConnected,
    connectionStatus,
    connectionDuration,
    failureReason,
    connect: typecastRealtimeService.connect?.bind(typecastRealtimeService) || connect,
    disconnect: typecastRealtimeService.disconnect?.bind(typecastRealtimeService) || disconnect,
    subscribe: typecastRealtimeService.subscribe?.bind(typecastRealtimeService) || (() => () => {}),
    reset: typecastRealtimeService.reset?.bind(typecastRealtimeService) || (() => {}),
  };

  return (
    <WebSocketContext.Provider value={contextValue}>
      {children}
    </WebSocketContext.Provider>
  );
};
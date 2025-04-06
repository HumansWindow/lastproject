import { useEffect, useState } from 'react';
import { realtimeService } from '../services/api';
import { ConnectionStatus } from '../services/websocket-manager';

/**
 * Custom hook to handle WebSocket connection lifecycle
 * This extracts the WebSocket initialization logic from App.tsx
 * to make it compatible with Next.js structure
 */
export const useWebSocket = () => {
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);

  useEffect(() => {
    // Initialize WebSocket connection if user is already logged in
    const accessToken = localStorage?.getItem('accessToken');
    if (accessToken) {
      realtimeService.connect(accessToken)
        .then(() => {
          console.log('WebSocket connection established on app load');
        })
        .catch(error => {
          console.error('WebSocket connection failed on app load:', error);
        });
    }

    // Handle online/offline events
    function handleOnline() {
      const token = localStorage?.getItem('accessToken');
      if (token && realtimeService.getConnectionStatus() === ConnectionStatus.DISCONNECTED) {
        realtimeService.connect(token).catch(console.error);
      }
    }
    
    // Track connection status changes
    const unsubscribeFromStatus = realtimeService.onConnectionStatusChange(status => {
      setConnectionStatus(status);
    });
    
    // Add online event listener for reconnection
    if (typeof window !== 'undefined') {
      window.addEventListener('online', handleOnline);
    }
    
    return () => {
      if (typeof window !== 'undefined') {
        window.removeEventListener('online', handleOnline);
      }
      
      // Unsubscribe from status updates
      unsubscribeFromStatus();
      
      // Disconnect WebSocket when component unmounts
      realtimeService.disconnect();
    };
  }, []);

  return {
    connectionStatus,
    isConnected: realtimeService.isConnected(),
    connect: realtimeService.connect.bind(realtimeService),
    disconnect: realtimeService.disconnect.bind(realtimeService)
  };
};

export default useWebSocket;
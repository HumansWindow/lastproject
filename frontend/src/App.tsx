import React, { useEffect } from 'react';
// ...other imports...
import { realtimeService } from './services/api';
import { ConnectionStatus } from './services/websocket-manager';

function App() {
  // ...existing code...

  // Initialize WebSocket connection if user is already logged in
  useEffect(() => {
    const accessToken = localStorage.getItem('accessToken');
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
      const token = localStorage.getItem('accessToken');
      if (token && realtimeService.getConnectionStatus() === ConnectionStatus.DISCONNECTED) {
        realtimeService.connect(token).catch(console.error);
      }
    }
    
    window.addEventListener('online', handleOnline);
    
    return () => {
      window.removeEventListener('online', handleOnline);
      // Disconnect WebSocket when app unmounts
      realtimeService.disconnect();
    };
  }, []);

  // ...existing rendering code...
}
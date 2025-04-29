import React, { createContext, useContext, useEffect, useState } from 'react';
import { ConnectionStatus } from '../services/realtime';

interface WebSocketContextType {
  status: ConnectionStatus;
  connect: () => void;
  disconnect: () => void;
  subscribe: (channel: string, callback: (data: any) => void) => () => void;
}

const WebSocketContext = createContext<WebSocketContextType | undefined>(undefined);

export const useWebSocketContext = () => {
  const context = useContext(WebSocketContext);
  if (context === undefined) {
    throw new Error('useWebSocketContext must be used within a WebSocketProvider');
  }
  return context;
};

export const WebSocketProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [subscribers, setSubscribers] = useState<Map<string, Set<(data: any) => void>>>(
    new Map()
  );

  const connect = () => {
    if (socket?.readyState === WebSocket.OPEN) return;
    
    setStatus(ConnectionStatus.CONNECTING);
    
    try {
      const wsUrl = process.env.NEXT_PUBLIC_WS_URL || 'ws://localhost:8080';
      const ws = new WebSocket(wsUrl);
      
      ws.onopen = () => {
        setStatus(ConnectionStatus.CONNECTED);
      };
      
      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          const { channel, data } = message;
          
          if (channel && subscribers.has(channel)) {
            const callbacks = subscribers.get(channel);
            callbacks?.forEach(callback => callback(data));
          }
        } catch (error) {
          console.error('Error processing WebSocket message:', error);
        }
      };
      
      ws.onclose = () => {
        setStatus(ConnectionStatus.DISCONNECTED);
      };
      
      ws.onerror = () => {
        setStatus(ConnectionStatus.ERROR);
      };
      
      setSocket(ws);
    } catch (error) {
      console.error('Failed to connect to WebSocket:', error);
      setStatus(ConnectionStatus.ERROR);
    }
  };

  const disconnect = () => {
    if (socket) {
      socket.close();
      setSocket(null);
      setStatus(ConnectionStatus.DISCONNECTED);
    }
  };

  const subscribe = (channel: string, callback: (data: any) => void) => {
    setSubscribers(prev => {
      const newSubscribers = new Map(prev);
      
      if (!newSubscribers.has(channel)) {
        newSubscribers.set(channel, new Set());
      }
      
      newSubscribers.get(channel)?.add(callback);
      
      // If already connected, send subscription message
      if (socket?.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'subscribe', channel }));
      }
      
      return newSubscribers;
    });
    
    // Return unsubscribe function
    return () => {
      setSubscribers(prev => {
        const newSubscribers = new Map(prev);
        const callbacks = newSubscribers.get(channel);
        
        if (callbacks) {
          callbacks.delete(callback);
          
          if (callbacks.size === 0) {
            newSubscribers.delete(channel);
            // If connected, send unsubscribe message
            if (socket?.readyState === WebSocket.OPEN) {
              socket.send(JSON.stringify({ type: 'unsubscribe', channel }));
            }
          }
        }
        
        return newSubscribers;
      });
    };
  };
  
  // Clean up on unmount
  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const value = {
    status,
    connect,
    disconnect,
    subscribe,
  };

  return (
    <WebSocketContext.Provider value={value}>
      {children}
    </WebSocketContext.Provider>
  );
};

export default WebSocketProvider;

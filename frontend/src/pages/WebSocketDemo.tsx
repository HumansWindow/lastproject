import React, { useEffect, useState } from 'react';
import { realtimeService, ConnectionStatus } from '../services/realtime';
import WebSocketStatus from '../components/WebSocketStatus';

interface ConnectionStatusData {
  status: ConnectionStatus;
  isConnected: boolean;
}

const WebSocketDemo: React.FC = () => {
  const [messages, setMessages] = useState<string[]>([]);
  const [status, setStatus] = useState<ConnectionStatus>(ConnectionStatus.DISCONNECTED);
  const [address, setAddress] = useState<string>('');
  
  useEffect(() => {
    // Subscribe to connection status changes
    const unsubscribe = realtimeService?.subscribe('connectionStatus', (data: ConnectionStatusData) => {
      setStatus(data.status);
      addMessage(`Connection status changed: ${data.status}`);
    });
    
    return () => {
      if (unsubscribe) unsubscribe();
    };
  }, []);
  
  const addMessage = (msg: string) => {
    setMessages(prev => [
      `[${new Date().toLocaleTimeString()}] ${msg}`, 
      ...prev.slice(0, 49)
    ]);
  };

  const handleConnect = () => {
    // Connect without token parameter
    realtimeService?.connect();
    addMessage('Attempting to connect...');
  };

  const handleDisconnect = () => {
    realtimeService?.disconnect();
    addMessage('Disconnected from WebSocket server');
  };

  const handleSubscribe = () => {
    if (!address) {
      addMessage('Please enter a wallet address to subscribe to');
      return;
    }
    
    const channel = `balance:${address}`;
    const unsubscribe = realtimeService?.subscribe(channel, (data: any) => {
      addMessage(`Received balance update for ${address}: ${JSON.stringify(data)}`);
    });
    
    addMessage(`Subscribed to ${channel}`);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">WebSocket Demo</h1>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl mb-2">Connection Status</h2>
        <WebSocketStatus showDetails={true} />
        
        <div className="flex space-x-2 mt-4">
          <button 
            onClick={handleConnect}
            className="px-4 py-2 bg-green-500 text-white rounded"
            disabled={status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING}
          >
            Connect
          </button>
          <button
            onClick={handleDisconnect}
            className="px-4 py-2 bg-red-500 text-white rounded"
            disabled={status === ConnectionStatus.DISCONNECTED}
          >
            Disconnect
          </button>
        </div>
      </div>
      
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-xl mb-2">Subscribe to Balance Updates</h2>
        <div className="flex space-x-2">
          <input
            type="text"
            placeholder="Enter wallet address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            className="flex-1 px-4 py-2 border rounded"
          />
          <button
            onClick={handleSubscribe}
            className="px-4 py-2 bg-blue-500 text-white rounded"
            disabled={!address || status !== ConnectionStatus.CONNECTED}
          >
            Subscribe
          </button>
        </div>
      </div>
      
      <div className="p-4 border rounded">
        <h2 className="text-xl mb-2">Event Log</h2>
        <div className="h-80 overflow-y-auto bg-gray-100 p-2 rounded">
          {messages.length === 0 ? (
            <p className="text-gray-500">No events yet. Try connecting to WebSocket.</p>
          ) : (
            <ul className="space-y-1">
              {messages.map((msg, index) => (
                <li key={index} className="font-mono text-sm">{msg}</li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default WebSocketDemo;
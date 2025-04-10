import React, { useEffect, useState } from 'react';
import { Button, Container, Typography, Box } from '@mui/material';
import dynamic from 'next/dynamic';
import { WebSocketStatusProps } from './WebSocketStatus';

// Fix dynamic import syntax
const WebSocketStatus = dynamic<WebSocketStatusProps>(
  () => import('./WebSocketStatus').then(mod => mod.default) as any,
  { ssr: false }
);

const WebSocketDemoContent: React.FC = () => {
  const [connected, setConnected] = useState<boolean>(false);
  const [messages, setMessages] = useState<string[]>([]);
  const [socket, setSocket] = useState<WebSocket | null>(null);

  useEffect(() => {
    return () => {
      if (socket) {
        socket.close();
      }
    };
  }, [socket]);

  const connectWebSocket = () => {
    const ws = new WebSocket('ws://localhost:8080/ws');
    
    ws.onopen = () => {
      setConnected(true);
      setMessages(prev => [...prev, 'Connected to WebSocket server']);
    };

    ws.onmessage = (event) => {
      setMessages(prev => [...prev, `Received: ${event.data}`]);
    };

    ws.onclose = () => {
      setConnected(false);
      setMessages(prev => [...prev, 'Disconnected from WebSocket server']);
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setMessages(prev => [...prev, 'WebSocket error occurred']);
    };

    setSocket(ws);
  };

  const disconnectWebSocket = () => {
    if (socket) {
      socket.close();
      setSocket(null);
    }
  };

  const sendMessage = () => {
    if (socket && socket.readyState === WebSocket.OPEN) {
      const message = `Hello server! Time: ${new Date().toISOString()}`;
      socket.send(message);
      setMessages(prev => [...prev, `Sent: ${message}`]);
    }
  };

  return (
    <Container>
      <Typography variant="h4" component="h1" gutterBottom>
        WebSocket Demo
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <WebSocketStatus connected={connected} />
      </Box>

      <Box sx={{ mb: 2 }}>
        <Button 
          variant="contained" 
          color="primary" 
          onClick={connectWebSocket} 
          disabled={connected}
          sx={{ mr: 1 }}
        >
          Connect
        </Button>
        <Button 
          variant="contained" 
          color="secondary" 
          onClick={disconnectWebSocket} 
          disabled={!connected}
          sx={{ mr: 1 }}
        >
          Disconnect
        </Button>
        <Button 
          variant="contained" 
          onClick={sendMessage} 
          disabled={!connected}
        >
          Send Message
        </Button>
      </Box>

      <Typography variant="h6">Messages:</Typography>
      <Box sx={{ 
        mt: 2, 
        p: 2, 
        border: '1px solid #ccc', 
        borderRadius: 1,
        height: '300px',
        overflowY: 'auto',
        bgcolor: '#f5f5f5'
      }}>
        {messages.map((message, index) => (
          <Typography key={index} sx={{ mb: 1 }}>
            {message}
          </Typography>
        ))}
      </Box>
    </Container>
  );
};

export default WebSocketDemoContent;

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Button, Form } from 'react-bootstrap';
import WebSocketStatus from '../components/WebSocketStatus';
import WebSocketIndicator from '../components/WebSocketIndicator';
import RealTimeBalance from '../components/RealTimeBalance';
import NotificationBell from '../components/NotificationBell';
import { realtimeService } from '../services/realtime/websocket/realtime-service';
import { ConnectionStatus } from '../services/realtime/websocket/websocket-manager';
import { notificationService } from '../services/notifications/notification-service';

/**
 * Demo page for WebSocket functionality
 */
const WebSocketDemo: React.FC = () => {
  const [walletAddress, setWalletAddress] = useState<string>('');
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(
    realtimeService.getConnectionStatus()
  );
  const [testNotification, setTestNotification] = useState({
    title: 'Test Notification',
    message: 'This is a test notification message',
    category: 'info' as 'info' | 'success' | 'warning' | 'error'
  });
  
  useEffect(() => {
    // Initialize wallet address from localStorage if available
    const savedAddress = localStorage.getItem('demoWalletAddress');
    if (savedAddress) {
      setWalletAddress(savedAddress);
    }
    
    // Track connection status
    const unsubscribe = realtimeService.onConnectionStatusChange((status) => {
      setConnectionStatus(status);
    });
    
    return () => {
      unsubscribe();
    };
  }, []);
  
  // Save wallet address to localStorage
  const handleWalletChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const address = e.target.value;
    setWalletAddress(address);
    localStorage.setItem('demoWalletAddress', address);
  };
  
  // Handle manual connection/disconnection
  const toggleConnection = () => {
    if (realtimeService.isConnected()) {
      realtimeService.disconnect();
    } else {
      const token = localStorage.getItem('accessToken');
      if (token) {
        realtimeService.connect(token)
          .catch(error => console.error('Connection error:', error));
      } else {
        alert('No access token available. Please log in first.');
      }
    }
  };
  
  // Create a test notification
  const createTestNotification = () => {
    const notification = {
      id: `test-${Date.now()}`,
      title: testNotification.title,
      message: testNotification.message,
      timestamp: Date.now(),
      category: testNotification.category,
      link: '',
      read: false,
      userId: '',
      seen: false
    };
    
    // Use the correct method that we've added to the notification service
    notificationService.handleNewNotification(notification);
  };

  return (
    <Container className="py-5">
      <h1 className="mb-4">WebSocket Demo</h1>
      <p className="mb-4">
        This page demonstrates WebSocket integration with various components.
      </p>
      
      <Row className="mb-5">
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">WebSocket Connection</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <strong>Connection Status:</strong>{' '}
                  <span className={connectionStatus === ConnectionStatus.CONNECTED ? 'text-success' : 'text-danger'}>
                    {connectionStatus}
                  </span>
                </div>
                <WebSocketStatus showDetails showDiagnosticInfo showConnectionDuration />
              </div>
              
              <div className="d-flex align-items-center mb-4">
                <strong className="me-2">Status Indicator:</strong>
                <WebSocketIndicator />
              </div>
              
              <Button 
                variant={realtimeService.isConnected() ? 'danger' : 'success'}
                onClick={toggleConnection}
              >
                {realtimeService.isConnected() ? 'Disconnect' : 'Connect'}
              </Button>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Real-time Balance</h5>
            </Card.Header>
            <Card.Body>
              <Form.Group className="mb-3">
                <Form.Label>Wallet Address</Form.Label>
                <Form.Control
                  type="text"
                  placeholder="Enter wallet address"
                  value={walletAddress}
                  onChange={handleWalletChange}
                />
                <Form.Text className="text-muted">
                  Enter a wallet address to monitor its balance.
                </Form.Text>
              </Form.Group>
              
              {walletAddress && (
                <div className="mt-4">
                  <RealTimeBalance walletAddress={walletAddress} showDetailedStatus />
                </div>
              )}
            </Card.Body>
          </Card>
        </Col>
      </Row>
      
      <Row>
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">Notifications</h5>
            </Card.Header>
            <Card.Body>
              <div className="d-flex align-items-center mb-4">
                <strong className="me-2">Notification Bell:</strong>
                <NotificationBell />
              </div>
              
              <div className="mb-3">
                <h6>Create Test Notification</h6>
                
                <Form.Group className="mb-3">
                  <Form.Label>Title</Form.Label>
                  <Form.Control
                    type="text"
                    value={testNotification.title}
                    onChange={(e) => setTestNotification({
                      ...testNotification,
                      title: e.target.value
                    })}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Message</Form.Label>
                  <Form.Control
                    as="textarea"
                    rows={2}
                    value={testNotification.message}
                    onChange={(e) => setTestNotification({
                      ...testNotification,
                      message: e.target.value
                    })}
                  />
                </Form.Group>
                
                <Form.Group className="mb-3">
                  <Form.Label>Category</Form.Label>
                  <Form.Select
                    value={testNotification.category}
                    onChange={(e) => setTestNotification({
                      ...testNotification,
                      category: e.target.value as any
                    })}
                  >
                    <option value="info">Info</option>
                    <option value="success">Success</option>
                    <option value="warning">Warning</option>
                    <option value="error">Error</option>
                  </Form.Select>
                </Form.Group>
                
                <Button variant="primary" onClick={createTestNotification}>
                  Create Test Notification
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Col>
        
        <Col md={6}>
          <Card>
            <Card.Header>
              <h5 className="mb-0">WebSocket Information</h5>
            </Card.Header>
            <Card.Body>
              <h6>Implementation Details</h6>
              <ul className="mb-4">
                <li>Uses Socket.IO for WebSocket communication</li>
                <li>Authenticates connections with JWT tokens</li>
                <li>Automatically reconnects when disconnected</li>
                <li>Supports channel-based subscriptions</li>
                <li>Includes connection health monitoring</li>
                <li>Handles token refreshes automatically</li>
              </ul>
              
              <h6>Subscriptions Currently Available</h6>
              <ul>
                <li><code>balance:[wallet-address]</code> - Real-time balance updates</li>
                <li><code>nft:[wallet-address]</code> - NFT transfers</li>
                <li><code>staking:[position-id]</code> - Staking rewards updates</li>
                <li><code>token:price</code> - Token price updates</li>
                <li><code>notifications</code> - System notifications</li>
              </ul>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
};

export default WebSocketDemo;
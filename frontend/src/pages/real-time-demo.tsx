import React, { useState, useEffect } from 'react';
import { realtimeService } from "../services/realtime/index";
import { ConnectionStatus, WebSocketError } from "../types/realtimeTypes";
import WebSocketStatus from "../components/WebSocketStatus";
import NotificationsPanel from "../components/NotificationsPanel";
import WalletBalanceMonitor from "../components/WalletBalanceMonitor";
import NFTTransferMonitor from "../components/NFTTransferMonitor";
import { Alert, Badge, Form } from 'react-bootstrap';

const RealTimeDemo: React.FC = () => {
  // Connection state
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

  const [connected, setConnected] = useState<boolean>(realtimeService?.isConnected() || false);
  const [status, setStatus] = useState<ConnectionStatus>(
    mapServiceStatusToAppStatus(realtimeService?.getConnectionStatus())
  );
  const [reconnectAttempts, setReconnectAttempts] = useState<number>(0);
  const [lastError, setLastError] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  
  // Test parameters
  const [walletAddress, setWalletAddress] = useState<string>('0x71C7656EC7ab88b098defB751B7401B5f6d8976F');
  const [customToken, setCustomToken] = useState<string>('demo_token_12345');
  
  // Subscription testing
  const [activeSubscriptions, setActiveSubscriptions] = useState<string[]>([]);
  const [channelToSubscribe, setChannelToSubscribe] = useState<string>('token:price');
  const [lastMessage, setLastMessage] = useState<any>(null);
  const [messagesReceived, setMessagesReceived] = useState<number>(0);
  
  // Message sending
  const [messageType, setMessageType] = useState<string>('message');
  const [messageContent, setMessageContent] = useState<string>('');
  const [channel, setChannel] = useState<string>('default');

  // Reconnection settings
  const [autoReconnect, setAutoReconnect] = useState<boolean>(true);
  const [maxReconnectAttempts, setMaxReconnectAttempts] = useState<number>(5);
  
  // Status display settings
  const [showErrorDetails, setShowErrorDetails] = useState<boolean>(true);
  const [showReconnectAttempts, setShowReconnectAttempts] = useState<boolean>(true);
  const [showConnectionDuration, setShowConnectionDuration] = useState<boolean>(true);
  const [showDiagnosticInfo, setShowDiagnosticInfo] = useState<boolean>(false);
  
  // Listen for WebSocket connection status changes
  useEffect(() => {
    if (!realtimeService) return;
    
    // Define handleStatusChange function
    const handleStatusChange = (status: ConnectionStatus) => {
      setStatus(status);
      setConnected(status === ConnectionStatus.CONNECTED);
    };

    // Define custom handler methods since they don't exist on the service
    const statusSubscription = realtimeService.onStatusChange?.(
      (newStatus: any) => handleStatusChange(mapServiceStatusToAppStatus(newStatus))
    ) || (() => {});
    
    // Fix error handling with safer property checks
    const errorSubscription = typeof realtimeService.onError === 'function' ? 
      realtimeService.onError((error: WebSocketError | Error) => {
        setLastError(error.message);
      }) : 
      (() => {});

    const messageSubscription = realtimeService.onMessageReceived?.((message: any) => {
      setMessagesReceived(prev => prev + 1);
      setLastMessage({
        data: message,
        timestamp: Date.now()
      });
    }) || (() => { /* No-op fallback */ });
    
    // Initial setup
    updateSubscriptionsList();
    
    // Fix auto-reconnect with safer property checks
    if (typeof realtimeService.setAutoReconnect === 'function') {
      realtimeService.setAutoReconnect(autoReconnect, maxReconnectAttempts);
    }
    
    return () => {
      if (statusSubscription) statusSubscription();
      if (errorSubscription) errorSubscription();
      if (messageSubscription) messageSubscription();
    };
  }, [autoReconnect, maxReconnectAttempts]);

  // Function to connect to WebSocket server
  const handleConnect = async () => {
    if (!realtimeService) return;
    
    try {
      setLastError(null);
      // Note: Assuming connect method doesn't take arguments in the actual implementation
      await realtimeService.connect?.();
      // If token is needed, use a separate method or property
      realtimeService.setToken?.(customToken);
    } catch (error) {
      console.error('Failed to connect:', error);
      setLastError(error instanceof Error ? error.message : String(error));
    }
  };
  
  // Function to disconnect from WebSocket server
  const handleDisconnect = () => {
    realtimeService?.disconnect?.();
  };
  
  // Function to force a reconnection attempt
  const handleForceReconnect = () => {
    if (!realtimeService) return;
    
    setReconnectAttempts(0);
    realtimeService.connect?.();
    realtimeService.setToken?.(customToken);
  };

  // Function to subscribe to a channel
  const handleSubscribe = () => {
    if (!realtimeService || !channelToSubscribe.trim()) return;
    
    const unsubscribe = realtimeService.subscribe?.(channelToSubscribe, (data: any) => {
      console.log(`Message from ${channelToSubscribe}:`, data);
      // The global message handler will catch this already
    });
    
    // Store unsubscribe function if needed
    updateSubscriptionsList();
  };
  
  // Function to unsubscribe from a channel
  const handleUnsubscribe = (channel: string) => {
    realtimeService?.unsubscribeFrom?.(channel);
    updateSubscriptionsList();
  };
  
  // Update the list of active subscriptions
  const updateSubscriptionsList = () => {
    const subscriptions = realtimeService?.getSubscriptions?.() || [];
    setActiveSubscriptions(subscriptions);
  };
  
  // Test ping functionality
  const handlePing = () => {
    if (!realtimeService?.sendPing) {
      setLastError("Ping functionality not available");
      return;
    }
    
    try {
      // Call sendPing directly without expecting a Promise
      realtimeService.sendPing();
      
      // Add some UI feedback
      setLastResponse("Ping sent successfully");
    } catch (error) {
      if (error instanceof Error) {
        setLastError(`Ping failed: ${error.message}`);
      } else {
        setLastError(`Ping failed: Unknown error`);
      }
    }
  };

  // Create a wrapper for sending messages safely
  const safeSend = (message: any): Promise<any> => {
    return new Promise((resolve, reject) => {
      try {
        if (realtimeService && typeof (realtimeService as any).send === 'function') {
          const result = (realtimeService as any).send(message);
          
          // If result is a Promise, return it
          if (result instanceof Promise) {
            resolve(result);
          } else {
            // If not a Promise, resolve with a default success value
            resolve({ success: true, message: 'Message sent' });
          }
        } else {
          reject(new Error('WebSocket service not available'));
        }
      } catch (error) {
        reject(error);
      }
    });
  };

  // Use the safeSend wrapper in handleSendClick
  const handleSendClick = () => {
    // Make sure we have all the required variables
    const messageTypeToSend = messageType || 'message';
    const channelToSend = channel || 'default';
    const contentToSend = messageContent || '';
    
    const message = {
      type: messageTypeToSend,
      channel: channelToSend,
      content: contentToSend,
      timestamp: Date.now()
    };

    safeSend(message)
      .then(response => {
        if (typeof setLastResponse === 'function') {
          setLastResponse(JSON.stringify(response));
        }
      })
      .catch(error => {
        if (typeof setLastError === 'function') {
          setLastError(String(error));
        }
      });
  };

  // Reset error display
  const clearError = () => {
    setLastError(null);
  };
  
  const resetMessageCounter = () => {
    setMessagesReceived(0);
    setLastMessage(null);
  };
  
  // Fix the comparison for status badge color
  const getStatusBadgeColor = (status: ConnectionStatus) => {
    switch (status) {
      case ConnectionStatus.CONNECTED:
        return "success";
      case ConnectionStatus.CONNECTING:
        return "info";
      case ConnectionStatus.DISCONNECTED:
        return "secondary";
      case ConnectionStatus.ERROR:
        return "danger";
      default:
        return "warning";
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6 mb-8">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
          WebSocket Real-time Demo
          <Badge 
            bg={getStatusBadgeColor(status)} 
            className="ml-2"
          >
            {status}
          </Badge>
        </h1>
        
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          This demo showcases the WebSocket functionality for real-time updates in the application.
          Connect to see live notifications, balance changes, and NFT transfers.
        </p>
        
        {lastError && (
          <Alert variant="danger" dismissible onClose={clearError} className="mb-4">
            <Alert.Heading>Connection Error</Alert.Heading>
            <p>{lastError}</p>
          </Alert>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div className="p-4 border rounded">
            <h3 className="text-lg font-medium mb-3">Connection Controls</h3>
            
            <div className="flex flex-col sm:flex-row items-start gap-4 mb-4">
              <div className="flex items-center space-x-2">
                <span className="text-gray-700 dark:text-gray-200">Status:</span>
                <WebSocketStatus 
                  connected={connected}
                  showDetails={true}
                  data-show-error-details={showErrorDetails}
                  data-show-reconnect-attempts={showReconnectAttempts}
                  data-show-connection-duration={showConnectionDuration}
                  data-show-diagnostic-info={showDiagnosticInfo}
                />
              </div>
              
              <div className="flex space-x-2">
                <button
                  onClick={handleConnect}
                  disabled={status === ConnectionStatus.CONNECTED || status === ConnectionStatus.CONNECTING}
                  className="px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Connect
                </button>
                
                <button
                  onClick={handleDisconnect}
                  disabled={status === ConnectionStatus.DISCONNECTED}
                  className="px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Disconnect
                </button>
                
                <button
                  onClick={handleForceReconnect}
                  disabled={status === ConnectionStatus.CONNECTING}
                  className="px-3 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Force Reconnect
                </button>
              </div>
            </div>
            
            <div className="mb-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Authentication Token:
              </label>
              <input
                type="text"
                value={customToken}
                onChange={(e) => setCustomToken(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="JWT token"
              />
              <p className="text-xs text-gray-500 mt-1">
                Normally this would be obtained automatically after login
              </p>
            </div>
            
            <div className="flex items-center space-x-3 mb-3">
              <div className="flex items-center">
                <input
                  id="auto-reconnect"
                  type="checkbox"
                  checked={autoReconnect}
                  onChange={(e) => setAutoReconnect(e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label htmlFor="auto-reconnect" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                  Auto Reconnect
                </label>
              </div>
              
              <div className="flex items-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 mr-2">
                  Max Attempts:
                </span>
                <select
                  value={maxReconnectAttempts}
                  onChange={(e) => setMaxReconnectAttempts(Number(e.target.value))}
                  className="py-1 px-2 border border-gray-300 rounded text-sm dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  disabled={!autoReconnect}
                >
                  {[3, 5, 10, 15, 20].map(num => (
                    <option key={num} value={num}>{num}</option>
                  ))}
                </select>
              </div>
            </div>
            
            {reconnectAttempts > 0 && (
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Reconnection attempts: {reconnectAttempts}
              </div>
            )}
            
            <div className="mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
              <h4 className="text-md font-medium mb-2">Status Display Settings</h4>
              <div className="flex flex-wrap gap-4">
                <Form.Check 
                  type="switch"
                  id="show-error-details"
                  label="Show error details"
                  checked={showErrorDetails}
                  onChange={(e) => setShowErrorDetails(e.target.checked)}
                />
                
                <Form.Check 
                  type="switch"
                  id="show-reconnect-attempts"
                  label="Show reconnect attempts"
                  checked={showReconnectAttempts}
                  onChange={(e) => setShowReconnectAttempts(e.target.checked)}
                />
                
                <Form.Check 
                  type="switch"
                  id="show-connection-duration"
                  label="Show connection duration"
                  checked={showConnectionDuration}
                  onChange={(e) => setShowConnectionDuration(e.target.checked)}
                />
                
                <Form.Check 
                  type="switch"
                  id="show-diagnostic-info"
                  label="Show diagnostic info"
                  checked={showDiagnosticInfo}
                  onChange={(e) => setShowDiagnosticInfo(e.target.checked)}
                />
              </div>
            </div>
          </div>
          
          <div className="p-4 border rounded">
            <h3 className="text-lg font-medium mb-3">Subscription Testing</h3>
            
            <div className="flex space-x-2 mb-4">
              <input
                type="text"
                value={channelToSubscribe}
                onChange={(e) => setChannelToSubscribe(e.target.value)}
                className="flex-1 min-w-0 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                placeholder="Channel name (e.g., token:price)"
              />
              <button
                onClick={handleSubscribe}
                disabled={!connected}
                className="px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed whitespace-nowrap"
              >
                Subscribe
              </button>
            </div>
            
            <div className="mb-3">
              <h4 className="text-sm font-medium mb-2">Active Subscriptions:</h4>
              {activeSubscriptions.length === 0 ? (
                <p className="text-sm text-gray-500">No active subscriptions</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {activeSubscriptions.map(channel => (
                    <div key={channel} className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded flex items-center text-sm">
                      <span>{channel}</span>
                      <button
                        onClick={() => handleUnsubscribe(channel)}
                        className="ml-2 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300"
                        title="Unsubscribe"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            <div className="flex space-x-2">
              <button
                onClick={handlePing}
                disabled={!connected}
                className="px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
              >
                Send Ping
              </button>
              
              <div className="flex items-center space-x-1">
                <span className="text-sm text-gray-700 dark:text-gray-300">Messages:</span>
                <Badge bg="info">{messagesReceived}</Badge>
                <button
                  onClick={resetMessageCounter}
                  className="text-xs text-red-600 hover:text-red-800"
                  title="Reset counter"
                >
                  ✕
                </button>
              </div>
            </div>
            
            <div className="mt-4">
              <h4 className="text-sm font-medium mb-2">Message Sending:</h4>
              <div className="space-y-2 mb-3">
                <input
                  type="text"
                  value={channel}
                  onChange={(e) => setChannel(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Channel"
                />
                <input
                  type="text"
                  value={messageType}
                  onChange={(e) => setMessageType(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Message type"
                />
                <textarea
                  value={messageContent}
                  onChange={(e) => setMessageContent(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
                  placeholder="Message content"
                  rows={3}
                ></textarea>
                <button
                  onClick={handleSendClick}
                  disabled={!connected}
                  className="w-full px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-gray-400 disabled:cursor-not-allowed"
                >
                  Send Message
                </button>
              </div>
            </div>
            
            {lastResponse && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between mb-1">
                  <h4 className="text-sm font-medium">Last Response:</h4>
                  <button onClick={() => setLastResponse(null)} className="text-xs text-gray-500">Clear</button>
                </div>
                <div className="overflow-auto max-h-32">
                  <pre className="text-xs">
                    {lastResponse}
                  </pre>
                </div>
              </div>
            )}
            
            {lastMessage && (
              <div className="mt-4 p-3 bg-gray-100 dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <div className="flex justify-between mb-1">
                  <h4 className="text-sm font-medium">Last Message Received:</h4>
                  <button onClick={() => setLastMessage(null)} className="text-xs text-gray-500">Clear</button>
                </div>
                <div className="overflow-auto max-h-32">
                  <pre className="text-xs">
                    {JSON.stringify(lastMessage, null, 2)}
                  </pre>
                </div>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
            Wallet Address for Monitoring:
          </label>
          <input
            type="text"
            value={walletAddress}
            onChange={(e) => setWalletAddress(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white"
            placeholder="0x1234..."
          />
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Notifications</h2>
            <div className="ml-auto">
              <WebSocketStatus connected={connected} />
            </div>
          </div>
          <NotificationsPanel maxNotifications={5} />
        </div>
        
        <div className="bg-white dark:bg-gray-800 shadow rounded-lg p-6">
          <div className="mb-4 flex justify-between items-center">
            <h2 className="text-xl font-semibold text-gray-800 dark:text-white">Wallet Balance Monitor</h2>
            <div className="ml-auto">
              <WebSocketStatus 
                connected={connected}
                showDetails={showConnectionDuration}
              />
            </div>
          </div>
          <WalletBalanceMonitor 
            walletAddress={walletAddress} 
            networkName="Ethereum" 
          />
        </div>
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <div className="mb-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800 dark:text-white">NFT Transfers</h2>
          <div className="ml-auto">
            <WebSocketStatus 
              connected={connected}
              showDetails={true}
              data-show-connection-duration={showConnectionDuration}
            />
          </div>
        </div>
        <NFTTransferMonitor walletAddress={walletAddress} />
      </div>
      
      <div className="mt-8 bg-white dark:bg-gray-800 shadow rounded-lg p-6">
        <h2 className="text-xl font-semibold text-gray-800 dark:text-white mb-4">
          Testing Instructions
        </h2>
        
        <div className="prose dark:prose-invert max-w-none">
          <p>
            To test the WebSocket functionality, follow these steps:
          </p>
          
          <ol className="list-decimal pl-5 space-y-2">
            <li>Enter a valid JWT token (or use the default demo token)</li>
            <li>Click <strong>Connect</strong> to establish a WebSocket connection</li>
            <li>Subscribe to channels you want to monitor (e.g., <code>token:price</code>, <code>balance:0x1234...</code>)</li>
            <li>Enter a wallet address to monitor for balance and NFT changes</li>
            <li>Use the <strong>Send Ping</strong> button to test the connection</li>
            <li>Test connection resilience by clicking <strong>Force Reconnect</strong></li>
            <li>Check the message log to see incoming WebSocket events</li>
            <li>Try different WebSocketStatus display options to monitor connection health</li>
          </ol>
          
          <h3 className="text-lg font-semibold mt-4 mb-2">Common Channel Formats</h3>
          <ul className="list-disc pl-5 space-y-1">
            <li><code>notifications</code> - System notifications</li>
            <li><code>token:price</code> - Token price updates</li>
            <li><code>balance:{walletAddress}</code> - Balance changes for a specific address</li>
            <li><code>nft:{walletAddress}</code> - NFT transfers for a specific address</li>
            <li><code>staking:your-position-id</code> - Staking position updates</li>
          </ul>
          
          <div className="mt-4 p-4 bg-yellow-100 dark:bg-yellow-900/30 rounded">
            <h4 className="font-semibold">Note:</h4>
            <p className="mt-1">
              In a production environment, the WebSocket server authenticates your token, validates your 
              permissions to monitor the specified address, and streams events from the blockchain in real-time.
              Make sure to use a valid authentication token when testing with the actual backend.
            </p>
          </div>
          
          <div className="mt-4 p-4 bg-blue-100 dark:bg-blue-900/30 rounded">
            <h4 className="font-semibold">WebSocketStatus Component:</h4>
            <p className="mt-1">
              The WebSocketStatus component has been enhanced with the following features:
            </p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Connection duration tracking</li>
              <li>Latency monitoring with ping/pong</li>
              <li>Detailed error information</li>
              <li>Reconnection attempt tracking</li>
              <li>Message count statistics</li>
              <li>Multiple display modes (basic, enhanced, diagnostic)</li>
            </ul>
            <p className="mt-2">
              Try adjusting the display settings in the Connection Controls section to see different views of the WebSocket status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default RealTimeDemo;

// This function ensures this page is rendered on-demand instead of at build time
export async function getServerSideProps() {
  return {
    props: {}, // Will be passed to the page component as props
  };
}
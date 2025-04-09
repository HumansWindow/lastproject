/**
 * WebSocket configuration
 * Centralizes WebSocket settings for easier management
 */

// Define WebSocket connection settings
export interface WebSocketConfig {
  url: string;
  reconnectAttempts: number;
  reconnectInterval: number;
  maxReconnectInterval: number;
  reconnectDecay: number;
  connectionTimeout: number;
}

// Environments
const environments: Record<string, WebSocketConfig> = {
  development: {
    url: "ws://localhost:3001/ws",  // Updated from wss://api.example.com/ws
    reconnectAttempts: 10,
    reconnectInterval: 1000,
    maxReconnectInterval: 30000,
    reconnectDecay: 1.5,
    connectionTimeout: 5000
  },
  test: {
    url: "ws://localhost:3001/ws", 
    reconnectAttempts: 3,
    reconnectInterval: 500,
    maxReconnectInterval: 5000,
    reconnectDecay: 1.5,
    connectionTimeout: 3000
  },
  production: {
    url: "wss://api.alivehuman.org/ws",
    reconnectAttempts: Infinity,
    reconnectInterval: 2000,
    maxReconnectInterval: 60000,
    reconnectDecay: 1.5,
    connectionTimeout: 10000
  }
};

// Detect environment
const getEnvironment = (): string => {
  // Use Next.js environment variables if available
  if (typeof process !== 'undefined' && process.env && process.env.NODE_ENV) {
    return process.env.NODE_ENV;
  }
  
  // Fallback to development
  return 'development';
};

// Get config for current environment
export const getWebSocketConfig = (): WebSocketConfig => {
  const env = getEnvironment();
  return environments[env] || environments.development;
};

// Export default config
export default getWebSocketConfig();

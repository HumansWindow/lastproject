/**
 * API Configuration
 * This file contains all API-related configuration to ensure proper synchronization
 * between frontend and backend services.
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Base URLs based on environment - UPDATED PORT to 3001
export const API_URL = isProduction 
  ? process.env.NEXT_PUBLIC_API_URL || 'https://api.alivehuman.com'
  : process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const WEBSOCKET_URL = isProduction
  ? process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'wss://api.alivehuman.com'
  : process.env.NEXT_PUBLIC_WEBSOCKET_URL || 'ws://localhost:3001';

// Endpoints configuration
export const endpoints = {
  // Auth endpoints
  auth: {
    login: `${API_URL}/auth/login`,
    register: `${API_URL}/auth/register`,
    refreshToken: `${API_URL}/auth/refresh-token`,
    forgotPassword: `${API_URL}/auth/forgot-password`,
    resetPassword: `${API_URL}/auth/reset-password`,
    verifyEmail: `${API_URL}/auth/verify-email`,
    logout: `${API_URL}/auth/logout`,
  },
  
  // Wallet auth endpoints
  walletAuth: {
    connect: `${API_URL}/auth/wallet/connect`,
    authenticate: `${API_URL}/auth/wallet/authenticate`,
    nonce: `${API_URL}/auth/wallet/nonce`,
  },
  
  // User endpoints
  users: {
    profile: `${API_URL}/users/profile`,
    devices: `${API_URL}/users/devices`,
    sessions: `${API_URL}/users/sessions`,
    updateProfile: `${API_URL}/users/profile/update`,
    settings: `${API_URL}/users/settings`,
  },
  
  // Wallet endpoints
  wallets: {
    balance: `${API_URL}/wallets/balance`,
    transactions: `${API_URL}/wallets/transactions`,
    connect: `${API_URL}/wallets/connect`,
    disconnect: `${API_URL}/wallets/disconnect`,
  },
  
  // Blockchain endpoints
  blockchain: {
    mintToken: `${API_URL}/blockchain/mint`,
    stakingPositions: `${API_URL}/blockchain/staking/positions`,
    createStake: `${API_URL}/blockchain/staking/create`,
    withdrawStake: `${API_URL}/blockchain/staking/withdraw`,
    stakingRewards: `${API_URL}/blockchain/staking/rewards`,
  },
  
  // NFT endpoints
  nft: {
    list: `${API_URL}/nft`,
    metadata: (id: string) => `${API_URL}/nft/${id}/metadata`,
    transfer: `${API_URL}/nft/transfer`,
    mint: `${API_URL}/nft/mint`,
    marketplace: `${API_URL}/nft/marketplace`,
    userCollection: `${API_URL}/nft/collection`,
  },
  
  // Token endpoints
  token: {
    balance: `${API_URL}/token/balance`,
    transactions: `${API_URL}/token/transactions`,
    priceHistory: `${API_URL}/token/price-history`,
    transfer: `${API_URL}/token/transfer`,
  },
  
  // Diary endpoints
  diary: {
    entries: `${API_URL}/diary`,
    entry: (id: string) => `${API_URL}/diary/${id}`,
    locations: `${API_URL}/diary/locations/list`,
    create: `${API_URL}/diary/create`,
    update: (id: string) => `${API_URL}/diary/${id}/update`,
    delete: (id: string) => `${API_URL}/diary/${id}/delete`,
    stats: `${API_URL}/diary/stats`,
  },
  
  // Referral endpoints
  referral: {
    generate: `${API_URL}/referral/generate`,
    validate: `${API_URL}/referral/validate`,
    stats: `${API_URL}/referral/stats`,
    history: `${API_URL}/referral/history`,
    rewards: `${API_URL}/referral/rewards`,
  },
  
  // Health check
  health: {
    status: `${API_URL}/health`,
    version: `${API_URL}/health/version`,
  }
};

// WebSocket configuration
export const websocket = {
  url: WEBSOCKET_URL,
  events: {
    // Authentication events
    auth: {
      success: 'auth_success',
      error: 'auth_error',
      disconnect: 'auth_disconnect',
    },
    // Subscription events
    subscription: {
      subscribe: 'subscribe',
      unsubscribe: 'unsubscribe',
      acknowledgment: 'subscription_ack',
    },
    // Balance events
    balance: (address: string) => `balance:${address}`,
    // NFT events
    nft: {
      transfer: (address: string) => `nft:transfer:${address}`,
      mint: (address: string) => `nft:mint:${address}`,
      marketplace: 'nft:marketplace',
    },
    // Token events
    token: {
      price: 'token:price',
      priceUpdate: 'token:price:update',
      transfer: (address: string) => `token:transfer:${address}`,
    },
    // Staking events
    staking: (positionId: string) => `staking:${positionId}`,
    stakingUpdates: (address: string) => `staking:updates:${address}`,
    // System notifications
    notification: 'notification',
    userNotification: (userId: string) => `notification:user:${userId}`,
    // Real-time diary updates
    diary: {
      new: 'diary:new',
      update: 'diary:update',
      delete: 'diary:delete',
    }
  },
  // Connection statuses
  connectionStatus: {
    CONNECTED: 'CONNECTED',
    CONNECTING: 'CONNECTING',
    DISCONNECTED: 'DISCONNECTED',
    ERROR: 'ERROR',
    RECONNECTING: 'RECONNECTING',
  },
  // Reconnection configuration
  reconnection: {
    attempts: 5,
    delay: 3000,
    backOff: 1.5,
  },
};

// API client configuration
export const apiClientConfig = {
  baseURL: API_URL,
  timeout: 15000, // 15 seconds
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  retries: 3,
  retryDelay: 1000,
};

// Default export for convenience
const apiConfig = {
  API_URL,
  WEBSOCKET_URL,
  endpoints,
  websocket,
  apiClientConfig,
  isDevelopment,
  isProduction,
};

export default apiConfig;

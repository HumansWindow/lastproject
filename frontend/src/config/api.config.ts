/**
 * API Configuration
 * This file contains all API-related configuration to ensure proper synchronization
 * between frontend and backend services.
 */

// Environment detection
const isProduction = process.env.NODE_ENV === 'production';
const isDevelopment = process.env.NODE_ENV === 'development';

// Base URLs standardized to port 3001
export const API_URL = isProduction 
  ? process.env.NEXT_PUBLIC_API_URL ?? 'https://api.alivehuman.com'
  : 'http://localhost:3001'; // Always use port 3001 for development

export const WEBSOCKET_URL = isProduction
  ? process.env.NEXT_PUBLIC_WEBSOCKET_URL ?? 'wss://api.alivehuman.com'
  : 'ws://localhost:3001'; // Always use port 3001 for websocket too

// Workaround for CORS - when testing, use same origin if we're already on localhost
export const getSafeApiUrl = () => {
  // In browser environment, check if we should use relative URLs to avoid CORS
  if (typeof window !== 'undefined') {
    const currentUrl = window.location.origin;
    
    // If in development and running on localhost:3000, always use absolute URL with port 3001
    if (isDevelopment && currentUrl.includes('localhost')) {
      return API_URL; // Return full URL with port 3001
    }
    
    // If the current URL matches the API domain, use relative URLs
    if (API_URL.includes(window.location.hostname) && !isDevelopment) {
      return '';
    }
  }
  return API_URL;
};

// Endpoints configuration
export const endpoints = {
  // Auth endpoints
  auth: {
    login: `${getSafeApiUrl()}/auth/login`,
    register: `${getSafeApiUrl()}/auth/register`,
    refreshToken: `${getSafeApiUrl()}/auth/refresh-token`,
    forgotPassword: `${getSafeApiUrl()}/auth/forgot-password`,
    resetPassword: `${getSafeApiUrl()}/auth/reset-password`,
    verifyEmail: `${getSafeApiUrl()}/auth/verify-email`,
    logout: `${getSafeApiUrl()}/auth/logout`,
  },
  
  // Wallet auth endpoints - ensure these point to port 3001
  walletAuth: {
    connect: `${API_URL}/auth/wallet/connect`,
    authenticate: `${API_URL}/auth/wallet/authenticate`,
    nonce: `${API_URL}/auth/wallet/nonce`,
  },
  
  // User endpoints
  users: {
    profile: `${getSafeApiUrl()}/users/profile`,
    devices: `${getSafeApiUrl()}/users/devices`,
    sessions: `${getSafeApiUrl()}/users/sessions`,
    updateProfile: `${getSafeApiUrl()}/users/profile/update`,
    settings: `${getSafeApiUrl()}/users/settings`,
  },
  
  // Wallet endpoints
  wallets: {
    balance: `${getSafeApiUrl()}/wallets/balance`,
    transactions: `${getSafeApiUrl()}/wallets/transactions`,
    connect: `${getSafeApiUrl()}/wallets/connect`,
    disconnect: `${getSafeApiUrl()}/wallets/disconnect`,
  },
  
  // Blockchain endpoints
  blockchain: {
    mintToken: `${getSafeApiUrl()}/blockchain/mint`,
    stakingPositions: `${getSafeApiUrl()}/blockchain/staking/positions`,
    createStake: `${getSafeApiUrl()}/blockchain/staking/create`,
    withdrawStake: `${getSafeApiUrl()}/blockchain/staking/withdraw`,
    stakingRewards: `${getSafeApiUrl()}/blockchain/staking/rewards`,
  },
  
  // NFT endpoints
  nft: {
    list: `${getSafeApiUrl()}/nft`,
    metadata: (id: string) => `${getSafeApiUrl()}/nft/${id}/metadata`,
    transfer: `${getSafeApiUrl()}/nft/transfer`,
    mint: `${getSafeApiUrl()}/nft/mint`,
    marketplace: `${getSafeApiUrl()}/nft/marketplace`,
    userCollection: `${getSafeApiUrl()}/nft/collection`,
  },
  
  // Token endpoints
  token: {
    balance: `${getSafeApiUrl()}/token/balance`,
    transactions: `${getSafeApiUrl()}/token/transactions`,
    priceHistory: `${getSafeApiUrl()}/token/price-history`,
    transfer: `${getSafeApiUrl()}/token/transfer`,
  },
  
  // Diary endpoints
  diary: {
    entries: `${getSafeApiUrl()}/diary`,
    entry: (id: string) => `${getSafeApiUrl()}/diary/${id}`,
    locations: `${getSafeApiUrl()}/diary/locations/list`,
    create: `${getSafeApiUrl()}/diary/create`,
    update: (id: string) => `${getSafeApiUrl()}/diary/${id}/update`,
    delete: (id: string) => `${getSafeApiUrl()}/diary/${id}/delete`,
    stats: `${getSafeApiUrl()}/diary/stats`,
  },
  
  // Referral endpoints
  referral: {
    generate: `${getSafeApiUrl()}/referral/generate`,
    validate: `${getSafeApiUrl()}/referral/validate`,
    stats: `${getSafeApiUrl()}/referral/stats`,
    history: `${getSafeApiUrl()}/referral/history`,
    rewards: `${getSafeApiUrl()}/referral/rewards`,
  },
  
  // Health check
  health: {
    status: `${getSafeApiUrl()}/health`,
    version: `${getSafeApiUrl()}/health/version`,
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
  withCredentials: true, // Set to true to allow cookies to be sent to the API
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
  getSafeApiUrl,
};

export default apiConfig;

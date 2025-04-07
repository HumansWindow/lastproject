#!/bin/bash

# Script to fix remaining TypeScript errors after service restructuring
echo "Fixing remaining TypeScript errors..."

# Create types directory if it doesn't exist
mkdir -p /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/types

# 1. Create api-types.ts with common types
echo "Creating missing types file..."
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/types/api-types.ts" << EOF
// Common types used across the application

// User types
export interface UserInfo {
  id: string;
  email: string;
  role: string;
  emailVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile extends UserInfo {
  firstName?: string;
  lastName?: string;
  avatar?: string;
  phoneNumber?: string;
  walletAddresses?: string[];
}

export interface UserResponse {
  user: UserInfo;
}

// Auth types
export interface AuthTokens {
  accessToken: string;
  refreshToken: string;
  expiresIn: number;
}

// Notification types
export interface NotificationEvent {
  id: string;
  title: string;
  message: string;
  timestamp: number;
  category: string;
  link: string;
  read: boolean;
  userId: string;
  seen: boolean;
}

// Balance types
export interface BalanceChangeEvent {
  address: string;
  previousBalance: string;
  newBalance: string;
  formattedNewBalance?: string;
  txHash?: string;
  blockNumber: number;
  timestamp: number;
  chainId: number;
  networkName: string;
  type: 'credit' | 'debit';
}

export interface BalanceUpdateEvent {
  previousBalance: string;
  newBalance: string;
  formattedNewBalance?: string;
  txHash?: string;
  timestamp: number;
}

// NFT types
export interface NftTransferEvent {
  to: string;
  from: string;
  tokenId: string;
  contractAddress: string;
  txHash: string;
  blockNumber: number;
  timestamp: number;
  chainId: number;
  networkName: string;
  type: 'incoming' | 'outgoing';
  metadata?: {
    name?: string;
    description?: string;
    image?: string;
  };
}
EOF

# 2. Create missing diary types
echo "Creating missing diary types file..."
mkdir -p /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/types
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/types/diary.ts" << EOF
// Diary types

export interface DiaryLocation {
  latitude: number;
  longitude: number;
  name?: string;
  address?: string;
}

export interface Diary {
  id: string;
  title: string;
  content: string;
  location?: DiaryLocation;
  images?: string[];
  createdAt: string;
  updatedAt: string;
  userId: string;
}
EOF

# 3. Fix component type errors
echo "Fixing component type errors..."

# Fix WalletBalanceMonitor
sed -i 's/setBalanceChanges(prev => {/setBalanceChanges((prev: BalanceChangeEvent[]) => {/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/WalletBalanceMonitor.tsx"
sed -i 's/const updated = \[event, ...prev\]/const updated = [event as BalanceChangeEvent, ...prev]/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/WalletBalanceMonitor.tsx"

# Fix NotificationsPanel
sed -i 's/setNotifications(prev => {/setNotifications((prev: NotificationEvent[]) => {/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/NotificationsPanel.tsx"
sed -i 's/const updated = \[notification, ...prev\]/const updated = [notification as NotificationEvent, ...prev]/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/NotificationsPanel.tsx"

# Fix NFTTransferMonitor
sed -i 's/setTransfers(prev => {/setTransfers((prev: NftTransferEvent[]) => {/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/NFTTransferMonitor.tsx"
sed -i 's/const updated = \[event, ...prev\]/const updated = [event as NftTransferEvent, ...prev]/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/NFTTransferMonitor.tsx"

# Fix RealTimeBalance
sed -i 's|(update: BalanceChangeEvent) => {|(update: BalanceUpdateEvent) => {|g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/RealTimeBalance.tsx"

# 4. Fix method name discrepancies in components
echo "Fixing method name discrepancies..."

# Fix WebSocketStatus
sed -i 's/realtimeService.subscribeToMessage/realtimeService.onMessage/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/WebSocketStatus.tsx"

# Fix auth context
sed -i 's/authService.getProfile/authService.getUserProfile/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
sed -i 's/authService.loginWithSignature/authService.loginWithWallet/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
sed -i 's/const { data } = await authService.login/const response = await authService.login/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
sed -i 's/const { data } = await authService.loginWithWallet/const response = await authService.loginWithWallet/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
sed -i 's/const { data } = await authService.register/const response = await authService.register/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"

# Fix real-time-demo
sed -i 's/realtimeService.subscribeToMessage/realtimeService.onMessage/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
sed -i 's/realtimeService.configureReconnection/realtimeService.setAutoReconnect/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
sed -i 's/realtimeService.subscribeToChannel/realtimeService.subscribe/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
sed -i 's/realtimeService.unsubscribeFromChannel/realtimeService.unsubscribe/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"
sed -i 's/realtimeService.connect()/realtimeService.connect(customToken)/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/real-time-demo.tsx"

# 5. Create axios-cache-adapter mock 
echo "Creating missing dependencies..."
mkdir -p "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/types"
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/types/axios-cache-adapter.d.ts" << EOF
declare module 'axios-cache-adapter' {
  import { AxiosAdapter, AxiosRequestConfig } from 'axios';

  interface SetupCacheOptions {
    maxAge?: number;
    exclude?: {
      query?: boolean;
      methods?: string[];
      filter?: (response: any) => boolean;
    };
    clearOnError?: boolean;
    clearOnStale?: boolean;
    readHeaders?: boolean;
    debug?: boolean;
  }

  interface CacheRequestConfig extends AxiosRequestConfig {
    cache?: boolean;
    clearCacheEntry?: boolean;
  }

  interface CacheInstance {
    adapter: AxiosAdapter;
  }

  export function setupCache(options?: SetupCacheOptions): CacheInstance;
}
EOF

# 6. Fix api-client recursive import issue
echo "Creating api-client.ts for modules..."
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api-client.ts" << EOF
// Base API client that can be imported by any service
import axios from 'axios';

// Create axios instance with default config
const apiClient = axios.create({
  baseURL: process.env.REACT_APP_API_URL || 'http://localhost:3000',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to inject auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers['Authorization'] = \`Bearer \${token}\`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export { apiClient };
export default apiClient;
EOF

# 7. Fix notification service import issues
echo "Fixing notification service imports..."
sed -i "s|from '../api/api-client'|from '../realtime/websocket/realtime-service'|g" "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/notifications/notification-service.ts"

# 8. Fix event bus module issue
echo "Fixing event bus module issue..."
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/realtime/events/event-bus.ts" << EOF
// Simple event bus implementation
type EventHandler = (...args: any[]) => void;

class EventBus {
  private events: Record<string, EventHandler[]> = {};

  subscribe(event: string, callback: EventHandler): () => void {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(callback);

    return () => {
      this.events[event] = this.events[event].filter(cb => cb !== callback);
    };
  }

  publish(event: string, ...args: any[]) {
    if (this.events[event]) {
      this.events[event].forEach(callback => callback(...args));
    }
  }

  clear(event?: string) {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
  }
}

export const eventBus = new EventBus();
EOF

# Fix ambiguous exports
echo "Fixing ambiguous exports in services/index.ts..."
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/index.ts" << EOF
// Main services barrel file - selectively re-exporting to avoid ambiguity
export { apiClient } from './api-client';

// Security services
export * from './security/security-service';
export * from './security/protection/captcha-service';
export * from './security/protection/device-fingerprint';
export * from './security/encryption/encryption-service';

// Storage services
export * from './storage/memory/memory-manager';
export * from './storage/cache/cache-utils';

// Realtime services - specify only what's needed to avoid naming conflicts
export { 
  realtimeService,
  subscribeToMessage,
  unsubscribeFromMessage
} from './realtime/websocket/realtime-service';
export { 
  WebSocketManager, 
  ConnectionStatus,
  WebSocketError
} from './realtime/websocket/websocket-manager';

// API modules - re-export from nested locations
export * from './api/modules/auth';
export * from './api/modules/wallet';
export * from './api/modules/nft';
export * from './api/modules/diary';
export * from './api/modules/user';

// Notification services
export * from './notifications/notification-service';
EOF

# 9. Run TypeScript check again to validate fixes
echo "Running TypeScript check to validate fixes..."
cd "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend" && npx tsc --noEmit

echo ""
echo "TypeScript error fixing completed. Please check the output above to see if any errors remain."
echo ""
echo "If all errors are resolved, you can safely remove the backup directory with:"
echo "rm -rf temp_backup"
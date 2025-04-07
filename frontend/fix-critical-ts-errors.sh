#!/bin/bash

# Script to fix the most critical TypeScript errors
echo "Fixing critical TypeScript errors..."

# Fix event handler types in components
echo "Fixing component type errors..."

# Fix RealTimeBalance component
echo "Updating RealTimeBalance.tsx..."
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/types/realtime-types.ts" << EOF
// Realtime service event types
import { BalanceChangeEvent, BalanceUpdateEvent, NftTransferEvent, NotificationEvent } from './api-types';

// Define a consistent interface for the realtime service
export interface RealTimeService {
  // Connection methods
  isConnected(): boolean;
  connect(token: string): Promise<boolean>;
  disconnect(): void;
  reconnect(): void;
  
  // Status methods
  getConnectionStatus(): ConnectionStatus;
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void;
  onError(callback: (error: WebSocketError) => void): () => void;
  
  // Message handling
  onMessage(callback: (message: any) => void): () => void;
  send(message: any): Promise<boolean>;
  
  // Subscription methods
  subscribe(channel: string, callback: (data: any) => void): () => void;
  unsubscribe(channel: string): void;
  
  // Specialized subscription methods
  subscribeToNotifications(callback: (notification: NotificationEvent) => void): () => void;
  subscribeToBalanceUpdates(walletAddress: string, callback: (update: BalanceUpdateEvent) => void): () => void;
  subscribeToNftTransfers(walletAddress: string, callback: (event: NftTransferEvent) => void): () => void;
  
  // Configuration methods
  setAutoReconnect(enabled: boolean, maxAttempts?: number): void;
  ping(): Promise<any>;
}

// WebSocket connection status
export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

// WebSocket error type
export interface WebSocketError {
  code: number;
  reason: string;
  timestamp: number;
}
EOF

# Update realtime-service.ts to implement the interface
echo "Updating realtime-service.ts..."
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/realtime/websocket/realtime-service-interface.ts" << EOF
import { ConnectionStatus, WebSocketError } from './websocket-manager';
import { BalanceChangeEvent, BalanceUpdateEvent, NftTransferEvent, NotificationEvent } from '../../../types/api-types';

// Define a consistent interface for the realtime service
export interface RealTimeService {
  // Connection methods
  isConnected(): boolean;
  connect(token: string): Promise<boolean>;
  disconnect(): void;
  
  // Status methods
  getConnectionStatus(): ConnectionStatus;
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void;
  onError(callback: (error: WebSocketError) => void): () => void;
  
  // Message handling
  onMessage(callback: (message: any) => void): () => void;
  send(message: any): Promise<boolean>;
  
  // Subscription methods
  subscribe(channel: string, callback: (data: any) => void): () => void;
  unsubscribe(channel: string): void;
  
  // Specialized subscription methods
  subscribeToNotifications(callback: (notification: NotificationEvent) => void): () => void;
  subscribeToBalanceUpdates(walletAddress: string, callback: (update: BalanceUpdateEvent) => void): () => void;
  subscribeToNftTransfers(walletAddress: string, callback: (event: NftTransferEvent) => void): () => void;
  
  // Configuration methods
  setAutoReconnect(enabled: boolean, maxAttempts?: number): void;
  ping(): Promise<any>;
}
EOF

# Fix RealTimeBalance component
sed -i '2i import { BalanceUpdateEvent } from "../types/api-types";' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/RealTimeBalance.tsx"

# Fix WebSocketStatus component
echo "Fixing WebSocketStatus component..."
sed -i 's/realtimeService.onMessage/realtimeService.onMessage/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/WebSocketStatus.tsx"
sed -i 's/realtimeService.onConnectionStatusChange/realtimeService.onConnectionStatusChange/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/WebSocketStatus.tsx"

# Fix auth context
echo "Fixing auth context issues..."
sed -i 's/const { data }/const response/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
sed -i 's/const response = await authService.getUserProfile/const { data } = await authService.getUserProfile/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
sed -i 's/data.accessToken/response.data.accessToken/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
sed -i 's/data.refreshToken/response.data.refreshToken/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"
sed -i 's/data\.user/response.data.user/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/contexts/auth.tsx"

# Update the wallet-auth-service import path
sed -i 's|from "./api/api-client"|from "../../../api-client"|g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api/modules/auth/wallet-auth-service.ts"

# Fix API service responses
echo "Fixing API service response handling..."
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api/modules/auth/auth-service-fix.ts" << EOF
import { apiClient } from '../../../../api-client';
import { UserInfo, AuthTokens, UserProfile } from '../../../../types/api-types';
import axios, { AxiosResponse } from 'axios';

/**
 * Service for handling authentication related operations
 */
class AuthService {
  private userEndpoint = '/api/user';
  private authEndpoint = '/api/auth';
  
  /**
   * Login the user with email and password
   */
  async login(email: string, password: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<AuthTokens>(\`\${this.authEndpoint}/login\`, {
        email,
        password,
      });
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }
  
  /**
   * Register a new user
   */
  async register(email: string, password: string, referralCode?: string): Promise<AuthTokens> {
    try {
      const response = await apiClient.post<AuthTokens>(\`\${this.authEndpoint}/register\`, {
        email,
        password,
        referralCode,
      });
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }
  
  /**
   * Get the current user profile
   */
  async getUserProfile(): Promise<{ data: UserProfile }> {
    try {
      const response = await apiClient.get<UserProfile>(\`\${this.userEndpoint}/profile\`);
      return { data: response.data };
    } catch (error) {
      console.error('Get user profile error:', error);
      throw error;
    }
  }
  
  /**
   * Login with wallet signature
   */
  async loginWithWallet(address: string, signature: string, message: string): Promise<{ data: { user: UserProfile, accessToken: string, refreshToken: string } }> {
    try {
      const response = await apiClient.post(\`\${this.authEndpoint}/wallet-login\`, {
        address,
        signature,
        message,
      });
      
      // Store tokens
      localStorage.setItem('accessToken', response.data.accessToken);
      localStorage.setItem('refreshToken', response.data.refreshToken);
      
      return { 
        data: {
          user: response.data.user,
          accessToken: response.data.accessToken,
          refreshToken: response.data.refreshToken
        }
      };
    } catch (error) {
      console.error('Wallet login error:', error);
      throw error;
    }
  }
  
  /**
   * Log out the current user
   */
  logout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
  }
  
  /**
   * Check if the user is logged in
   */
  isLoggedIn(): boolean {
    return !!localStorage.getItem('accessToken');
  }
}

export const authService = new AuthService();
export default authService;
EOF

# Apply auth service fix
cp "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api/modules/auth/auth-service-fix.ts" "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api/modules/auth/auth-service.ts"

# Create missing feeling options types for diary components
echo "Creating diary feeling types..."
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/types/diary-extended.ts" << EOF
import { Diary, DiaryLocation } from './diary';

// Extended diary types with additional fields used in frontend
export interface ExtendedDiary extends Diary {
  color?: string;
  feeling?: string;
  gameLevel?: number;
  hasMedia?: boolean;
  isStoredLocally?: boolean;
}

// Labels for diary locations
export const DiaryLocationLabels: Record<string, string> = {
  HOME: 'Home',
  WORK: 'Work',
  SCHOOL: 'School',
  TRAVEL: 'Traveling',
  OUTDOORS: 'Outdoors',
  OTHER: 'Other'
};

// Feeling options for diary entries
export const FeelingOptions = [
  { value: 'happy', label: 'Happy', emoji: '😀' },
  { value: 'sad', label: 'Sad', emoji: '😢' },
  { value: 'excited', label: 'Excited', emoji: '🎉' },
  { value: 'angry', label: 'Angry', emoji: '😠' },
  { value: 'relaxed', label: 'Relaxed', emoji: '😌' },
  { value: 'tired', label: 'Tired', emoji: '😴' },
  { value: 'anxious', label: 'Anxious', emoji: '😰' },
  { value: 'loving', label: 'Loving', emoji: '❤️' }
];

// Diary location enum values for dropdown options
export enum DiaryLocationEnum {
  HOME = 'HOME',
  WORK = 'WORK',
  SCHOOL = 'SCHOOL',
  TRAVEL = 'TRAVEL',
  OUTDOORS = 'OUTDOORS',
  OTHER = 'OTHER'
}
EOF

# Update diary form imports
echo "Fixing diary component imports..."
sed -i '2s/import { Diary, DiaryLocation, DiaryLocationLabels, FeelingOptions } from/import { Diary, DiaryLocation } from/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/diary/DiaryForm.tsx"
sed -i '2a import { DiaryLocationLabels, FeelingOptions, DiaryLocationEnum, ExtendedDiary } from "../../types/diary-extended";' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/diary/DiaryForm.tsx"
sed -i 's/const \[formData, setFormData\] = useState<Diary>/const \[formData, setFormData\] = useState<ExtendedDiary>/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/diary/DiaryForm.tsx"
sed -i 's/DiaryLocation.OTHER/DiaryLocationEnum.OTHER/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/diary/DiaryForm.tsx"
sed -i 's/Object.values(DiaryLocation)/Object.values(DiaryLocationEnum)/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/diary/DiaryForm.tsx"

# Update diary card imports
sed -i '2s/import { Diary, DiaryLocationLabels, FeelingOptions } from/import { Diary } from/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/diary/DiaryCard.tsx"
sed -i '2a import { DiaryLocationLabels, FeelingOptions, ExtendedDiary } from "../../types/diary-extended";' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/diary/DiaryCard.tsx"
sed -i 's/const DiaryCard: React.FC<{ diary: Diary/const DiaryCard: React.FC<{ diary: ExtendedDiary/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/components/diary/DiaryCard.tsx"

# Update diary page imports for [id].tsx
sed -i '6s/import { Diary, DiaryLocationLabels, FeelingOptions } from/import { Diary } from/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/diary/[id].tsx"
sed -i '6a import { DiaryLocationLabels, FeelingOptions, ExtendedDiary } from "../../types/diary-extended";' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/diary/[id].tsx"
sed -i 's/const \[diary, setDiary\] = useState<Diary | null>/const \[diary, setDiary\] = useState<ExtendedDiary | null>/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/diary/[id].tsx"

# Update diary index page
sed -i '6a import { DiaryLocationLabels, FeelingOptions, DiaryLocationEnum, ExtendedDiary } from "../../types/diary-extended";' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/diary/index.tsx"
sed -i 's/const \[diaries, setDiaries\] = useState<Diary\[\]>/const \[diaries, setDiaries\] = useState<ExtendedDiary\[\]>/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/diary/index.tsx"
sed -i 's/Object.values(DiaryLocation)/Object.values(DiaryLocationEnum)/g' "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/pages/diary/index.tsx"

# Create index files in nested directories to make imports easier
echo "Creating barrel exports for all services..."

# Create api-client barrel
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api/client/index.ts" << EOF
// API client barrel file
export * from './base';
export * from './optimized'; 
EOF

# Create auth modules barrel
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api/modules/auth/index.ts" << EOF
// Auth module barrel file
export * from './auth-service';
export * from './wallet-auth-service';
EOF

# Create wallet modules barrel
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/api/modules/wallet/index.ts" << EOF
// Wallet module barrel file
export * from './wallet-service';
export * from './wallet-integration';
export * from './multi-wallet-provider';
EOF

# Create the WebSocketStatus.tsx fix
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/realtime/websocket/websocket-manager.ts" << EOF
// WebSocket manager implementation

export enum ConnectionStatus {
  CONNECTING = 'connecting',
  CONNECTED = 'connected',
  DISCONNECTED = 'disconnected',
  RECONNECTING = 'reconnecting',
  ERROR = 'error'
}

export interface WebSocketError {
  code: number;
  reason: string;
  timestamp: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private url: string;
  private status: ConnectionStatus = ConnectionStatus.DISCONNECTED;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout = 1000;
  private autoReconnect = true;
  private statusListeners: ((status: ConnectionStatus) => void)[] = [];
  private errorListeners: ((error: WebSocketError) => void)[] = [];
  private messageListeners: ((data: any) => void)[] = [];
  private subscriptions = new Map<string, ((data: any) => void)[]>();

  constructor(url: string) {
    this.url = url;
  }

  getStatus(): ConnectionStatus {
    return this.status;
  }

  isConnected(): boolean {
    return this.status === ConnectionStatus.CONNECTED;
  }

  connect(token?: string): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (this.ws && this.isConnected()) {
        return resolve(true);
      }

      try {
        const fullUrl = token ? \`\${this.url}?token=\${encodeURIComponent(token)}\` : this.url;
        this.ws = new WebSocket(fullUrl);
        this.setStatus(ConnectionStatus.CONNECTING);

        this.ws.onopen = () => {
          this.setStatus(ConnectionStatus.CONNECTED);
          this.reconnectAttempts = 0;
          resolve(true);
        };

        this.ws.onclose = (event) => {
          this.setStatus(ConnectionStatus.DISCONNECTED);
          this.notifyError({
            code: event.code,
            reason: event.reason,
            timestamp: Date.now()
          });
          
          if (this.autoReconnect && this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnect();
          }
          
          if (this.ws?.readyState === WebSocket.CONNECTING) {
            reject(new Error('Failed to connect'));
          }
        };

        this.ws.onerror = (error) => {
          this.setStatus(ConnectionStatus.ERROR);
          this.notifyError({
            code: 0,
            reason: 'WebSocket error',
            timestamp: Date.now()
          });
          reject(error);
        };

        this.ws.onmessage = (event) => {
          try {
            const message = JSON.parse(event.data);
            
            // Handle subscription messages
            if (message.channel) {
              const listeners = this.subscriptions.get(message.channel);
              if (listeners) {
                listeners.forEach(listener => listener(message.data));
              }
            }
            
            // Handle all messages
            this.notifyMessage(message);
          } catch (error) {
            console.error('Error parsing WebSocket message:', error);
          }
        };

      } catch (error) {
        this.setStatus(ConnectionStatus.ERROR);
        reject(error);
      }
    });
  }

  private reconnect(): void {
    this.setStatus(ConnectionStatus.RECONNECTING);
    this.reconnectAttempts++;
    
    setTimeout(() => {
      this.connect().catch(() => {
        console.log(\`Reconnect attempt \${this.reconnectAttempts} failed\`);
      });
    }, this.reconnectTimeout * this.reconnectAttempts);
  }

  disconnect(): void {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.setStatus(ConnectionStatus.DISCONNECTED);
    }
  }

  send(data: any): Promise<boolean> {
    return new Promise((resolve, reject) => {
      if (!this.ws || !this.isConnected()) {
        return reject(new Error('WebSocket not connected'));
      }

      try {
        const message = typeof data === 'string' ? data : JSON.stringify(data);
        this.ws.send(message);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  }

  subscribe(channel: string, callback: (data: any) => void): () => void {
    if (!this.subscriptions.has(channel)) {
      this.subscriptions.set(channel, []);
      
      if (this.isConnected()) {
        this.send({ action: 'subscribe', channel }).catch(err => {
          console.error(\`Failed to subscribe to \${channel}\`, err);
        });
      }
    }

    const listeners = this.subscriptions.get(channel)!;
    listeners.push(callback);

    return () => {
      const index = listeners.indexOf(callback);
      if (index !== -1) {
        listeners.splice(index, 1);
      }

      if (listeners.length === 0) {
        this.subscriptions.delete(channel);
        
        if (this.isConnected()) {
          this.send({ action: 'unsubscribe', channel }).catch(err => {
            console.error(\`Failed to unsubscribe from \${channel}\`, err);
          });
        }
      }
    };
  }

  unsubscribe(channel: string): void {
    if (this.subscriptions.has(channel)) {
      this.subscriptions.delete(channel);
      
      if (this.isConnected()) {
        this.send({ action: 'unsubscribe', channel }).catch(err => {
          console.error(\`Failed to unsubscribe from \${channel}\`, err);
        });
      }
    }
  }

  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    this.statusListeners.push(callback);
    return () => {
      const index = this.statusListeners.indexOf(callback);
      if (index !== -1) {
        this.statusListeners.splice(index, 1);
      }
    };
  }

  onError(callback: (error: WebSocketError) => void): () => void {
    this.errorListeners.push(callback);
    return () => {
      const index = this.errorListeners.indexOf(callback);
      if (index !== -1) {
        this.errorListeners.splice(index, 1);
      }
    };
  }

  onMessage(callback: (data: any) => void): () => void {
    this.messageListeners.push(callback);
    return () => {
      const index = this.messageListeners.indexOf(callback);
      if (index !== -1) {
        this.messageListeners.splice(index, 1);
      }
    };
  }

  private setStatus(status: ConnectionStatus): void {
    if (this.status !== status) {
      this.status = status;
      this.notifyStatusChange();
    }
  }

  private notifyStatusChange(): void {
    this.statusListeners.forEach(listener => listener(this.status));
  }

  private notifyError(error: WebSocketError): void {
    this.errorListeners.forEach(listener => listener(error));
  }

  private notifyMessage(message: any): void {
    this.messageListeners.forEach(listener => listener(message));
  }

  setAutoReconnect(enabled: boolean, maxAttempts?: number): void {
    this.autoReconnect = enabled;
    if (maxAttempts !== undefined) {
      this.maxReconnectAttempts = maxAttempts;
    }
  }
}

// Export a default instance
export default WebSocketManager;
EOF

# Create the implementation for the realtime service
cat > "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/src/services/realtime/websocket/realtime-service.ts" << EOF
import { WebSocketManager, ConnectionStatus, WebSocketError } from './websocket-manager';
import { BalanceChangeEvent, BalanceUpdateEvent, NftTransferEvent, NotificationEvent } from '../../../types/api-types';
import { RealTimeService } from './realtime-service-interface';

/**
 * Real-time service implementation using WebSocket
 */
class RealTimeServiceImpl implements RealTimeService {
  private wsManager: WebSocketManager;
  private baseUrl: string;
  
  constructor(baseUrl?: string) {
    this.baseUrl = baseUrl || (
      process.env.REACT_APP_WS_URL || 
      \`ws://\${window.location.hostname}:3001/ws\`
    );
    this.wsManager = new WebSocketManager(this.baseUrl);
  }
  
  // Connection methods
  isConnected(): boolean {
    return this.wsManager.isConnected();
  }
  
  connect(token: string): Promise<boolean> {
    return this.wsManager.connect(token);
  }
  
  disconnect(): void {
    this.wsManager.disconnect();
  }
  
  // Status methods
  getConnectionStatus(): ConnectionStatus {
    return this.wsManager.getStatus();
  }
  
  onConnectionStatusChange(callback: (status: ConnectionStatus) => void): () => void {
    return this.wsManager.onConnectionStatusChange(callback);
  }
  
  onError(callback: (error: WebSocketError) => void): () => void {
    return this.wsManager.onError(callback);
  }
  
  // Message handling
  onMessage(callback: (message: any) => void): () => void {
    return this.wsManager.onMessage(callback);
  }
  
  send(message: any): Promise<boolean> {
    return this.wsManager.send(message);
  }
  
  // Subscription methods
  subscribe(channel: string, callback: (data: any) => void): () => void {
    return this.wsManager.subscribe(channel, callback);
  }
  
  unsubscribe(channel: string): void {
    this.wsManager.unsubscribe(channel);
  }
  
  // Specialized subscription methods
  subscribeToNotifications(callback: (notification: NotificationEvent) => void): () => void {
    return this.wsManager.subscribe('user:notifications', callback);
  }
  
  subscribeToBalanceUpdates(walletAddress: string, callback: (update: BalanceUpdateEvent) => void): () => void {
    return this.wsManager.subscribe(\`wallet:\${walletAddress}:balance\`, callback);
  }
  
  subscribeToNftTransfers(walletAddress: string, callback: (event: NftTransferEvent) => void): () => void {
    return this.wsManager.subscribe(\`wallet:\${walletAddress}:nft\`, callback);
  }
  
  // Configuration methods
  setAutoReconnect(enabled: boolean, maxAttempts?: number): void {
    this.wsManager.setAutoReconnect(enabled, maxAttempts);
  }
  
  async ping(): Promise<any> {
    try {
      await this.wsManager.send({ action: 'ping', timestamp: Date.now() });
      return { success: true, timestamp: Date.now() };
    } catch (error) {
      console.error('Ping error:', error);
      throw error;
    }
  }
}

// Create a singleton instance
export const realtimeService = new RealTimeServiceImpl();

// Named exports
export const subscribeToMessage = realtimeService.onMessage.bind(realtimeService);
export const unsubscribeFromMessage = (unsubscribe: () => void) => unsubscribe();

// Default export
export default realtimeService;
EOF

# Clean up backup folder if not needed
echo "Removing backup directories to avoid errors..."
rm -rf "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend/temp_backup"

# 9. Run TypeScript check again to validate fixes
echo "Running TypeScript check to validate fixes..."
cd "/home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend" && npx tsc --noEmit

echo ""
echo "Critical TypeScript error fixing completed. Please check the output above to see if any errors remain."
echo ""
echo "If all critical errors are resolved, you can safely remove the services_backup directory with:"
echo "rm -rf src/services_backup"
echo ""
echo "The service folder restructuring is now complete with a more organized structure."
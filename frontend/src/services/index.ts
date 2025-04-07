// Main services barrel file - selectively re-exporting to avoid ambiguity

// Export api-client from its new location
export { apiClient } from './api/api-client';

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
} from './realtime/websocket/websocket-manager';
// Export type separately with 'export type' syntax for isolatedModules compatibility
export type { WebSocketError } from './realtime/websocket/websocket-manager';

// API modules - re-export from nested locations
export * from './api/modules/auth';
export * from './api/modules/wallet';
export * from './api/modules/nft';
export * from './api/modules/diary';
export * from './api/modules/user';

// Notification services
export * from './notifications/notification-service';

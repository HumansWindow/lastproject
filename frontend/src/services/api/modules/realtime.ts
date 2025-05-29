import { realtimeService as globalRealtimeService, 
  ConnectionStatus,
  NftTransferEvent, 
  BalanceUpdateEvent, 
  NotificationEvent,
  TokenPriceEvent,
  StakingUpdateEvent,
  WebSocketError,
  MessageHandler,
  ErrorHandler
} from "../../realtime";

// Re-export the types but not the service to avoid conflicts
export type { 
  NftTransferEvent, 
  BalanceUpdateEvent, 
  NotificationEvent,
  TokenPriceEvent,
  StakingUpdateEvent,
  WebSocketError,
  ConnectionStatus,
  MessageHandler,
  ErrorHandler
};

// Add any API-specific realtime methods here if needed
export const initializeRealtimeApi = (token: string): void => {
  globalRealtimeService.setToken(token);
};

// Export functions that use the global realtimeService
export const realtimeApi = globalRealtimeService;

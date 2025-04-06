// Export API client
export { apiClient } from './api-client';

// Re-export ConnectionStatus for use with WebSocket functionality
export { ConnectionStatus } from '../websocket-manager';

// Export WebSocket-related interfaces
export { realtimeService } from './realtime-service';
export type { 
  NotificationEvent,
  BalanceUpdateEvent,
  NftTransferEvent,
  TokenPriceEvent,
  StakingUpdateEvent
} from './realtime-service';

// Export service interfaces and implementations
export { default as diaryService } from './diary-service';
export type { DiaryEntry, CreateDiaryEntryRequest, UpdateDiaryEntryRequest, DiaryLocation } from './diary-service';

// Add other service exports as they are created
// export { authService } from './auth-service';
// export { referralService } from './referral-service';
// export { tokenService } from './token-service';
// export { nftService } from './nft-service';
// export { walletService } from './wallet-service';
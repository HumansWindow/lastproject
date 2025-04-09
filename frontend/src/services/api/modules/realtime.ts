import { realtimeService } from '../../realtime';
import type { 
  NftTransferEvent, 
  BalanceUpdateEvent, 
  NotificationEvent 
} from '../../realtime';

// Re-export the realtime service and types
export { realtimeService };
export type { NftTransferEvent, BalanceUpdateEvent, NotificationEvent };

// Add any API-specific realtime methods here if needed
export const initializeRealtimeApi = (token: string): void => {
  realtimeService.setToken(token);
};

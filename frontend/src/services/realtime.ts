/**
 * @deprecated This file is maintained for backward compatibility.
 * Please import from './realtime/index' directly instead.
 * This file will be removed in a future version.
 */

// Re-export everything from the structured implementation
export * from './realtime/index';

// Re-export the realtimeService instance specifically to maintain exact import compatibility
import { realtimeService as structuredRealtimeService } from './realtime/index';
export { structuredRealtimeService as realtimeService };

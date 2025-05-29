import { CompleteRealtimeService } from "../../realtime";
import { realtimeService as implementationService } from "../../realtime";

// Re-export the global realtimeService for backward compatibility
export const websocketManager = implementationService;

// Default export for backward compatibility
export default websocketManager;

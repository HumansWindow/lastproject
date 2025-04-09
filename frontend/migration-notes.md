# WebSocket Implementation Migration Guide

## WebSocket Consolidation

The WebSocket implementation has been consolidated to use only the `RealtimeService` 
from `src/services/realtime/websocket/realtime-service.ts`, exported as `realtimeService`.

### Files to be removed

The following files are now deprecated and will be removed:

- `/src/hooks/useWebSocket.ts`
- `/src/services/realtime/websocket/websocket-manager.ts`
- `/src/services/realtime.ts` (duplicate of `/src/services/realtime/index.ts`)

### Migration steps for components using WebSocketManager

#### 1. Update imports

**Old imports:**
```typescript
import { WebSocketManager } from '../services/realtime/websocket/websocket-manager';
import { useWebSocket } from '../hooks/useWebSocket';
```

**New imports:**
```typescript
import { realtimeService } from '../services/realtime';
import { useWebSocketContext } from '../contexts/websocket';
```

#### 2. Update usage

**Old usage with direct WebSocketManager:**
```typescript
WebSocketManager.getInstance().connect(token);
const unsubscribe = WebSocketManager.getInstance().subscribe('channel', callback);
```

**New usage with realtimeService:**
```typescript
realtimeService.connect(token);
const unsubscribe = realtimeService.subscribe('channel', callback);
```

**Old usage with hook:**
```typescript
const { connected, connect, disconnect, subscribe } = useWebSocket();
```

**New usage with context hook:**
```typescript
const { isConnected, connect, disconnect, subscribe } = useWebSocketContext();
```

### Testing the migration

After updating your components, you should test:

1. Connection establishment when a page loads
2. Real-time updates arriving through subscriptions
3. Proper cleanup when navigating away from pages
4. Error handling when the server is unreachable
5. Reconnection behavior when network connectivity is restored

### Enhancements in the new implementation

1. Improved error handling with detailed error messages
2. Automatic reconnection with exponential backoff
3. Connection timeout detection
4. Ping/pong mechanism to detect silent connection drops
5. Connection duration tracking
6. Comprehensive connection status information
7. Consistent React Context API for component integration

### WebSocket configuration

WebSocket connection parameters are now centralized in `/src/services/realtime/config.ts`.
This includes:

- WebSocket server URL (per environment)
- Reconnection parameters
- Connection timeout

If you need to modify WebSocket behavior, update this configuration file.

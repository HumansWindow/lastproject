# WebSocket Implementation Guide

## Overview

This document explains how to use the WebSocket functionality in the AliveHuman frontend application.

## Architecture

The WebSocket implementation consists of:

1. **Core Service**
   - `RealtimeService`: Main service class that handles WebSocket connections
   - Located in `src/services/realtime/websocket/realtime-service.ts`
   - Exported as a singleton instance via `realtimeService` from `src/services/realtime`

2. **UI Components**
   - `WebSocketStatus`: Component to display connection status with optional detailed view
   - `WebSocketIndicator`: Minimal status indicator (wrapper around WebSocketStatus)

3. **Demo**
   - `WebSocketDemo`: Example page showing how to use WebSocket functionality

## Usage

### Connecting to WebSocket

```typescript
import { realtimeService } from '../services/realtime';

// Connect with authentication token
const token = localStorage.getItem('accessToken');
realtimeService.connect(token);

// Disconnect when no longer needed
realtimeService.disconnect();
```

### Subscribing to Events

```typescript
import { realtimeService } from '../services/realtime';

// Subscribe to a channel
const unsubscribe = realtimeService.subscribe('balance:0x123...', (data) => {
  console.log('Balance update received:', data);
});

// Always unsubscribe when component unmounts
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### Displaying Connection Status

```tsx
import WebSocketStatus from '../components/WebSocketStatus';

// In your component:
<WebSocketStatus showDetails={true} /> // Detailed view with button
<WebSocketStatus showDetails={false} /> // Minimal indicator dot
```

## Connection Status Values

The WebSocket connection can have the following statuses:

- `CONNECTED`: Successfully connected to the server
- `CONNECTING`: Connection attempt in progress
- `DISCONNECTED`: Not connected to the server
- `ERROR`: Connection error occurred

## Best Practices

1. Always clean up subscriptions when components unmount
2. Use the connection status to provide visual feedback to users
3. Handle disconnections gracefully in your UI
4. Consider implementing fallback mechanisms for critical features

## Migration Notes

If you were previously using WebSocketManager, it has been consolidated with RealtimeService.
Please update your imports to use the new unified implementation:

```typescript
// Old import (deprecated)
import { WebSocketManager } from '../services/realtime/websocket/websocket-manager';

// New import (preferred)
import { realtimeService } from '../services/realtime';
```

## Cleanup Plan

To clean up the duplicate WebSocket implementation files:

1. **First verify no code is using these files**
   ```bash
   grep -r "from '.*websocket-manager" ./src
   grep -r "from '.*hooks/useWebSocket" ./src
   ```

2. **Files to safely remove after confirming they are no longer used**:
   - `/src/hooks/useWebSocket.ts` - This is now redundant as it's been consolidated into the context
   - `/src/services/realtime/websocket/websocket-manager.ts` - Only if it has been fully replaced by realtime-service.ts

3. **Keep and maintain these files**:
   - `/src/contexts/websocket.tsx` - The main WebSocket context provider
   - `/src/components/WebSocketStatus.tsx` - The primary status component
   - `/src/services/realtime/websocket/realtime-service.ts` - The core WebSocket service implementation
   - `/src/components/WebSocketIndicator.tsx` - Wrapper component for minimal display

4. **After removing files, rebuild and test**:
   ```bash
   npm run build
   npm test
   ```

This cleanup will simplify the codebase, remove duplication, and make maintenance easier going forward.
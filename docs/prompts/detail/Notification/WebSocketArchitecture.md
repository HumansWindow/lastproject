# WebSocket Architecture

This document provides details on the WebSocket architecture used for real-time communication in the application.

## Overview

The WebSocket system enables bidirectional, real-time communication between the client and server. It's used to deliver notifications, real-time updates, and other time-sensitive information without requiring page refreshes.

## Core Components

### Backend Components

#### WebSocket Gateway

The primary WebSocket gateway is implemented in `backend/src/blockchain/gateways/websocket.gateway.ts`:

```typescript
@NestWebSocketGateway({
  cors: {
    origin: process.env.FRONTEND_URL || '*',
    credentials: true
  },
  namespace: '/ws',
  path: '/ws'
})
export class BlockchainWebSocketGateway implements OnGatewayConnection, OnGatewayDisconnect, OnGatewayInit {
  @WebSocketServer()
  server: Server;

  // Track client subscriptions
  private clientSubscriptions: Map<string, Set<string>> = new Map();
  private userIdToSocketId: Map<string, Set<string>> = new Map();
  private socketIdToUserId: Map<string, string> = new Map();

  // ...
}
```

The gateway handles:
- Client connections and disconnections
- Authentication via JWT token
- Subscription management
- Message broadcasting

#### WebSocket Authentication

Authentication is handled through a JWT token passed as a query parameter:

```typescript
async handleConnection(client: Socket) {
  try {
    // Extract token from query params
    const token = client.handshake.query.token as string;
    
    if (!token) {
      this.logger.error(`Client ${client.id} disconnected: No token provided`);
      client.disconnect();
      return;
    }

    // Verify token and get user ID
    const userId = await this.getUserIdFromToken(token);
    
    // ...
  } catch (error) {
    // ...
  }
}
```

A WebSocket guard (`WsJwtAuthGuard`) and decorator (`WsUser`) are used to secure WebSocket message handlers.

### Frontend Components

#### WebSocket Manager

The core WebSocket manager (`websocket-manager.ts`) handles:
- Connection establishment and maintenance
- Automatic reconnection with exponential backoff
- Subscription management
- Message parsing and routing

#### RealtimeService

The `RealtimeService` provides a higher-level API for WebSocket functionality:

```typescript
class RealtimeService {
  private manager: WebSocketManager;
  
  constructor() {
    this.manager = new WebSocketManager(getWebSocketConfig().url);
  }
  
  connect(token?: string): Promise<void> {
    return this.manager.connect(token);
  }
  
  disconnect(): void {
    this.manager.disconnect();
  }
  
  subscribe<T>(channel: string, callback: (data: T) => void): () => void {
    return this.manager.subscribe(channel, callback);
  }
  
  // Domain-specific subscription methods
  subscribeToBalanceUpdates(address: string, callback: (data: BalanceUpdateEvent) => void): () => void {
    return this.subscribe<BalanceUpdateEvent>(`balance:${address.toLowerCase()}`, callback);
  }
  
  // ...more subscription methods
}
```

#### WebSocket Context

A React context provides WebSocket status and functionality throughout the application:

```typescript
const WebSocketContext = createContext<WebSocketContextType>({
  manager: null,
  status: ConnectionStatus.DISCONNECTED,
  isConnected: false,
});

export function WebSocketProvider({ children, url, token }: WebSocketProviderProps) {
  const webSocket = useWebSocket(url, token);
  
  return (
    <WebSocketContext.Provider value={webSocket}>
      {children}
    </WebSocketContext.Provider>
  );
}
```

## Communication Protocol

### Message Format

Messages sent through WebSockets follow this structure:

```typescript
interface WebSocketMessage<T> {
  type: string;        // The channel or event type
  payload: T;          // The message payload
  timestamp: number;   // Unix timestamp
}
```

### Common Channels

The system uses several standard channels:

1. `notifications` - User notifications
2. `balance:{address}` - Balance updates for a specific wallet address
3. `nft:{address}` - NFT transfers for a specific wallet address
4. `token:price` - Token price updates
5. `staking:{positionId}` - Staking position updates

### Subscription Management

Clients subscribe to channels using the `subscribe` message:

```typescript
// Client sends
{
  "channel": "balance:0x123..."
}

// Server responds
{
  "success": true
}
```

## Connection Lifecycle

1. **Initialization**: The WebSocket manager is initialized with configuration
2. **Connection Attempt**: The client attempts to connect with authentication token
3. **Authentication**: The server validates the token and associates the socket with a user
4. **Channel Subscription**: The client subscribes to relevant channels
5. **Message Exchange**: Server pushes events through subscribed channels
6. **Disconnection**: Client disconnects or connection is lost
7. **Reconnection**: Automatic reconnection attempts with exponential backoff

## Error Handling

### Connection Errors

The WebSocket manager handles various connection errors:
- Authentication failures
- Network interruptions
- Server unavailability

### Message Errors

Error handling for message processing includes:
- Invalid message format
- Unauthorized subscriptions
- Rate limiting

## Performance Considerations

### Connection Pooling

Multiple connections from the same user are tracked to enable multi-tab/multi-device usage.

### Message Buffering

Messages are buffered during disconnections and delivered upon reconnection.

### Heartbeat Mechanism

A ping/pong mechanism maintains connection health:

```typescript
@UseGuards(WsJwtAuthGuard)
@SubscribeMessage('ping')
handlePing() {
  return { type: 'pong', timestamp: Date.now() };
}
```

## Security Considerations

1. **Authentication**: All WebSocket connections require valid JWT tokens
2. **Authorization**: Channel subscriptions are authorized based on user permissions
3. **Rate Limiting**: Connections and messages are rate-limited to prevent abuse
4. **Input Validation**: All incoming messages are validated before processing
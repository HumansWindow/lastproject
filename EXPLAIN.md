# AliveHuman Backend - Architecture and Documentation

This document provides a comprehensive explanation of the backend architecture, components, and technical implementation.

## Backend Architecture (NestJS)

### Directory Structure

```
backend/
├── config/                    # Configuration files for different environments
├── patches/                   # Custom patches for dependencies
├── scripts/                   # Utility scripts for deployment and maintenance
├── src/
│   ├── app.module.ts          # Root module of the application
│   ├── main.ts                # Entry point of the application
│   ├── auth/                  # Authentication module
│   │   ├── auth.module.ts     # Authentication module configuration
│   │   ├── auth.service.ts    # Authentication business logic
│   │   ├── auth.controller.ts # Authentication REST endpoints
│   │   ├── controllers/       # Additional controllers (wallet-auth, etc)
│   │   ├── dto/               # Data transfer objects for auth requests/responses
│   │   ├── entities/          # Database entities for auth (refresh tokens, etc)
│   │   ├── guards/            # Authentication guards (JWT, roles, ws-auth)
│   │   ├── interfaces/        # TypeScript interfaces for auth data
│   │   └── strategies/        # Passport auth strategies (local, jwt, wallet)
│   ├── blockchain/            # Blockchain integration module
│   │   ├── blockchain.module.ts # Blockchain module configuration
│   │   ├── blockchain.service.ts # Core blockchain service
│   │   ├── contracts/         # Smart contract files and ABIs
│   │   ├── controllers/       # REST endpoints for blockchain operations
│   │   ├── dto/               # Data transfer objects for blockchain requests
│   │   ├── gateways/          # WebSocket gateways for real-time events
│   │   ├── hotwallet/         # Hot wallet implementation
│   │   │   ├── index.js       # Main entry point for the hot wallet
│   │   │   ├── WalletManager.js # Wallet generation and management
│   │   │   ├── services/      # Specialized services (balance, transaction, etc)
│   │   │   ├── handlers/      # Chain-specific handlers
│   │   │   └── utils/         # Utility functions for the wallet
│   │   ├── interfaces/        # TypeScript interfaces for blockchain data
│   │   ├── services/          # Specialized blockchain services
│   │   │   ├── shahi-token.service.ts # SHAHI token service
│   │   │   ├── merkle.service.ts      # Merkle tree service
│   │   │   └── minting.service.ts     # Token minting service
│   │   └── tasks/             # Scheduled tasks for blockchain operations
│   ├── diary/                 # User diary module
│   │   ├── diary.module.ts    # Diary module configuration
│   │   ├── controllers/       # Diary REST API controllers
│   │   │   └── diary.controller.ts # Main diary controller with CRUD operations
│   │   ├── dto/               # Data transfer objects for diary operations
│   │   │   └── diary.dto.ts   # DTOs for create, update, and response
│   │   ├── entities/          # Database entities for the diary system
│   │   │   └── diary.entity.ts # Diary entity with user relationship
│   │   └── services/          # Business logic for diary operations
│   │       └── diary.service.ts # Core diary service implementation
│   ├── mail/                  # Email service module
│   │   ├── mail.module.ts     # Mail module configuration
│   │   ├── mail.service.ts    # Email sending service
│   │   └── templates/         # Email templates
│   ├── migrations/            # TypeORM database migrations
│   ├── nft/                   # NFT module
│   │   ├── nft.module.ts      # NFT module configuration
│   │   ├── nft.service.ts     # NFT business logic
│   │   ├── nft.controller.ts  # NFT REST endpoints
│   │   ├── entities/          # NFT database entities
│   │   └── services/          # Specialized NFT services
│   ├── notification/          # Notification system module
│   │   ├── notification.module.ts # Notification module configuration
│   │   ├── notification.service.ts # Notification business logic
│   │   ├── notification.controller.ts # Notification REST endpoints
│   │   ├── notification.gateway.ts # WebSocket gateway for real-time notifications
│   │   ├── dto/               # Data transfer objects for notifications
│   │   │   ├── create-notification.dto.ts # DTO for creating notifications
│   │   │   ├── update-notification.dto.ts # DTO for updating notifications
│   │   │   └── notification.dto.ts # Response DTO for notifications
│   │   ├── entities/          # Database entities for the notification system
│   │   │   └── notification.entity.ts # Notification entity with user relationship
│   │   └── services/          # Specialized notification services
│   │       ├── notification-delivery.service.ts # Service for delivering notifications
│   │       └── notification-template.service.ts # Service for notification templates
│   ├── referral/              # Referral system module
│   │   ├── referral.module.ts # Referral module configuration
│   │   ├── referral.service.ts # Referral business logic
│   │   ├── referral.controller.ts # Referral REST endpoints
│   │   └── entities/          # Referral database entities
│   ├── shared/                # Shared utilities and services
│   │   ├── shared.module.ts   # Shared module configuration
│   │   ├── services/          # Common services used across modules
│   │   │   ├── device-detector.service.ts # Device detection service
│   │   │   └── bcrypt.service.ts # Password hashing service
│   │   ├── guards/            # Common guards used across modules
│   │   ├── interceptors/      # HTTP interceptors
│   │   ├── filters/           # Exception filters for error handling
│   │   ├── decorators/        # Custom decorators
│   │   └── utils/             # Utility functions
│   ├── users/                 # User management module
│   │   ├── users.module.ts    # User module configuration
│   │   ├── users.service.ts   # User business logic
│   │   ├── users.controller.ts # User REST endpoints
│   │   ├── entities/          # User-related database entities
│   │   │   ├── user.entity.ts # User entity
│   │   │   ├── user-device.entity.ts # User device entity
│   │   │   └── user-session.entity.ts # User session entity
│   │   ├── dto/               # Data transfer objects for user operations
│   │   └── services/          # User-related services
│   │       ├── user-devices.service.ts # Device management service
│   │       └── user-sessions.service.ts # Session management service
│   ├── wallets/               # Wallet management module
│   │   ├── wallets.module.ts  # Wallet module configuration
│   │   ├── wallets.service.ts # Wallet business logic
│   │   ├── wallets.controller.ts # Wallet REST endpoints
│   │   └── entities/          # Wallet-related database entities
│   ├── websocket/             # WebSocket module for real-time communication
│   │   ├── websocket.module.ts # WebSocket module configuration
│   │   ├── websocket.gateway.ts # Main WebSocket gateway
│   │   ├── adapters/          # Custom adapters for Socket.IO
│   │   │   └── redis.adapter.ts # Redis adapter for horizontal scaling
│   │   ├── guards/            # WebSocket-specific guards
│   │   │   └── ws-jwt.guard.ts # JWT authentication guard for WebSockets
│   │   ├── decorators/        # Custom decorators for WebSocket handlers
│   │   │   └── ws-user.decorator.ts # Get user from WebSocket connection
│   │   ├── services/          # WebSocket-related services
│   │   │   ├── channel-manager.service.ts # Service for channel management
│   │   │   └── connection-store.service.ts # Service for tracking connections
│   │   └── interfaces/        # TypeScript interfaces for WebSocket
│   │       ├── ws-client.interface.ts # Interface for connected clients
│   │       └── message.interface.ts # Interface for message structure
│   └── __tests__/             # Test directory
│       ├── setup.ts           # Test setup and configuration
│       ├── test.module.ts     # Test module configuration
│       ├── api.spec.ts        # API integration tests
│       ├── auth/              # Authentication tests
│       ├── blockchain/        # Blockchain tests
│       ├── integration.spec.ts # End-to-end tests
│       └── minimal.spec.ts    # Minimal test suite
├── dist/                      # Compiled JavaScript output
├── node_modules/              # Node.js dependencies
├── package.json               # Project metadata and dependencies
├── tsconfig.json              # TypeScript configuration
├── tsconfig.build.json        # TypeScript build configuration
├── nest-cli.json              # NestJS CLI configuration
└── jest.config.js             # Jest testing configuration
```

## API Client Architecture

The project implements a sophisticated, comprehensive API client that provides a unified interface for all applications (web, mobile, admin) to interact with the backend services. This client is built with TypeScript for type-safety and consistent behavior across platforms.

### API Client Directory Structure

```
shared/
├── api-client/               # Shared API client for all applications
│   ├── src/
│   │   ├── index.ts          # Main entry point and exports
│   │   ├── api-client.ts     # Base API client with axios configuration
│   │   ├── services/         # Service modules for specific API functionality
│   │   │   ├── api.ts        # Core API service exports
│   │   │   ├── auth-service.ts # Authentication service 
│   │   │   ├── wallet-auth-service.ts # Wallet authentication service
│   │   │   ├── diary-service.ts # Diary service
│   │   │   ├── nft-service.ts  # NFT service
│   │   │   ├── wallet-service.ts # Wallet service
│   │   │   ├── token-service.ts # SHAHI token service
│   │   │   ├── referral-service.ts # Referral service
│   │   │   └── realtime-service.ts # WebSocket service
│   │   ├── optimized-api/    # Performance-optimized API clients
│   │   │   ├── cached-api.ts # Caching API client
│   │   │   ├── batch-request.ts # Request batching client
│   │   │   ├── selective-api.ts # Selective field fetching
│   │   │   ├── compressed-api.ts # Response compression client
│   │   │   └── offline-api.ts # Offline support client
│   │   ├── security/         # Enhanced security features
│   │   │   ├── device-fingerprint.ts # Device fingerprinting
│   │   │   ├── security-service.ts # Security service
│   │   │   ├── captcha-service.ts # CAPTCHA verification
│   │   │   └── secure-api-client.ts # Secure API client
│   │   ├── memory/           # Memory management
│   │   │   ├── memory-manager.ts # Advanced memory management
│   │   │   ├── cache-utils.ts # Cache eviction policies
│   │   │   └── storage-monitor.ts # Storage monitoring
│   │   ├── websocket.ts      # WebSocket connection management
│   │   ├── notification/      # Notification system
│   │   │   ├── notification.service.ts # Core notification service
│   │   │   ├── notification.model.ts # Notification data model
│   │   │   ├── notification-store.ts # Persistent notification storage
│   │   │   └── notification-utils.ts # Utility functions for notifications
│   │   └── utils/            # Utility functions
│   │       ├── api-helpers.ts # API request helpers
│   │       ├── auth-helpers.ts # Authentication helpers
│   │       ├── storage.ts    # Local storage utilities
│   │       └── validation.ts # Request validation helpers
│   ├── package.json          # Package configuration
│   └── tsconfig.json         # TypeScript configuration
```

### Core API Client Features

1. **Base Client Configuration**
   - Axios-based HTTP client with interceptors
   - Automatic token management including:
     - JWT token storage in localStorage
     - Automatic token refresh on 401 errors
     - Request queueing during token refresh
   - Consistent error handling and response formatting
   - Support for all HTTP methods (GET, POST, PUT, DELETE)

2. **Service Modules**
   - `AuthService` - Authentication operations (login, register, password reset)
   - `WalletAuthService` - Blockchain wallet authentication
   - `DiaryService` - CRUD operations for user diary entries
   - `NFTService` - NFT management and metadata operations
   - `WalletService` - Wallet management operations
   - `TokenService` - SHAHI token operations (balance, minting)
   - `ReferralService` - Referral code management and statistics
   - `RealtimeService` - WebSocket subscriptions and real-time updates

3. **Real-time Functionality**
   - WebSocket connection management with automatic reconnection
   - Subscription system for real-time updates
   - Balance change notifications for wallet addresses
   - NFT transfer events
   - Connection status monitoring
   - Authentication for secure WebSocket connections
   - Message queuing during connection issues

4. **Performance Optimizations**
   - **Request Caching**: Automatic caching with TTL & tag-based invalidation
   - **Request Batching**: Combines multiple API calls into a single HTTP request
   - **Selective Field Fetching**: Reduces payload size by requesting only needed fields
   - **Response Compression**: Bandwidth optimization for large responses
   - **Offline Support**: Network connectivity monitoring with offline queueing
   - **API Metrics**: Response time and request analytics with real-time monitoring
   - **Advanced Memory Management**: Monitoring and cleanup to prevent memory issues
   - **Cache Eviction Policies**: LRU, LFU, FIFO, and TTL-based strategies

5. **Enhanced Security**
   - **Device Fingerprinting**: Creates and manages unique device identifiers
   - **Risk-Based Authentication**: Adjusts security requirements based on context
   - **Security Event Logging**: Tracks login attempts and suspicious activities
   - **CAPTCHA Protection**: Verification for high-risk operations
   - **Secure API Client**: Adds security headers to all requests
   - **End-to-End Encryption**: RSA/AES hybrid encryption for sensitive data
     - Automatically encrypts data for sensitive routes
     - Key generation and exchange mechanisms
     - Digital signatures for data integrity verification

### Implementation Details

1. **Authentication Flow**
   - Traditional email/password authentication
   - WebSocket connection setup after successful login
   - Token refresh mechanism with request queueing
   - Automatic redirection to login on authentication failures

2. **Wallet Authentication Flow**
   - Two-step process (connect -> sign -> authenticate)
   - Handles wallet connections via MetaMask and other providers
   - Manages challenge signing and verification
   - Optional email association with wallet accounts

3. **Real-time Data Flow**
   - WebSocket connection establishment with authentication
   - Topic-based subscriptions (balance changes, NFT transfers)
   - Event-based connection status updates
   - Automatic reconnection with exponential backoff

4. **Enhanced Security Implementation**
   - Device fingerprinting using browser and hardware characteristics
   - Risk assessment based on device, location, and behavior patterns
   - Automatic CAPTCHA triggering for high-risk operations
   - End-to-end encryption for sensitive data using hybrid approach:
     - RSA-2048 for asymmetric key exchange
     - AES-256-CBC/GCM for symmetric data encryption
     - SHA-256 for data integrity verification

5. **Optimization Strategies**
   - Cache management with configurable TTL and eviction policies
   - Request batching with automatic timeout-based execution
   - Selective field requests with depth control for nested objects
   - Compression thresholds to optimize bandwidth usage
   - Memory monitoring with configurable cleanup triggers
   - Offline operation queueing with conflict resolution

### Security Considerations

1. **Token Security**
   - Tokens are stored in localStorage with expiration
   - Automatic refresh mechanism with secure rotation
   - Properly scoped tokens for different operations

2. **Data Protection**
   - End-to-end encryption for sensitive routes
   - Client-side encryption with key management
   - Digital signatures for data integrity

3. **Risk Mitigation**
   - Device binding for authentication
   - CAPTCHA protection for sensitive operations
   - Risk scoring for adaptive security measures

4. **Memory Safety**
   - Proper cleanup of sensitive data in memory
   - Cache monitoring and management
   - Memory leak prevention in WebSocket connections

5. **Offline Data Security**
   - Secure storage of queued operations
   - Proper encryption of cached sensitive data
   - Conflict resolution strategies

## Real-time Communication System

The project implements a comprehensive real-time communication system using WebSockets to provide instant updates to connected clients. This system is built with Socket.IO on both the backend and frontend.

### WebSocket Architecture

#### Backend Implementation

1. **Core WebSocket Module** (`/backend/src/websocket/`)
   - Main WebSocket gateway that serves as the entry point for all connections
   - Authentication guard for secure WebSocket connections
   - Channel-based subscription system for organized message distribution
   - Connection tracking for managing client state
   - Horizontal scaling support using Redis adapter

2. **Feature-specific Gateways**
   - Blockchain events gateway for token and NFT updates
   - Notification gateway for system notifications
   - User activity gateway for user presence tracking
   - Chat gateway for direct messaging functionality

3. **Connection Security**
   - JWT token verification for each connection
   - Device verification to prevent unauthorized access
   - Permission checking for channel subscriptions
   - Rate limiting to prevent abuse

4. **Channel Management**
   - Dynamic channel creation and cleanup
   - User-specific channels for personalized updates
   - Public channels for global updates
   - Private channels for secure communications

#### Frontend Implementation

1. **WebSocketManager** (`/frontend/src/services/websocket-manager.ts`)
   - Core manager class for WebSocket connections
   - Implements connection lifecycle management
   - Provides subscription management for different event types
   - Handles automatic reconnection with exponential backoff
   - Implements connection status monitoring
   - Provides message queuing during disconnections
   - Features health checking through ping/pong

2. **RealTimeService** (`/shared/api-client/src/services/realtime-service.ts`)
   - Higher-level abstraction for WebSocket functionality
   - Provides domain-specific subscription methods
   - Manages authentication and reconnection logic
   - Ensures proper cleanup to prevent memory leaks

3. **NotificationService** (`/shared/api-client/src/notification/notification.service.ts`)
   - Manages system notifications using RxJS
   - Integrates with the RealTimeService for real-time updates
   - Provides methods for notification management
   - Implements persistent storage for notifications
   - Supports different notification categories (info, success, warning, error)

### WebSocket Events

1. **Authentication Events**
   - `auth_error` - Authentication failures
   - `auth_success` - Successful authentication

2. **Subscription Events**
   - `subscribe` - Subscribe to a specific channel
   - `unsubscribe` - Unsubscribe from a channel

3. **System Events**
   - `connect` - Connection established
   - `disconnect` - Connection lost
   - `reconnect_attempt` - Attempting to reconnect
   - `ping/pong` - Connection health checks

4. **Domain-specific Events**
   - `balance:${address}` - Balance updates for a specific wallet
   - `nft:transfer:${address}` - NFT transfers for a specific address
   - `token:price` - Token price updates
   - `staking:${positionId}` - Staking position updates
   - `notification` - System notifications

### Implementation Features

1. **Automatic Reconnection**
   - Exponential backoff strategy for reconnection attempts
   - Configurable maximum reconnection attempts
   - Jitter to prevent reconnection storms

2. **Message Queuing**
   - Outgoing messages are queued during disconnections
   - Automatic message processing when connection is restored
   - Priority-based message processing

3. **Connection Status Monitoring**
   - Real-time status updates (connected, connecting, reconnecting, disconnected, error)
   - Visual indicators for connection status
   - Detailed error information for troubleshooting

4. **Subscription Management**
   - Automatic resubscribing to channels after reconnection
   - Channel-based subscription organization
   - Proper cleanup to prevent memory leaks

5. **Error Handling**
   - Comprehensive error detection and reporting
   - Automatic recovery from common error conditions
   - Detailed logging for troubleshooting

### Security Considerations

1. **Authentication Security**
   - JWT token verification for each connection
   - Automatic token refresh when expired
   - Proper error handling for authentication failures

2. **Channel Security**
   - Permission checking for channel subscriptions
   - User-specific channels to prevent data leakage
   - Server-side validation of subscription requests

3. **Connection Protection**
   - Rate limiting to prevent abuse
   - Automatic disconnection for suspicious activity
   - IP-based blocking for repeated authentication failures

4. **Data Security**
   - Secure data transmission with TLS
   - Proper input validation for all incoming messages
   - Protection against common WebSocket vulnerabilities

## Notification System

The project implements a comprehensive notification system for delivering real-time updates and alerts to users across different platforms.

### Notification Architecture

#### Backend Implementation

1. **Core Notification Module** (`/backend/src/notification/`)
   - Main notification service that manages creation and delivery of notifications
   - REST API endpoints for notification management
   - WebSocket gateway for real-time notification delivery
   - Database schema for permanent storage of notifications
   - Template system for consistent notification formatting

2. **Notification Categories**
   - System notifications for application-level events
   - User notifications for user-specific events
   - Transaction notifications for blockchain transactions
   - Security notifications for account security events
   - Marketing notifications for promotional content

3. **Delivery Methods**
   - Real-time WebSocket delivery for immediate notifications
   - Email delivery for important notifications
   - Push notifications for mobile devices
   - In-app notification center for historical notifications
   - Persistent storage for offline viewing

4. **Notification Management**
   - Marking notifications as read/unread
   - Bulk operations for notification management
   - Automatic cleanup of old notifications
   - User preferences for notification settings

#### Frontend Implementation

1. **NotificationService** (`/shared/api-client/src/notification/notification.service.ts`)
   - Core service for managing notifications
   - RxJS-based observable for notification updates
   - Integration with WebSocket for real-time updates
   - Local storage for notification persistence
   - Methods for notification management (read, seen, delete)

2. **NotificationStore** (`/shared/api-client/src/notification/notification-store.ts`)
   - Persistent storage for notifications
   - Cache management for notification data
   - Synchronization with backend storage
   - Automatic cleanup of old notifications

3. **Notification Components**
   - Notification center for viewing all notifications
   - Toast notifications for immediate alerts
   - Badge indicators for unread notification counts
   - Detail views for notification content
   - Action buttons for notification interactions

### Notification Features

1. **Real-time Delivery**
   - Immediate delivery of new notifications
   - Automatic UI updates when new notifications arrive
   - Offline queueing for notifications during disconnections

2. **Categorization**
   - Visual differentiation by notification type
   - Filtering options by category
   - Priority levels for importance

3. **Action Support**
   - Interactive buttons within notifications
   - Deep linking to relevant application sections
   - Custom actions based on notification type

4. **Personalization**
   - User preference settings for notification types
   - Notification frequency controls
   - Quiet hours and do-not-disturb settings

5. **Analytics**
   - Tracking of notification engagement
   - Metrics for delivery success rates
   - Analysis of user response patterns

### Security Considerations

1. **Data Privacy**
   - User-specific notifications are only delivered to the intended recipient
   - Sensitive information is obfuscated in notification content
   - Permission-based access to notification history

2. **Authentication**
   - Secure WebSocket connections for real-time delivery
   - Authentication required for accessing notification history
   - Token-based validation for notification actions

3. **Rate Limiting**
   - Protection against notification flooding
   - Throttling for high-frequency notification sources
   - Batching of notifications when appropriate

## SHAHI Coin Minting System

### System Overview

The SHAHI Coin system is an ERC-20 token implementation with unique features designed for the AliveHuman ecosystem:
- First-time minting: Users can mint tokens once after account verification
- Annual minting: Users can mint additional tokens once per year
- Staking system: Different lock periods offer variable APY rewards
- Security features: Device binding, fraud prevention, and expiration mechanisms
- Token economics: Controlled burn rate and supply management

### Smart Contract Components

1. **`/backend/src/blockchain/contracts/SHAHICoin.sol`**
   - ERC20 implementation of the SHAHI token with UUPS upgradeable pattern
   - Implements first-time minting with Merkle proof verification (whitelist)
   - Annual minting with secure signature verification
   - Staking system with tiered APY rewards based on lock periods
   - Advanced security features including:
     - Transaction burn rate (0.01%)
     - Blacklisting mechanism
     - Token expiration and burning
     - Device-binding for anti-fraud measures
   - Events for real-time monitoring of token activities
   - Comprehensive admin functions for platform management

2. **`/backend/src/blockchain/contracts/SHAHIStorage.sol`**
   - Storage contract for SHAHI token supporting upgradeable pattern
   - Separate storage layout prevents collisions during contract upgrades
   - Stores user minting records (timestamps, amount minted)
   - Contains staking system data structures with position tracking
   - Security mappings for authorized minters and blacklisted addresses
   - App contract authorization for ecosystem integration
   - Token gating functionality for NFT-based benefits

3. **`/backend/src/blockchain/contracts/abis/SHAHICoin.ts`**
   - TypeScript interface for interacting with the SHAHI contract
   - Includes minting functions, view functions, and event definitions
   - Provides strongly-typed method signatures for contract interaction
   - Supports both first-time and annual minting functions
   - Includes balance checking and token statistics methods

### Backend Service Components

1. **`/backend/src/blockchain/services/shahi-token.service.ts`**
   - Core service for interacting with the SHAHI contract
   - Initializes connection to the blockchain using HotWallet
   - Connects to the SHAHI contract using ethers.js
   - Implements signature generation for secure minting
   - Provides methods for both first-time and annual minting
   - Monitors token balances and statistics
   - Sets up event listeners for minting and expiration events
   - Implements token expiration handling and burning

2. **`/backend/src/blockchain/services/merkle.service.ts`**
   - Generates and manages Merkle trees for secure user verification
   - Pulls verified users from database to create dynamic whitelist
   - Generates Merkle root to be set in the smart contract
   - Creates and verifies Merkle proofs for secure minting eligibility
   - Updates Merkle tree when new users get verified
   - Ensures secure verification without storing sensitive data on-chain

3. **`/backend/src/blockchain/services/minting.service.ts`**
   - High-level service that orchestrates the minting process
   - Integrates device detection for anti-fraud measures
   - Coordinates between user requests and token service
   - Verifies user eligibility via Merkle proofs
   - Processes both first-time and annual minting requests
   - Routes minting requests to the token service with proper security checks

### Controllers and API Endpoints

1. **`/backend/src/blockchain/controllers/minting.controller.ts`**
   - Exposes REST API endpoints for token minting
   - Implements JWT authentication for secure access
   - Enforces rate limiting for minting requests
   - Provides endpoints for both first-time and annual minting
   - Extracts device information for security binding
   - Captures IP address for fraud prevention
   - Returns transaction hashes for client-side monitoring

### Scheduled Tasks

1. **`/backend/src/blockchain/tasks/token-expiry.task.ts`**
   - Scheduled NestJS task running at midnight daily
   - Checks all user wallets for expired SHAHI tokens
   - Calls the burnExpiredTokens function on the contract
   - Implements error handling and logging for failed operations
   - Maintains token supply dynamics through systematic burning
   - Integrates with the TypeORM repository to get all wallet addresses

### Integration Components

1. **`/backend/src/blockchain/gateways/token-events.gateway.ts`**
   - WebSocket gateway for real-time token event notifications
   - Implements secure authentication for WebSocket connections
   - Listens for events from the token service
   - Broadcasts minting events to connected clients
   - Notifies users about token expiration events
   - Creates a namespace for token-specific events

2. **`/backend/src/blockchain/blockchain.module.ts`**
   - NestJS module that ties together all blockchain components
   - Imports and configures TypeORM repositories
   - Registers all services as providers
   - Configures event emitter for token notifications
   - Sets up scheduled tasks for token management
   - Exports services for use in other modules

3. **`/backend/src/auth/guards/ws-auth.guard.ts`**
   - WebSocket authentication guard for secure WebSocket connections
   - Validates JWT tokens for real-time event subscriptions
   - Rejects unauthorized connection attempts
   - Adds user information to WebSocket connection context

### Security Considerations

1. **Device Binding**
   - Each minting operation is tied to a specific device through device fingerprinting
   - Device IDs are generated based on user agent and IP address
   - Prevents users from claiming multiple tokens from different devices
   - Stored on-chain as a hashed value to prevent replay attacks

2. **Merkle Proof Verification**
   - First-time minting requires a valid Merkle proof
   - Only verified users in the Merkle tree can mint tokens
   - Admin can update the Merkle root to add new eligible users
   - Cryptographically secure verification without exposing user lists

3. **Signature Verification**
   - Annual minting requires a valid signature from an authorized minter
   - Signatures include user address, device ID, and timestamp
   - Prevents forgery and unauthorized minting attempts
   - Signatures are verified on-chain for maximum security

4. **Rate Limiting**
   - API endpoints implement rate limiting to prevent abuse
   - Limits are configured per user and IP address
   - Flexible rate limiting parameters controllable via environment variables
   - Helps prevent denial-of-service attacks on the minting system

5. **Token Expiration**
   - Minted tokens expire after one year if not used in the ecosystem
   - Daily scheduled task checks and burns expired tokens
   - Maintains healthy token economics and circulation
   - Encourages active participation in the ecosystem

## Diary System

### System Overview

The Diary system provides authenticated users with a personal journal feature integrated with the AliveHuman platform:

- **User-specific diary entries**: Each diary entry is linked to a specific user
- **Location tagging**: Entries can be tagged with specific in-game locations
- **Emotion tracking**: Users can record their feelings with each entry
- **Game progress**: Track game level at the time of entry creation
- **Rich content**: Support for HTML formatted content
- **Media attachments**: Optional support for audio and video recordings
- **Custom appearance**: Color coding for visual organization

### Entity Models

1. **`/backend/src/diary/entities/diary.entity.ts`**
   - Core entity model for diary entries with the following fields:
     - `id`: Unique UUID identifier for each diary entry
     - `title`: The title of the diary entry
     - `content`: HTML content with rich text formatting
     - `createdAt`: Timestamp when the entry was created
     - `updatedAt`: Timestamp when the entry was last updated
     - `userId`: Foreign key linking to the user who created the entry
     - `user`: Relationship to the User entity
     - `location`: Enum value representing an in-game location
     - `feeling`: String representing user's emotional state
     - `gameLevel`: Numeric field for tracking in-game progress
     - `color`: Hex color code for visual customization
     - `hasMedia`: Boolean flag indicating if media is attached
     - `isStoredLocally`: Indicates if media is stored on the client or server
   - Implements cascade deletion when a user is removed
   - Uses TypeORM decorators for database schema definition
   - Contains enum definition for predefined location values

### Data Transfer Objects

1. **`/backend/src/diary/dto/diary.dto.ts`**
   - Defines structured data objects for diary operations:
     - `CreateDiaryDto`: Validation rules for creating new diary entries
     - `UpdateDiaryDto`: Partial DTO for updating existing entries
     - `DiaryResponseDto`: Standardized response format for diary data
   - Implements class-validator decorations for automatic input validation
   - Uses Swagger decorators for API documentation
   - Includes proper typing for nested objects and optional fields

### Service Implementation

1. **`/backend/src/diary/services/diary.service.ts`**
   - Core service that implements diary business logic:
     - `create(userId, createDiaryDto)`: Creates new diary entries
     - `findAll(userId)`: Returns all diary entries for a specific user
     - `findOne(id, userId)`: Gets a specific diary entry by ID
     - `update(id, userId, updateDiaryDto)`: Updates an existing entry
     - `remove(id, userId)`: Deletes a diary entry
     - `addDiaryLocation(name)`: Admin-only method to add new locations
   - Implements proper error handling with HTTP exceptions
   - Enforces ownership validation on all operations
   - Uses TypeORM repository for data access
   - Provides transaction support for complex operations
   - Implements security checks to prevent unauthorized access

### Controller and API Endpoints

1. **`/backend/src/diary/controllers/diary.controller.ts`**
   - RESTful API controller with the following endpoints:
     - `POST /diary`: Create a new diary entry
     - `GET /diary`: Get all diary entries for the current user
     - `GET /diary/:id`: Get a specific diary entry by ID
     - `PUT /diary/:id`: Update a diary entry
     - `DELETE /diary/:id`: Delete a diary entry
     - `POST /diary/locations/add`: Admin endpoint to add new locations
     - `GET /diary/locations/list`: Get all available diary locations
   - Uses JWT authentication guard to protect all endpoints
   - Implements proper request validation
   - Returns standardized response objects
   - Includes comprehensive Swagger API documentation
   - Extracts user ID from JWT token for ownership validation

### Module Configuration

1. **`/backend/src/diary/diary.module.ts`**
   - NestJS module that configures the diary system:
     - Imports TypeORM features for the Diary entity
     - Registers DiaryController and DiaryService
     - Exports DiaryService for use in other modules
   - Sets up dependency injection for required services
   - Configures repository for database operations

### Database Migration

1. **`/backend/create-diary-table.sql`**
   - SQL migration script for creating the diary table:
     - Defines table schema with all required columns
     - Sets up foreign key relationship to the users table
     - Adds appropriate indexes for query optimization
     - Creates constraints for data integrity

### Security Considerations

1. **User Ownership**
   - Each diary entry is linked to a specific user through the `userId` field
   - All service methods verify that the current user is the owner of the entry
   - Unauthorized access attempts are prevented with authentication guards
   - Proper error handling prevents information disclosure

2. **Media Security**
   - Option for client-side only storage of sensitive media
   - Encrypted storage for server-side media
   - User-controlled media attachment settings

3. **Input Validation**
   - Comprehensive validation for all input fields
   - HTML sanitization to prevent XSS attacks
   - Size limits on content fields to prevent abuse

## Security Architecture

### Device Management Security System

The project implements a sophisticated device management security system to enforce strict device-wallet binding policies, preventing fraud and unauthorized access:

**`/backend/src/users/entities/user-device.entity.ts`**
- Database entity model for tracking user devices
- Stores device fingerprinting data including:
  - Device IDs (unique identifiers for each device)
  - Hardware information (brand, model, platform, OS)
  - Browser details (name, version)
  - IP address tracking for security auditing
  - Visit count and usage patterns
  - First seen and last seen timestamps
- Implements wallet address binding through JSON storage
- Built-in methods for managing wallet associations
- Relational mapping to user accounts with cascade deletion

**`/backend/src/users/services/user-devices.service.ts`**
- Core service implementing device security policies
- Enforces the one-device-one-wallet policy with multiple verification layers:
  - Device registration and tracking
  - Wallet address binding to specific devices
  - Cross-validation of device-wallet associations
  - IP address monitoring for suspicious activity
- Advanced device registration workflow:
  - Device fingerprinting and identification
  - Secure registration with fraud prevention
  - Device history tracking with timestamps
  - Automatic detection of multiple account attempts
- Policy enforcement methods:
  - `validateDeviceWalletPairing()` - Verifies if a wallet can be used with a specific device
  - `enforcedDeviceWalletPolicy()` - Strict policy enforcement for one-device-one-wallet rule
  - `addWalletToDevice()` - Securely binds a wallet address to a specific device
  - `isDeviceWalletCombinationRegistered()` - Checks existing registrations
- Security troubleshooting tools:
  - `resetDeviceAssociations()` - Administrative function to reset device bindings when needed
  - Comprehensive error handling and logging for security auditing
  - Fallback mechanisms to ensure authentication continuity during system problems
- Configurable security through environment variables:
  - Optional relaxation of device checks during testing via `SKIP_DEVICE_CHECK`
  - Detailed logging of security-related operations for audit trails
  - Circuit breakers to prevent database access failures from blocking authentication

### Wallet Authentication Security

## HotWallet Implementation Status

### Partially Implemented (80%)
1. **Monitoring Service**
   - Real-time balance monitoring
   - Event-based notifications
   - Missing: Robust reconnection strategies for WebSockets

2. **Custom Path Support**
   - Good implementation for EVM chains
   - Missing: Complete Solana custom path implementation

### To Complete for 100%
1. **NFTService.js**
   - Complete API integrations for production
   - Add metrics collection and performance tracking
   - Improve error handling for API rate limits

2. **TransactionHistoryService.ts**
   - Complete the `_getExplorerApiUrl` and `_getExplorerApiKey` methods
   - Implement the `_getCovalentChainId` method
   - Add proper pagination support

3. **MonitoringService.ts**
   - Enhance WebSocket reconnection logic
   - Add more robust error handling for provider failures

4. **Documentation**
   - Add TSDoc/JSDoc for all methods
   - Create comprehensive developer guide

### Completed Components (100%)
1. **Core Architecture**
   - HotWallet main class (index.js)
   - WalletManager for key management
   - Chain handlers for multi-chain support
   - Proper encryption for private keys
   - Clean interfaces and error handling

2. **Security Features**
   - AES-256-CBC encryption for private keys
   - Memory wiping for sensitive data
   - Circuit breaker pattern for resilience
   - Rate limiting for API protection

3. **Basic Functionality**
   - Multi-chain wallet creation and import
   - Balance checking for native currencies
   - Transaction creation and sending
   - Gas estimation and optimization

4. **Testing**
   - Comprehensive test suite with all tests passing
   - Proper mocking of blockchain providers
   - Coverage of error scenarios

### Mostly Complete Components (90%)
1. **Token Support**
   - Basic ERC20/BEP20 token transfers
   - Token balance checking
   - Token metadata retrieval
   - Missing: Comprehensive token listing service

2. **NFT Support**
   - NFT metadata retrieval
   - NFT transfers (ERC721 and ERC1155)
   - NFT ownership checking
   - Missing: Complete NFT marketplace integration

3. **Transaction History**
   - Basic transaction retrieval
   - Missing: Comprehensive pagination and filtering

## Database Setup

**PostgreSQL Configuration**
- The project uses PostgreSQL as the primary database
- Database name: `Alive-Db`
- Username: `Aliveadmin`
- Password: Stored in environment variables
- Default port: 5432
- Migrations are handled through TypeORM
- Database schema includes tables for users, wallets, NFTs, tokens, referrals, and transactions
- Connections are pooled with a maximum of 10 connections

**Test Environment Database**
- Uses in-memory SQLite for fast test execution
- Automatically creates and tears down database for each test run
- Implements all entity relationships and constraints for complete testing

## Environment Configuration

**`/.env`**
- Root environment file with database connection details and application settings
- Contains `DATABASE_URL` connection string for PostgreSQL
- Format: `postgresql://username:password@hostname:port/database_name`

**`/backend/.env.development`**
- Backend-specific environment variables for development
- Includes database credentials, JWT secret, and blockchain RPC URL

**`/backend/.env.test`**
- Test-specific environment variables
- Configures in-memory database and mock services

**`/backend/src/blockchain/hotwallet/.env`**
- Environment variables specific to the hot wallet system
- Contains RPC URLs for different blockchains
- Configures security settings and rate limits
- Sets balance limits for different cryptocurrencies

## Backend (NestJS)

**`/backend/src/main.ts`**
- Entry point for the NestJS application
- Configures middleware, CORS, security features, and Swagger API documentation

**`/backend/src/app/app.module.ts`**
- Root module that imports and organizes all other modules
- Configures database connection and environment variables
- Includes imports for UsersModule, AuthModule, WalletsModule, ReferralModule, NftModule, MailModule, and SharedModule
- Provides configuration for TypeORM database connection

**`/backend/src/swagger.config.ts`**
- Dedicated file for defining and exporting Swagger configuration
- Simplifies maintenance by separating main application bootstrap from API documentation settings

### Authentication System

**`/backend/src/auth/auth.module.ts`**
- Core authentication module that integrates JWT, Passport strategies
- Manages user authentication flows and token generation
- Imports SharedModule for device detection and security features
- Registers both traditional and wallet-based authentication controllers

**`/backend/src/auth/auth.service.ts`**
- Handles authentication business logic including:
  - Login with email/password
  - Registration with fraud prevention
  - Wallet-based authentication with secure challenge-response pattern
  - Password reset flow
  - Email verification
  - Tracks device IDs, IP addresses, and user agents
  - Enforces one-device-one-wallet policy
  - Session management with token rotation
  - Rate limiting for registrations from the same IP

**`/backend/src/auth/auth.controller.ts`**
- REST API endpoints for traditional authentication:
  - /auth/register - Create new user accounts
  - /auth/login - Traditional email/password authentication
  - /auth/forgot-password & /auth/reset-password - Password recovery flow
  - /auth/verify-email - Email verification

**`/backend/src/auth/controllers/wallet-auth.controller.ts`**
- Specialized controller for wallet-based authentication with two dedicated endpoints:
  - POST /auth/wallet/connect - First step that generates a challenge
  - POST /auth/wallet/authenticate - Second step that verifies signature and authenticates

**`/backend/src/auth/dto/wallet-login.dto.ts`**
- Data transfer object for wallet authentication
- Includes wallet address, challenge message, signature, and optional email
- Uses class-validator for input validation

**`/backend/src/auth/dto/wallet-connect-response.dto.ts`**
- DTO for the response from wallet connection endpoint
- Contains a challenge string and a flag indicating if the wallet exists

**`/backend/src/auth/strategies/`**
- Authentication strategies using Passport:
  - jwt.strategy.ts - Token-based authentication
  - local.strategy.ts - Username/password authentication
  - wallet.strategy.ts - Blockchain wallet signature verification

**`/backend/src/auth/entities/refresh-token.entity.ts`**
- Database entity for storing refresh tokens
- Links tokens to user accounts
- Handles token expiration and revocation

### User Management

**`/backend/src/users/entities/user.entity.ts`**
- Database entity model for users
- Defines user properties and relations to wallets, devices, and sessions
- Includes roles (admin, user, moderator) for access control
- Tracks last login time and IP address
- Supports nullable email for wallet-only authentication
- Contains walletAddress field for direct blockchain address association

**`/backend/src/users/users.service.ts`**
- User data management and CRUD operations
- Methods for finding and updating user information

**`/backend/src/users/users.controller.ts`**
- REST API endpoints for user management
- Role-based access control for admin functions

**`/backend/src/users/entities/user-device.entity.ts`**
- Tracks device information for security purposes
- Stores hardware IDs, device types, operating systems, browsers
- Records first and last seen timestamps
- Monitors usage patterns
- Ensures one-to-one relationship between devices and wallets

**`/backend/src/users/entities/user-session.entity.ts`**
- Records user session information
- Tracks session duration, IP address, and device
- Stores authentication tokens
  - Monitors session expiration

**`/backend/src/users/services/user-devices.service.ts`**
- Manages user device data
- Enforces exclusive device-wallet binding
- Tracks device usage statistics
- Provides device verification methods

**`/backend/src/users/services/user-sessions.service.ts`**
- Manages user sessions
- Handles session expiration and cleanup
- Provides methods for ending sessions
- Enforces session security policies

### Wallet Management

**`/backend/src/wallets/entities/wallet.entity.ts`**
- Database entity model for blockchain wallets
- Defines relationship between wallets and users (ManyToOne)
- Stores wallet address and balance
- Supports cascade deletion when users are removed

**`/backend/src/wallets/wallets.service.ts`**
- Service for wallet-related operations
- Provides methods for querying user wallets
- Supports wallet balance updates

**`/backend/src/wallets/wallets.controller.ts`**
- REST API endpoints for wallet management
- Allows querying wallets by user

### Blockchain Integration

**`/backend/src/blockchain/blockchain.module.ts`**
- Core module for blockchain integration
- Configures blockchain services and providers
- Imports required dependencies for wallet management and smart contract interaction

**`/backend/src/blockchain/blockchain.service.ts`**
- Main service for blockchain operations
- Handles connection to blockchain networks
- Manages transaction signing and submission
  - Provides methods for interacting with smart contracts

**`/backend/src/blockchain/contracts/`**
- Contains smart contract files (.sol)
- Includes compiled contract ABIs
- Stores contract deployment information

**`/backend/src/blockchain/hotwallet/`**
- Comprehensive hot wallet implementation for backend operations with the following components:
  
  **`index.js`**
  - Main entry point that exports HotWallet class
  - Provides high-level interface for wallet operations
  - Initializes wallet manager and services
  - Offers methods for wallet creation, import, and management
  
  **`WalletManager.js`**
  - Core class for wallet generation, import, and management
  - Creates deterministic wallets from mnemonic phrases
  - Handles secure private key storage with encryption
  - Manages wallet collections with proper sanitization
  - Integrates with ChainHandlers for multi-chain support
  
  **`services/BalanceService.js`**
  - Queries balances across multiple blockchain networks
  - Handles both native currency and token balances
  - Provides methods for getting aggregated wallet balances
  - Error handling with fallbacks for API failures
  
  **`services/TransactionService.js`**
  - Creates and broadcasts transactions across chains
  - Supports native currency and token transfers
  - Implements gas estimation and fee management
  - Handles transaction signing with proper key security
  - Provides methods for different blockchains (EVM, Solana, Bitcoin)
  
  **`services/GasService.js`**
  - Provides gas price estimation across multiple chains
  - Supports EIP-1559 transaction types with maxFeePerGas and maxPriorityFeePerGas
  - Offers priority level selection (slow, medium, fast, urgent)
  - Calculates gas costs in both wei and native currency units
  - Handles gas limit estimation with safety buffers
  
  **`services/NFTService.js`**
  - Manages NFT operations across multiple chains
  - Supports both ERC-721 and ERC-1155 standards
  - Handles NFT metadata retrieval and formatting
  - Provides NFT ownership verification
  - Implements NFT transfer functionality with proper security checks
  - Supports batch transfers for efficient operations
  
  **`services/MonitoringService.ts`**
  - Real-time balance and transaction monitoring
  - Emits events for balance changes across multiple chains
  - Tracks pending and confirmed transactions
  - Monitors NFT transfers and ownership changes
  - Provides subscription-based monitoring with event emitters
  
  **`services/HistoryService.js`**
  - Retrieves and formats transaction history
  - Tracks token transfers across different chains
  - Monitors NFT activity and ownership changes
  - Provides pending transaction tracking and notifications
  - Supports pagination and filtering of transaction data
  
  **`config.js`**
  - Centralized configuration for RPC endpoints
  - Security settings for key encryption
  - Gas and fee presets for different networks
  - Token configurations for multi-chain support
  
  **`utils/encryption.js`**
  - Implements AES-256-CBC encryption for private keys
  - Provides secure key derivation from passphrases
  - Handles initialization vectors for enhanced security
  - Implements memory wiping for sensitive cryptographic material
  
  **`utils/errors.js`**
  - Custom error classes for specialized blockchain error handling
  - Includes classes for transaction errors, simulation failures, and insufficient balance
  - Provides consistent error formatting with codes and detailed messages
  - Helps with precise error identification for better UX
  
  **`handlers/ChainHandlers.js`**
  - Implements network-specific handlers for different blockchains
  - Manages connections to RPC endpoints with connection pooling
  - Provides unified interfaces for cross-chain operations
  - Handles token contracts for ERC20/BEP20 operations
  - Implements WebSocket providers for real-time data
  - Provides transaction simulation capabilities
  - Supports advanced transaction types (EIP-1559, token transfers, NFTs)
  - Handles wallet derivation across multiple chains

**`/backend/src/blockchain/services/`**
- Specialized blockchain services
- Includes token services for ERC20 interactions
- NFT services for ERC721/ERC1155 operations
- Gas estimation and fee management
- Wallet compatibility services for Trust Wallet and Metamask integration
- NFT marketplace integration services

**`/backend/src/blockchain/dto/`**
- Data transfer objects for blockchain operations
- Defines structures for transaction requests and responses
- Includes validation rules for blockchain operations
- NFT metadata and transfer DTOs
- Gas estimation request/response objects
- Token transfer data structures

**`/backend/src/blockchain/interfaces/`**
- TypeScript interfaces for blockchain data
- Contract event definitions
- Transaction type definitions
- Wallet configuration interfaces
  - NFT metadata and collection interfaces
  - Gas pricing models for different chains
  - Transaction monitoring event interfaces

### NFT Integration

**`/backend/src/nft/nft.module.ts`**
- Core module for NFT functionality
- Imports blockchain services for NFT operations
- Configures NFT-specific services and controllers

**`/backend/src/nft/nft.service.ts`**
- Service for NFT-related operations
- Handles NFT minting, transfers, and metadata operations
- Integrates with blockchain for on-chain operations
- Manages NFT collections and ownership records

**`/backend/src/nft/nft.controller.ts`**
- REST API endpoints for NFT operations
- Endpoints for minting, transferring, and querying NFTs
- Supports metadata operations and collection management
- Implements proper authorization for NFT operations

**`/backend/src/nft/entities/nft.entity.ts`**
- Database entity model for NFTs
- Stores NFT metadata, owner information, and transaction history
- Links to blockchain records with transaction hashes
  - Tracks NFT status and history

**`/backend/src/nft/entities/nft-collection.entity.ts`**
- Database entity for NFT collections
- Defines collection properties including name, symbol, and contract address
- Manages relationships between collections and individual NFTs
- Tracks collection statistics like floor price and volume

**`/backend/src/nft/services/nft-metadata.service.ts`**
- Handles NFT metadata operations
- Supports IPFS integration for decentralized metadata storage
- Processes metadata updates and validation
- Ensures compliance with metadata standards

### Shared Services

**`/backend/src/shared/shared.module.ts`**
- Module containing services shared across the application
- Provides common utilities and helpers

**`/backend/src/shared/services/device-detector.service.ts`**
- Service for detecting and identifying devices
- Generates unique device IDs based on user agent and IP
  - Analyzes browser and operating system information
  - Creates consistent hardware fingerprints for security

**`/backend/src/shared/utils/debug-logger.util.ts`**
- Enhanced logger with request tracing capabilities
- Provides sanitized logging for sensitive data
- Supports API request tracking with method and path
- Configurable debug output based on environment

### Security Features

**`/backend/src/migrations/1714386000000-AddSecurityTables.ts`**
- Migration for setting up security-related database tables
- Creates tables for user devices and sessions
- Adds security columns to user table

### Referral & Airdrop System

**`/backend/src/referral/referral.module.ts`**
- Module for referral and airdrop functionality
- Imports TypeORM entities and registers providers
- Exports ReferralService for use in other modules

**`/backend/src/referral/referral.service.ts`**
- Manages secure referral code generation with collision detection
- Processes and validates referrals between users
- Performs security checks to prevent self-referrals and duplicate usage
- Tracks referral usage statistics and provides detailed analytics
- Implements reward claiming functionality for successful referrals
- Supports activation and deactivation of referral codes
- Planned integration with blockchain services for token distribution

**`/backend/src/referral/entities/referral.entity.ts`** and **`/backend/src/referral/entities/referral-code.entity.ts`**
- Database models for referral codes and referral usage tracking
- Tracks referrer and referred relationships
- Records referral usage statistics and timestamps
- Manages reward claimed status for each referral
- Supports usage limitations and expiration logic

**`/backend/src/referral/referral.controller.ts`**
- REST API endpoints with Swagger documentation
- Endpoints for generating referral codes
- Validating existing referral codes
- Claiming referral rewards
- Retrieving referral statistics for users
- Managing referral code activation status

### Testing Infrastructure

**`/backend/src/__tests__/setup.ts`**
- Global test setup and teardown
- Configures test environment and database connections
- Manages application lifecycle during tests

**`/backend/src/__tests__/test.module.ts`**
- Test module configuration 
- Provides mock implementations of services
- Configures in-memory database for tests

**`/backend/src/__tests__/referral.controller.spec.ts`**
- Comprehensive tests for the referral controller
- Verifies all API endpoints for referral functionality
- Tests code generation, validation, stats retrieval, and reward claiming
- Mock service implementation for isolated controller testing

**`/backend/src/__tests__/referral.service.spec.ts`**
- Thorough tests for the referral service
- Tests referral code generation and uniqueness
- Tests referral validation including security checks
- Verifies reward claiming functionality
- Tests statistics gathering for referrals
- 100% coverage of error cases and edge conditions

**`/backend/src/__tests__/blockchain/hotwallet.spec.ts`**
- Comprehensive tests for the hot wallet implementation
- Tests wallet creation and import functionality
- Tests balance retrieval across multiple networks
- Tests encryption and key management
- Ensures proper transaction handling is implemented
- Tests transaction simulation and gas optimization features
- Verifies NFT support across different standards (ERC-721, ERC-1155)
- Tests multi-chain wallet compatibility (ETH, BNB, MATIC, SOL)
- Validates Trust Wallet compatibility
- Tests transaction history and balance monitoring features
- Verifies error handling for various blockchain scenarios
- Mocks blockchain providers to avoid real network calls
- Simulates network conditions and transaction failures
- Ensures proper memory management for WebSocket connections
- Verifies cross-chain compatibility of the wallet system

**`/backend/src/__tests__/blockchain/hotwallet-basic.spec.ts`**
- Simple tests for hot wallet configuration
- Verifies core functionality without complex mocking
- Acts as a smoke test for basic hot wallet operations

**`/backend/src/__tests__/blockchain/mock-providers.ts`**
- TypeScript implementation of mock blockchain providers
- Simulates blockchain node responses without network calls
- Provides consistent test behavior for blockchain operations

**`/backend/src/__tests__/blockchain/nft.spec.ts`**
- Tests NFT service functionality
- Verifies metadata retrieval and ownership checking
- Tests marketplace integration for NFT trading
- Covers batch operations and ERC1155 support
- Mocks blockchain providers and contract interactions
- Validates error handling and performance tracking

**`/backend/src/__tests__/basic.spec.ts`**
- Simple smoke test that verifies NestJS application initialization
- Avoids database connectivity for faster testing
- Successfully tests environment configuration and app bootstrapping

**`/backend/src/__tests__/minimal.spec.ts`**
- Minimal test implementation with no database dependencies
- Verifies core application functionality in isolation
- Provides fast feedback on application structure integrity

**`/backend/src/__tests__/api.spec.ts`**
- API integration tests
- Tests HTTP endpoints with supertest
- Verifies proper API responses and error handling

**`/backend/src/__tests__/integration.spec.ts`**
- End-to-end workflow tests
- Tests complete user journeys through the application
- Verifies business logic across multiple components

**`/backend/src/__tests__/auth/auth.spec.ts`**
- Authentication-specific test suite
- Covers registration, login, and validation functionality
- Tests both successful and error scenarios

**`/backend/jest.config.js`** and **`/backend/jest.config.ts`**
- Jest testing framework configuration
- Configures TypeScript support and test environment
- Sets up code coverage reporting
- Handles ESM module support for modern JavaScript

## Frontend (Next.js)

**`/frontend/next.config.js`**
- Next.js configuration
- Sets up internationalization, image domains, and API routing

**`/frontend/next-i18next.config.js`**
- Internationalization configuration
- Defines supported languages and default locale

**`/frontend/src/pages/_app.tsx`**
- Main application component for Next.js
- Sets up providers for authentication, blockchain, and UI framework

**`/frontend/src/services/api/`**
- Implementation of the shared API client for the Next.js frontend
- Organizes API services into domain-specific modules
- Includes optimized clients for performance enhancements
- Implements security features like device fingerprinting and encryption

**`/frontend/src/services/api/index.ts`**
- Main entry point for the API client
- Exports all service modules and client instances
- Configures global API settings and interceptors

**`/frontend/src/services/wallet-auth.service.ts`**
- Implements wallet authentication flow on frontend side
- Handles wallet connection with MetaMask and other providers
- Manages the two-step authentication process:
  1. Connects wallet and retrieves challenge from backend
  2. Signs challenge and submits signature for verification
- Optional email integration with wallet authentication
- Handles disconnection and event listeners for wallet changes
- Manages access token storage and cleanup

## Mobile (React Native)

**`/mobile/App.tsx`**
- Root component for the React Native application
- Sets up providers for authentication, blockchain, navigation, and theming

**`/mobile/src/services/api/`**
- Mobile-optimized implementation of the shared API client
- Special focus on offline support and memory management
- Adapts websocket connections for mobile environments
- Implements platform-specific security features

**`/mobile/src/config/environment.ts`**
- Environment configuration for mobile app
- Provides environment-specific API endpoints and settings

## Admin Panel

**`/admin/src/pages/index.tsx`**
- Dashboard component for the admin panel
- Displays statistics, charts, and tables for platform management

**`/admin/src/services/api/`**
- Admin-specific implementation of the shared API client
- Includes enhanced security for administrative operations
- Implements role-based access control for API calls
- Uses monitoring features for administrative audit trails

## Shared Libraries

**`/shared/api-client/src/index.ts`**
- Shared API client used by all applications
- Sets up request/response interceptors and authentication handling
- Consolidates core functionality for frontend, mobile, and admin panel
- Provides consistent interface and type definitions across platforms

### WebSocket Client Architecture

**`/frontend/src/services/websocket-manager.ts`**
- Core WebSocket connection manager that:
  - Handles WebSocket lifecycle (connect, disconnect, reconnect)
  - Manages authentication with JWT tokens
  - Implements automatic reconnection with exponential backoff
  - Provides connection status monitoring and callbacks
  - Manages message subscriptions by channel/type
  - Handles message queuing during disconnections
  - Implements health checking through ping/pong

**`/frontend/src/services/api/realtime-service.ts`**
- Higher-level real-time service that:
  - Provides domain-specific subscription methods
  - Implements strongly-typed event handlers
  - Abstracts WebSocket complexity from components
  - Exposes specific methods for each notification type:
    - `subscribeToBalanceChanges`
    - `subscribeToNftTransfers`
    - `subscribeToTokenPrice`
    - `subscribeToStakingUpdates`
    - `subscribeToNotifications`

**`/frontend/src/components/WebSocketStatus.tsx`**
- UI component for displaying WebSocket connection status
- Provides visual indicators for connection states:
  - Connected (green)
  - Connecting (blue)
  - Reconnecting (yellow)
  - Error (red)
  - Disconnected (gray)
- Offers both minimal (dot-only) and detailed display modes

**`/frontend/src/types/api-types.ts`**
- TypeScript interfaces for WebSocket events:
  - `BalanceChangeEvent`
  - `NftTransferEvent`
  - `TokenPriceEvent`
  - `StakingUpdateEvent`
  - `NotificationEvent`
  - `WebSocketAuthEvent`
  - `WebSocketConnectionEvent`

**`/frontend/src/pages/real-time-demo.tsx`**
- Comprehensive demonstration page showing:
  - Connection status monitoring
  - Connection/disconnection controls
  - Real-time notification display
  - Wallet balance monitoring
  - NFT transfer monitoring
  - Testing instructions

**WebSocket Integration Components**
1. **NotificationsPanel**
   - Real-time notification display component
   - Shows system notifications by category (success, warning, error, info)
   - Timestamps and organizes notifications chronologically
   - Provides visual styling based on notification type

2. **WalletBalanceMonitor**
   - Real-time wallet balance tracking component
   - Displays balance changes with increase/decrease indicators
   - Shows transaction history from balance change events
   - Formats amounts for human readability

3. **NFTTransferMonitor**
   - Real-time NFT transfer tracking component
   - Displays sent and received NFTs with metadata
   - Shows transaction details and timestamps
   - Provides links to blockchain explorers

## DevOps and Configuration

**`/package.json`**
- Root workspace configuration
- Defines scripts for development, building, and testing all projects

**`/docker-compose.yml`**
- Docker services configuration
- Sets up containers for PostgreSQL, backend, frontend, admin, and NGINX

**`/docker/nginx/conf.d/default.conf`**
- NGINX configuration
- Handles domain routing for alivehuman.com and app.alivehuman.com

**`/.github/workflows/ci-cd.yml`**
- CI/CD pipeline configuration
- Defines testing, building, and deployment workflows for GitHub Actions

## Recent Improvements

### Testing Architecture
- Implemented comprehensive testing infrastructure with Jest and TypeScript
- Created mock providers for blockchain interactions to avoid real network calls
- Added memory management to prevent leaks from WebSocket connections
- Unified test setup to improve reliability and reduce flakiness
- Fixed TypeScript errors in test files using proper typing and ESM imports

### Hot Wallet Implementation
- Implemented secure hot wallet system with multi-chain support
- Added encryption for private keys using AES-256-CBC
- Implemented robust error handling and retry mechanisms for RPC connections
- Created WebSocket providers for real-time blockchain data access
- Enhanced token support for ERC20, BEP20 and other token standards
- Ensured proper memory wiping for sensitive cryptographic material
- Added comprehensive test coverage for all wallet functionality

### Security Enhancements
- Enhanced session management with proper cleanup
- Added secure device tracking for multi-device scenarios
- Improved RPC endpoint management with fallbacks
- Updated test configurations to prevent database corruption
- Enhanced error handling to prevent information leakage

### SHAHI Token System Enhancement
- Implemented comprehensive smart contract with upgradeable pattern
- Added tiered staking system with variable APY based on lock period
- Created secure minting mechanism with device binding and signature verification
- Implemented Merkle tree-based verification for first-time minting eligibility
- Added token expiration with automatic burning mechanism
- Implemented real-time WebSocket notifications for token events
- Created rate-limited API endpoints with proper security measures
- Built scheduled tasks for automated token maintenance operations

### WebSocket Improvements
- Implemented comprehensive WebSocket gateway with Socket.IO
- Added secure channel-based subscription model
- Created strongly-typed event definitions for all notification types
- Built robust connection management with automatic reconnection
- Implemented message queuing for offline/disconnected scenarios
- Added TypeScript interfaces for all WebSocket events
- Created connection status monitoring with visual feedback
- Built demonstration components for real-time functionality
- Added documentation for WebSocket usage patterns
- Implemented proper cleanup to prevent memory leaks

### API Client Real-time Extensions
- Extended API client with real-time functionality
- Added domain-specific subscription methods with proper typing
- Implemented connection status monitoring and callbacks
- Created comprehensive error handling for WebSocket operations
- Added automatic token refresh during reconnection
- Built ping/pong mechanism for connection health checks
- Implemented best practices for WebSocket usage in React components

## Project Purpose

This project is a comprehensive platform that combines web applications (alivehuman.com), mobile apps (iOS/Android), and an admin panel (app.alivehuman.com). The platform integrates blockchain functionality including tokens and NFTs. The architecture supports:

1. Multi-language support for internationalization
2. Blockchain wallet integration and NFT minting with cooldown periods
3. Secure authentication with strict device-wallet binding
4. Advanced security features with device tracking and fraud prevention
5. Session management and engagement analytics
6. Rate limiting and device restrictions to prevent abuse
7. Referral and airdrop system for user acquisition and rewards
8. Sophisticated anti-fraud mechanisms for user registration
9. Responsive design across web and mobile
10. Containerized deployment using Docker
11. Automated CI/CD pipeline for testing and deployment

The project uses TypeScript throughout for type safety and follows a modular architecture for maintainability and scalability.

## Implementation Progress

✅ **Database Configuration**
- PostgreSQL connection setup with TypeORM
- Environment variables configuration
- Migrations for database schema
- In-memory SQLite for testing

✅ **Entity Relations**
- User entity with device, session, and wallet relations
- Wallet entity linked to users with proper cascade behavior
- ReferralCode entities for referral tracking
- RefreshToken entity for authentication
- Security entities for tracking devices and sessions

✅ **Security Features**
- Device tracking and identification
- Session management and monitoring
- IP address logging and fraud detection
- Rate limiting implementation
- One-device-one-wallet policy

✅ **Testing Infrastructure**
- Comprehensive test setup with in-memory database
- API integration tests with supertest
- End-to-end workflow tests for validating user journeys
- Mock controllers and services for isolated testing
- Jest configuration with proper timeouts and cleanup
- All test suites passing successfully (basic, minimal, api, integration, auth, referral)
- Optimized test strategies that avoid database connectivity issues
- Properly configured timeouts for stable test execution
- Isolated tests from production database dependencies

✅ **Authentication Flow**
- Consolidated device-based security
- Support for both traditional and wallet-based authentication
- Token refresh mechanism with proper expiration
- Email verification workflow
- Password reset functionality
- Validated authentication endpoints through comprehensive testing
- Successfully integrated test suite for all authentication features
- Fixed type errors and ensured consistent behavior across environments

✅ **API Endpoints**
- Successfully implemented and tested user profile API
- Authentication endpoints fully functional and tested
- Proper token validation and error handling
- End-to-end user journey verified through tests

✅ **API Client Implementation**
- Comprehensive API client with service-based architecture
- Performance optimizations (caching, batching, compression)
- Security enhancements (device fingerprinting, end-to-end encryption)
- Real-time functionality with WebSocket integration
- Offline support with synchronization
- Memory management for optimal performance
- Extensive error handling and troubleshooting utilities
- Consistent interface across all platform implementations

✅ **Referral System**
- Complete implementation of referral code generation and validation
- Security measures to prevent self-referrals and duplicate usage
- Referral tracking and statistics gathering functionality
- Reward claiming mechanism with appropriate business rules
- Comprehensive test coverage for controller and service
- Ready for integration with blockchain reward distribution

✅ **Hot Wallet System**
- Multi-chain support for ETH, BTC, SOL, BNB, MATIC networks
- Secure key management with AES-256 encryption
- Balance checking across networks with error handling
- Transaction creation, simulation, and broadcasting
- Token support for major ERC20/BEP20 tokens
- NFT support for ERC-721 and ERC-1155 standards
- Trust Wallet compatibility for seamless integration
- Real-time transaction monitoring and balance tracking
- Transaction history retrieval and organization
- Gas optimization across different networks
- Batch operations for efficient NFT transfers
- Comprehensive test suite with mocked blockchain providers
- Error handling with custom blockchain error classes

✅ **NFT Integration**
- Support for both ERC-721 and ERC-1155 NFT standards
- NFT metadata retrieval and formatting
- Collection management and organization
- Cross-chain NFT transfer capabilities
- Batch transfer support for efficient operations
- Real-time NFT transfer monitoring
- Trust Wallet NFT format compatibility
- NFT ownership verification and validation
- Comprehensive test coverage for all NFT operations

✅ **SHAHI Token System**
- Smart contract implementation with minting and staking features
- Backend service integration for secure minting operations
- Merkle proof verification for initial minting eligibility
- Annual token minting with device binding for security
- Token expiration and burning mechanism
- Real-time WebSocket notifications for token events
- Rate-limited API endpoints for minting operations
- Scheduled tasks for token management
- WebSocket authentication for secure real-time notifications
- Integration with user verification system for eligibility tracking
- Complete chain of trust from user verification to on-chain minting

✅ **Wallet Authentication System**
- Two-step wallet authentication flow (connect -> sign -> authenticate)
- Backend challenge generation with timestamp for security
- Cryptographic signature verification
- Optional email association for wallet-based accounts
- Device tracking for security
- Session management with JWT tokens
- Proper frontend integration with MetaMask and other wallet providers
- Support for account and network change events
- Debug utilities for troubleshooting authentication issues
- Database schema support for wallet-only users

✅ **Diary System**
- Complete implementation of diary entity and relationships
- Full CRUD operations for diary entries
- User-specific diary entry management
- Location tracking with enum support
- Emotion and game progress tracking
- JWT authentication integration for all endpoints
- Comprehensive Swagger API documentation
- Input validation with class-validator
- Ownership verification for secure access
- Media attachment management
- Comprehensive test coverage with isolated tests

◔ **API Documentation**
- Partially completed with `@ApiTags`, `@ApiOperation`, `@ApiResponse`, and `@ApiBody` decorators
- API docs for authentication endpoints including registration, login, and token refresh
- Email verification and password reset endpoints documented
- Further expansions needed for wallet operations and user management endpoints

◔ **Error Handling**
- Basic error handling in place with HttpExceptions
- Consistent response formats for authentication errors
- Need to implement global exception filters
- Add proper logging throughout the application

## Next Steps

1. **Password Reset Tests**
   - Implement comprehensive tests for password reset functionality
   - Test token generation, validation, and password update
   - Cover edge cases like expired tokens and invalid passwords
   - Ensure proper error handling for security-sensitive operations

2. **Session Management Tests**
   - Add tests for user session tracking
   - Test session expiration and cleanup
   - Verify one-device-one-wallet policy enforcement
   - Test concurrent session handling

3. **Global Exception Filter**
   - Implement consistent error response format
   - Add logging for all exceptions
   - Create custom exception types for domain-specific errors
   - Configure proper error serialization

4. **Enhanced Blockchain Monitoring**
   - Implement production-ready WebSocket connection management
   - Add reconnection strategies for network interruptions
   - Implement load balancing across multiple RPC providers
   - Create fallback mechanisms for chain-specific operations

5. **NFT Marketplace Features**
   - Develop NFT listing and trading functionality
   - Implement bidding and auction mechanisms
   - Create collection statistics and analytics
   - Develop royalty distribution for creators

6. **Expand Multi-chain Support**
   - Add support for additional EVM-compatible chains
   - Implement Layer-2 solution integration (Arbitrum, Optimism)
   - Enhance cross-chain bridging capabilities
   - Support for upcoming blockchain networks

7. **Enhanced Wallet Authentication**
   - Implement multi-chain wallet support (beyond Ethereum)
   - Add social recovery options for wallet users
   - Create analytics for wallet usage patterns
   - Implement session management UI for connected devices
   - Develop wallet profile completion flow to gather additional user data

8. **API Client Enhancements**
   - Complete implementation of end-to-end encryption for all sensitive data
   - Implement comprehensive TypeScript type definitions for all API responses
   - Add detailed JSDoc comments for better IDE integration
   - Create example implementations for common use cases
   - Implement comprehensive unit tests for all client modules
   - Add automated regression testing for API client features
   - Support GraphQL queries alongside REST for more flexible data fetching
   - Implement rate limiting with retry strategies
   - Add visualization tools for API performance monitoring


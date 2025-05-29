# Backend Implementation Prompts

## NestJS Project Setup

```prompt
Create a NestJS application within a Yarn workspace monorepo structure at 'packages/backend' with:

1. Standard NestJS architecture following best practices
2. TypeScript configuration extending the root config
3. Package.json with:
   - NestJS dependencies
   - TypeORM and PostgreSQL libraries
   - Redis for caching
   - JWT authentication packages
   - Testing libraries (Jest, Supertest)
   - Development dependencies

4. Environment configuration setup with validation
5. Logging configuration
6. OpenAPI/Swagger documentation setup
7. Health check endpoints
8. Basic module structure for a modular application
```

## Database Configuration

```prompt
Set up a TypeORM configuration for a NestJS application using PostgreSQL with:

1. Database connection configuration with environment variables
2. Migration system setup
3. Base entity class with common fields:
   - UUID as primary key
   - createdAt, updatedAt timestamps
   - deletedAt (for soft deletes)
   - version (for optimistic concurrency)

4. Database seeding system
5. Repository pattern implementation
6. Connection pooling optimized for production
7. Transaction management utilities
8. Testing utilities with in-memory database support
```

## Core Authentication Module

```prompt
Create a comprehensive authentication module for a NestJS application with:

1. Dual authentication strategies:
   - JWT-based traditional authentication
   - Web3/crypto wallet authentication (polygon compatible)

2. Features:
   - User registration
   - Login with email/password
   - Crypto wallet signatures
   - Password reset
   - Email verification
   - Two-factor authentication
   - Session management
   - Device management

3. Security features:
   - Password hashing with bcrypt
   - JWT with RS256 signing
   - Rate limiting
   - CSRF protection
   - Required entities and DTOs
   - Guards and decorators

4. Role-based access control system
5. Integration with WebSockets authentication
6. Complete test coverage
```

## User Management Module

```prompt
Create a user management module for a NestJS application with:

1. User entity with:
   - UUID primary key
   - Email, username, password hash
   - Profile information
   - Roles and permissions
   - Email verification status
   - Account status (active, suspended, etc.)

2. User profile entity with extended profile information
3. CRUD operations for user management
4. User search and filtering
5. Role and permission management
6. User device tracking
7. User session management with security controls
8. Complete test coverage
```

## Blockchain Integration Module

```prompt
Create a blockchain integration module for a NestJS application with:

1. Integration with:
   - Ethereum networks
   - Polygon networks
   - Binance Smart Chain
   - Solana (optional)

2. Features:
   - Wallet address verification
   - Transaction monitoring
   - Hot wallet management
   - NFT minting and management
   - Token transfers and management
   - Smart contract interaction utilities
   - RPC provider load balancing

3. Security features:
   - Key management
   - Rate limiting for blockchain operations
   - Circuit breakers for failed operations
   - Retry mechanisms for transactions

4. Blockchain event listeners using WebSockets
5. Complete test coverage
```

## Game Module

```prompt
Create a game module for a NestJS application with:

1. Entities for:
   - Game modules
   - Game sections
   - User progress
   - Achievements
   - Rewards
   - Quizzes and questions

2. Features:
   - Module and section management
   - Progressive content unlocking
   - User progress tracking
   - Achievement system
   - Reward distribution
   - Quiz system with scoring
   - Media asset management

3. Real-time notifications using WebSockets
4. Proper authorization checks for content access
5. Complete test coverage
```

## Websocket Gateway Implementation

```prompt
Create a WebSocket gateway implementation for a NestJS application with:

1. Authentication integration with:
   - JWT authentication
   - Wallet-based authentication

2. Connection management:
   - Connection pooling
   - Heartbeat system
   - Client tracking
   - Connection events

3. Features:
   - Real-time notifications
   - Game events
   - Blockchain transaction monitoring
   - User presence indicators
   - Token balance updates

4. Security features:
   - Rate limiting
   - Message validation
   - Room-based authorization

5. Complete test coverage
```
# Frontend Implementation Prompts

## Next.js Project Setup

```prompt
Create a Next.js application within a Yarn workspace monorepo structure at 'packages/frontend' with:

1. Next.js app directory structure (App Router)
2. TypeScript configuration extending the root config
3. Package.json with:
   - Next.js and React dependencies
   - SWR or React Query for data fetching
   - React Hook Form for form handling
   - zod for validation
   - TailwindCSS for styling
   - Testing libraries (Jest, React Testing Library)
   - Development dependencies

4. Environment configuration setup with validation
5. Internationalization setup with next-i18next
6. Custom 404 and 500 error pages
7. SEO optimizations
8. Analytics integration preparation
9. Basic page structure for a modern Next.js application
```

## API Client Layer

```prompt
Create a comprehensive API client layer for a Next.js application that communicates with a NestJS backend:

1. Base API client with:
   - Axios-based HTTP client
   - Request/response interceptors
   - Error handling middleware
   - Authentication token management
   - Automatic retries for failed requests
   - Request cancellation

2. Features:
   - TypeScript types shared with backend
   - Automatic refresh token handling
   - Request caching
   - Offline support capabilities
   - Request batching optimizations

3. Services structure:
   - Modular services for different API endpoints
   - Mock service implementations for development
   - Service factory pattern

4. React hooks for data fetching:
   - useQuery hook wrappers
   - useMutation hook wrappers
   - Optimistic updates
   - Cache invalidation

5. Complete test coverage
```

## Authentication Context and Hooks

```prompt
Create an authentication system for a Next.js application with:

1. Authentication context provider with:
   - User state management
   - Loading states
   - Error handling

2. Authentication methods:
   - Email/password login
   - Wallet-based authentication (Ethereum, Solana support)
   - Social auth preparation

3. React hooks:
   - useAuth hook for auth state and methods
   - useUser hook for user data
   - useWalletAuth for crypto wallet specific auth

4. Protected route components:
   - Role-based route protection
   - Authentication status checks
   - Redirect handling for unauthenticated users

5. Forms:
   - Login form
   - Registration form
   - Password reset
   - Profile update

6. Session management:
   - Token storage in secure cookies
   - Session timeouts
   - Multi-device handling

7. Complete test coverage
```

## Wallet Integration Components

```prompt
Create a comprehensive wallet integration system for a Next.js application:

1. Wallet connection components:
   - Multi-wallet support (MetaMask, WalletConnect, Coinbase Wallet, etc.)
   - Wallet selection modal
   - Connection status indicators
   - Network switching

2. React hooks:
   - useWallet for wallet state and methods
   - useWalletBalance for real-time balance tracking
   - useTransaction for transaction handling

3. Blockchain interactions:
   - Transaction submission and tracking
   - Token balance display
   - NFT display and management
   - Contract interaction utilities

4. UI Components:
   - Wallet button
   - Network indicator
   - Transaction notifications
   - Token balance display
   - NFT gallery

5. Security features:
   - Message signing
   - Transaction confirmation
   - Network validation

6. Complete test coverage
```

## Real-time Communication Setup

```prompt
Create a real-time communication system for a Next.js application using WebSockets:

1. WebSocket connection manager with:
   - Authentication integration
   - Reconnection logic
   - Event system

2. React context:
   - WebSocket connection state
   - Event subscription management
   - Message handling

3. React hooks:
   - useWebSocket for raw socket access
   - useSocketEvent for event subscriptions
   - usePresence for user presence

4. Features:
   - Real-time notifications
   - Live updates for game content
   - Blockchain event monitoring
   - User presence tracking
   - Chat functionality preparation

5. UI Components:
   - Connection status indicator
   - Notification badge and panel
   - Live update indicators

6. Complete test coverage
```

## Game UI Components

```prompt
Create a comprehensive game UI component library for a Next.js application:

1. Base game components:
   - Game container and layout
   - Progress indicators
   - Achievement displays
   - Reward animations

2. Interactive elements:
   - Quiz components
   - Interactive cards
   - Progress trackers
   - Navigation controls

3. Animation system:
   - Transition controllers
   - Animation hooks
   - Galaxy background animation
   - Reward celebration effects

4. Module navigation:
   - Module selection interface
   - Section navigation
   - Progress visualization
   - Checkpoint indicators

5. State management:
   - Game progress context
   - Achievement tracking
   - User rewards state

6. Complete test coverage and storybook documentation
```

## Diary System Components

```prompt
Create a diary system for a Next.js application:

1. Diary list and management:
   - Diary entry listing
   - Filtering and sorting
   - Search functionality

2. Content creation:
   - Rich text editor integration
   - Media upload and management
   - Draft saving system

3. Content display:
   - Responsive diary entry display
   - Media gallery integration
   - Sharing options

4. UI Components:
   - Diary card component
   - Editor component
   - Media recorder/uploader
   - Tags and categories

5. State management:
   - Diary context for state
   - Editing state management
   - Media upload state

6. Complete test coverage
```
# Mobile Application Implementation Prompts

## React Native Project Setup

```prompt
Create a React Native application with Expo within a Yarn workspace monorepo structure at 'packages/mobile' with:

1. Expo SDK setup with managed workflow
2. TypeScript configuration extending the root config
3. Package.json with:
   - React Native and Expo dependencies
   - React Navigation for routing
   - State management solution (Redux Toolkit or Zustand)
   - Form handling libraries
   - UI component libraries
   - Testing libraries
   - Development dependencies

4. Environment configuration setup with secure storage
5. Internationalization support 
6. Error boundary implementation
7. Deep linking configuration
8. Basic screen structure for a mobile application
```

## Mobile Authentication System

```prompt
Create an authentication system for a React Native mobile application:

1. Authentication context provider:
   - User state management
   - Loading states
   - Error handling
   - Secure token storage

2. Authentication methods:
   - Email/password login
   - Biometric authentication
   - Social auth integration
   - Wallet connection integration

3. Authentication screens:
   - Login screen
   - Registration screen
   - Password reset
   - Email verification
   - Two-factor authentication

4. Security features:
   - Secure storage for tokens
   - Automatic logout on inactivity
   - PIN or biometric app lock
   - Session management
   - Secure communication

5. Complete test coverage
```

## Mobile Wallet Integration

```prompt
Create a mobile wallet integration system for a React Native application:

1. Wallet connection components:
   - Native wallet SDK integrations
   - WalletConnect integration
   - QR code scanning functionality
   - Deep linking with wallets

2. Wallet functionality:
   - Balance checking
   - Transaction history
   - Token management
   - NFT display
   - Transaction signing

3. UI Components:
   - Wallet selector
   - Transaction confirmation modals
   - Balance display
   - NFT gallery
   - Transaction history list

4. Security features:
   - Secure storage of keys
   - Transaction verification
   - Network switching
   - Gas estimation and management

5. Complete test coverage
```

## Mobile Game Interface

```prompt
Create a mobile game interface for a React Native application:

1. Game navigation:
   - Module selection screen
   - Section navigation
   - Progress tracking interface
   - Achievement display

2. Interactive elements:
   - Mobile-optimized quiz components
   - Touch-friendly interactive cards
   - Mobile-specific animations
   - Gesture-based interactions

3. Offline capabilities:
   - Content caching
   - Offline progress tracking
   - Sync mechanisms when back online
   - Conflict resolution

4. Performance optimizations:
   - Lazy loading
   - Image optimization
   - Animation performance
   - Memory management

5. Complete test coverage
```

## Mobile Notifications System

```prompt
Create a comprehensive mobile notifications system for a React Native application:

1. Push notification setup:
   - Expo notifications configuration
   - Firebase Cloud Messaging integration
   - Platform-specific notification handling
   - Background notification processing

2. Notification types:
   - Game progress notifications
   - Achievement unlocks
   - Blockchain activity alerts
   - System announcements
   - User interactions

3. Notification management:
   - Notification preferences screen
   - Category-based opt-in/opt-out
   - Do not disturb settings
   - Notification history

4. In-app notification center:
   - Notification listing UI
   - Read/unread status
   - Action handling from notifications
   - Notification grouping

5. Complete test coverage
```

## Offline-First Data Strategy

```prompt
Create an offline-first data strategy for a React Native mobile application:

1. Local data storage:
   - Watermelon DB or SQLite setup
   - Schema design for offline data
   - Data encryption for sensitive information
   - Migration strategies

2. Synchronization system:
   - Data sync protocols
   - Conflict resolution strategies
   - Sync status indicators
   - Background sync capabilities

3. Offline actions:
   - Queue system for offline actions
   - Retry mechanisms
   - User feedback during sync
   - Error handling for failed syncs

4. Content management:
   - Asset caching strategies
   - Prefetching important content
   - Storage management and cleanup
   - User-initiated downloads

5. Complete test coverage
```
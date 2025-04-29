# Frontend File Structure

This document outlines the structure of the frontend application built with Next.js and TypeScript.

```
frontend/
├── next.config.js                   # Next.js configuration
├── next-env.d.ts                    # Next.js type definitions
├── next-i18next.config.js           # i18n configuration for Next.js
├── postcss.config.js                # PostCSS configuration
├── tailwind.config.js               # Tailwind CSS configuration
├── tsconfig.json                    # TypeScript configuration
├── verify-refactoring.js            # Script for verifying code refactoring
├── public/                          # Static assets directory
└── src/                             # Source code directory
    ├── components/                  # UI components
    │   ├── debug/                   # Debug components
    │   │   ├── AuthDebugPanel.tsx         # Authentication debug panel
    │   │   ├── DebugWrapper.tsx           # Debug panel wrapper
    │   │   ├── WalletDebugPanel.module.css # Wallet debug panel styles
    │   │   ├── WalletDebugPanel.tsx       # Wallet debug panel
    │   │   ├── WalletDebugWrapper.module.css # Wallet debug wrapper styles
    │   │   └── WalletDebugWrapper.tsx     # Wallet debug wrapper component
    │   ├── diary/                   # Diary-related components
    │   │   ├── DiaryCard.tsx             # Diary card component
    │   │   ├── DiaryForm.tsx             # Diary form component
    │   │   ├── MediaRecorder.tsx         # Media recorder component
    │   │   └── RichTextEditor.tsx        # Rich text editor component
    │   ├── errors/                  # Error page components
    │   │   ├── NotFoundPage.tsx          # 404 page component
    │   │   ├── RateLimitPage.tsx         # Rate limit error page
    │   │   └── ServerErrorPage.tsx       # Server error page
    │   ├── icons/                   # Icon components
    │   │   └── BellIcon.tsx              # Bell icon component
    │   ├── layout/                  # Layout components
    │   │   ├── Footer.tsx                # Footer component
    │   │   ├── Layout.tsx                # Main layout component
    │   │   └── Navbar.tsx                # Navigation bar component
    │   ├── wallet-selector/         # Wallet selector components
    │   │   ├── index.ts                  # Barrel exports
    │   │   ├── WalletSelector.module.css # Wallet selector styles
    │   │   ├── WalletSelector.tsx        # Wallet selector component
    │   │   └── WalletSelectorModal.tsx   # Wallet selector modal
    │   ├── NFTTransferMonitor.tsx   # NFT transfer monitoring component
    │   ├── NotificationBell.tsx     # Notification bell component
    │   ├── NotificationsPanel.tsx   # Notifications panel component
    │   ├── ProfileOnboarding.tsx    # Profile onboarding component
    │   ├── RealTimeBalance.tsx      # Real-time balance component
    │   ├── ThemeToggle.tsx          # Theme toggle component
    │   ├── UserConnectionStatus.tsx # User connection status component
    │   ├── WalletBalanceMonitor.tsx # Wallet balance monitoring component
    │   ├── WalletConnectButton.tsx  # Wallet connect button component
    │   ├── WebSocketDemoContent.tsx # WebSocket demo content
    │   ├── WebSocketIndicator.tsx   # WebSocket indicator component
    │   └── WebSocketStatus.tsx      # WebSocket status component
    ├── config/                      # Configuration files
    │   └── api.config.ts            # API configuration
    ├── contexts/                    # React contexts
    │   ├── auth.tsx                 # Authentication context
    │   ├── wallet.tsx               # Wallet context
    │   ├── WebSocketContext.tsx     # WebSocket context
    │   └── websocket.tsx            # WebSocket context implementation
    ├── hooks/                       # Custom React hooks
    │   ├── useAuthDebug.ts          # Authentication debug hook
    │   ├── useObservable.ts         # Observable hook
    │   └── useUserConnection.ts     # User connection hook
    ├── i18n.ts                      # i18n configuration
    ├── i18n-basic.ts                # Basic i18n setup
    ├── pages/                       # Next.js pages
    │   ├── _app.tsx                 # App component (entry point)
    │   ├── _document.tsx            # Document component
    │   ├── auth/                    # Authentication pages
    │   │   └── connect.tsx          # Connect authentication page
    │   ├── diary/                   # Diary pages
    │   │   ├── create.tsx           # Create diary entry page
    │   │   ├── edit/                # Edit diary pages
    │   │   │   └── [id].tsx         # Edit diary entry by ID
    │   │   ├── index.tsx            # Diary listing page
    │   │   └── [id].tsx             # Diary detail page by ID
    │   ├── error/                   # Error pages
    │   │   ├── not-found.tsx        # Not found error page
    │   │   ├── rate-limit.tsx       # Rate limit error page
    │   │   ├── server.tsx           # Server error page
    │   │   └── [...slug].tsx        # Catch-all error page
    │   ├── bootstrap-demo.tsx       # Bootstrap demo page
    │   ├── index.tsx                # Home page
    │   ├── login.tsx                # Login page
    │   ├── profile.tsx              # User profile page
    │   ├── real-time-demo.tsx       # Real-time demo page
    │   ├── wallet-demo.tsx          # Wallet demo page
    │   └── WebSocketDemo.tsx        # WebSocket demo page
    ├── profile/                     # Profile-related code
    │   └── profile-service.ts       # Profile service
    ├── services/                    # Service modules
    │   ├── api/                     # API services
    │   │   ├── api-client.ts        # Main API client
    │   │   ├── client/              # API client implementations
    │   │   │   ├── base/            # Base API client
    │   │   │   │   └── index.ts     # Base client exports
    │   │   │   ├── index.ts         # Client barrel exports
    │   │   │   └── optimized/       # Optimized API clients
    │   │   │       ├── batch-request.ts      # Batch request implementation
    │   │   │       ├── cached-api.ts         # Cached API client
    │   │   │       ├── compressed-api.ts     # Compressed API client
    │   │   │       ├── encrypted-api-client.ts # Encrypted API client
    │   │   │       ├── index.ts              # Optimized clients barrel exports
    │   │   │       ├── monitoring-api.ts     # API monitoring client
    │   │   │       ├── offline-api.ts        # Offline-capable API client
    │   │   │       ├── secure-api-client.ts  # Secure API client
    │   │   │       └── selective-api.ts      # Selective API client
    │   │   ├── event-bus.ts         # API event bus
    │   │   ├── index.ts             # API services barrel exports
    │   │   ├── modules/             # API modules by domain
    │   │   │   ├── auth/            # Authentication APIs
    │   │   │   │   └── index.ts     # Auth API exports
    │   │   │   ├── diary/           # Diary APIs
    │   │   │   │   ├── diary-service.ts    # Diary service
    │   │   │   │   ├── index.ts            # Diary API exports
    │   │   │   │   └── legacy-diary-service.ts # Legacy diary service
    │   │   │   ├── index.ts         # API modules barrel exports
    │   │   │   ├── nft/             # NFT APIs
    │   │   │   │   ├── index.ts            # NFT API exports
    │   │   │   │   ├── nft-service.ts      # NFT service
    │   │   │   │   └── token-service.ts    # Token service
    │   │   │   ├── realtime.ts      # Realtime API
    │   │   │   ├── user/            # User APIs
    │   │   │   │   ├── index.ts            # User API exports
    │   │   │   │   ├── referral-service.ts # Referral service
    │   │   │   │   └── user-service.ts     # User service
    │   │   │   └── wallet/          # Wallet APIs
    │   │   │       └── index.ts     # Wallet API exports
    │   │   └── wallet-auth.service.ts # Wallet authentication service
    │   ├── index.ts                # Services barrel exports
    │   ├── notifications/          # Notification services
    │   │   ├── index.ts            # Notification exports
    │   │   └── notification-service.ts # Notification service
    │   ├── realtime/               # Realtime services
    │   │   ├── config.ts           # Realtime configuration
    │   │   ├── events/             # Realtime events
    │   │   │   ├── event-bus.ts    # Realtime event bus
    │   │   │   └── index.ts        # Event exports
    │   │   ├── index.ts            # Realtime exports
    │   │   └── websocket/          # WebSocket implementation
    │   │       ├── index.ts        # WebSocket exports
    │   │       ├── realtime-service-interface.ts # Realtime service interface
    │   │       ├── realtime-service.ts # Realtime service implementation
    │   │       └── websocket-manager.ts # WebSocket manager
    │   ├── realtime.ts            # Main realtime service
    │   ├── security/              # Security services
    │   │   ├── encryption/         # Encryption services
    │   │   │   ├── encryption-service.ts # Encryption service
    │   │   │   └── index.ts        # Encryption exports
    │   │   ├── index.ts            # Security exports
    │   │   ├── protection/         # Protection services
    │   │   │   ├── captcha-service.ts # CAPTCHA service
    │   │   │   ├── device-fingerprint.ts # Device fingerprinting
    │   │   │   └── index.ts        # Protection exports
    │   │   └── security-service.ts # Main security service
    │   ├── storage/               # Storage services
    │   │   ├── cache/              # Cache implementation
    │   │   │   ├── cache-utils.ts  # Cache utilities
    │   │   │   └── index.ts        # Cache exports
    │   │   ├── index.ts            # Storage exports
    │   │   └── memory/             # In-memory storage
    │   │       ├── index.ts        # Memory storage exports
    │   │       └── memory-manager.ts # Memory management
    │   └── wallet/                # Wallet services
    │       ├── auth/               # Wallet authentication
    │       │   ├── challenge.ts    # Challenge creation
    │       │   └── wallet-auth.ts  # Wallet authentication
    │       ├── core/               # Core wallet functionality
    │       │   ├── connection.ts   # Wallet connection
    │       │   └── wallet-base.ts  # Base wallet implementation
    │       ├── index.ts            # Wallet services exports
    │       ├── providers/          # Wallet providers
    │       │   ├── ethereum/       # Ethereum wallet providers
    │       │   │   ├── binance.ts  # Binance wallet
    │       │   │   ├── index.ts    # Ethereum providers exports
    │       │   │   ├── metamask.ts # MetaMask wallet
    │       │   │   ├── trustwallet.ts # Trust Wallet
    │       │   │   └── walletconnect.ts # WalletConnect
    │       │   ├── solana/         # Solana wallet providers
    │       │   │   ├── index.ts    # Solana providers exports
    │       │   │   ├── phantom.ts  # Phantom wallet
    │       │   │   └── solflare.ts # Solflare wallet
    │       │   └── ton/            # TON wallet providers
    │       │       ├── index.ts    # TON providers exports
    │       │       └── tonkeeper.ts # Tonkeeper wallet
    │       ├── types.ts            # Wallet type definitions
    │       ├── wallet-initialization.ts # Wallet initialization
    │       ├── wallet-selector.ts  # Wallet selector
    │       └── wallet-service.ts   # Main wallet service
    ├── styles/                    # CSS styles
    │   ├── components/             # Component-specific styles
    │   │   ├── UserConnectionStatus.css # User connection styles
    │   │   └── WalletConnectButton.module.css # Wallet connect button styles
    │   ├── DiaryList.module.css    # Diary list styles
    │   ├── error-pages.css         # Error page styles
    │   └── globals.css             # Global styles
    ├── types/                     # TypeScript type definitions
    │   ├── api-types.ts            # API type definitions
    │   ├── axios-cache-adapter.d.ts # Axios cache adapter definitions
    │   ├── diary-extended.ts       # Extended diary types
    │   ├── diary.ts                # Diary type definitions
    │   ├── global.d.ts             # Global type declarations
    │   ├── jsencrypt.d.ts          # JSEncrypt type definitions
    │   ├── realtime-types.ts       # Realtime type definitions
    │   ├── user.ts                 # User type definitions
    │   ├── walletconnect.d.ts      # WalletConnect type definitions
    │   └── websocket.ts            # WebSocket type definitions
    └── utils/                     # Utility functions
        ├── auth-debugger.ts        # Authentication debugging utilities
        ├── clientOnly.tsx          # Client-only component utility
        ├── dynamicImport.ts        # Dynamic import utilities
        ├── dynamicTypes.ts         # Dynamic type utilities
        ├── encryption.ts           # Encryption utilities
        ├── errorNavigation.ts      # Error navigation utilities
        ├── initialize-debug.ts     # Debug initialization
        ├── secure-storage.ts       # Secure storage utilities
        ├── types.ts                # Utility type definitions
        └── wallet-connection-debugger.ts # Wallet connection debugging
```

## Major Modules & Features

### Components
- **Layout**: Core layout components including Navbar and Footer
- **Diary**: Components for creating and viewing diary entries
- **Error Pages**: Custom error page components
- **Wallet Selector**: Components for selecting and connecting wallets
- **Debug Panels**: Components for development and debugging

### Services
- **API**: Comprehensive API client with optimizations (caching, offline support, compression)
- **Wallet**: Multi-chain wallet integration (Ethereum, Solana, TON) with various providers
- **Security**: Encryption, CAPTCHA, and device fingerprinting
- **Realtime**: WebSocket-based realtime communication
- **Storage**: Local cache and memory management

### Pages
- **Authentication**: Login and wallet connection pages
- **Diary**: CRUD operations for diary entries
- **Profile**: User profile management
- **Demo Pages**: Various feature demonstrations

## Main Technologies
- **Next.js**: React framework for server-side rendering and routing
- **TypeScript**: Strongly typed JavaScript
- **Tailwind CSS**: Utility-first CSS framework
- **i18n**: Internationalization support
- **WebSockets**: For realtime communication
- **Wallet Integration**: Multi-chain wallet support (MetaMask, Phantom, etc.)

## Architecture Overview
The frontend follows a modular architecture with clear separation of concerns:
- UI components are isolated and reusable
- Business logic is encapsulated in services
- State management uses React Context and hooks
- API interactions are abstracted through service layers
- Multi-chain wallet support with unified interface
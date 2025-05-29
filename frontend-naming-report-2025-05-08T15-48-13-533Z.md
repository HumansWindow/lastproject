# Frontend Naming Convention Standardization Report

Generated: 2025-05-08T15:48:13.533Z

## Summary

- Components renamed: 4
- Pages renamed: 9
- Service files renamed: 2
- Utility files renamed: 50
- Directories renamed: 54
- Files with updated imports: 106

## File Renames

- src/animations/colorsystem/ColorSystem.ts → src/animations/colorsystem/colorSystem.ts
- src/animations/colorsystem/GalaxyColorSystem.ts → src/animations/colorsystem/galaxyColorSystem.ts
- src/animations/galaxy/GalaxyAnimation.ts → src/animations/galaxy/galaxyAnimation.ts
- src/animations/galaxy/GalaxyTransitionManager.ts → src/animations/galaxy/galaxyTransitionManager.ts
- src/config/api.config.ts → src/config/api.config.ts
- src/contexts/WebSocketContext.tsx → src/contexts/WebSocketProvider.tsx
- src/contexts/auth.tsx → src/contexts/AuthProvider.tsx
- src/contexts/wallet.tsx → src/contexts/WalletProvider.tsx
- src/contexts/websocket.tsx → src/contexts/WebSocketProvider-1.tsx
- src/i18n-basic.ts → src/i18n-basic.ts
- src/pages/WebSocketDemo.tsx → src/pages/web-socket-demo.tsx
- src/pages/auth/connect.tsx → src/pages/auth/connect.tsx
- src/pages/diary/create.tsx → src/pages/diary/create.tsx
- src/pages/diary/index.tsx → src/pages/diary/index.tsx
- src/pages/error/server.tsx → src/pages/error/server.tsx
- src/pages/game-demo/index.tsx → src/pages/game-demo/index.tsx
- src/pages/index.tsx → src/pages/index.tsx
- src/pages/login.tsx → src/pages/login.tsx
- src/pages/profile.tsx → src/pages/profile.tsx
- src/profile/profile-service.ts → src/profile/profileService.ts
- src/services/api/api-client.ts → src/services/api/apiClient.ts
- src/services/api/client/optimized/batch-request.ts → src/services/api/client/optimized/batchRequest.ts
- src/services/api/client/optimized/cached-api.ts → src/services/api/client/optimized/cachedApi.ts
- src/services/api/client/optimized/compressed-api.ts → src/services/api/client/optimized/compressedApi.ts
- src/services/api/client/optimized/encrypted-api-client.ts → src/services/api/client/optimized/encryptedApiClient.ts
- src/services/api/client/optimized/monitoring-api.ts → src/services/api/client/optimized/monitoringApi.ts
- src/services/api/client/optimized/offline-api.ts → src/services/api/client/optimized/offlineApi.ts
- src/services/api/client/optimized/secure-api-client.ts → src/services/api/client/optimized/secureApiClient.ts
- src/services/api/client/optimized/selective-api.ts → src/services/api/client/optimized/selectiveApi.ts
- src/services/api/event-bus.ts → src/services/api/eventBus.ts
- src/services/api/modules/diary/diary-service.ts → src/services/api/modules/diary/diaryService.ts
- src/services/api/modules/diary/legacy-diary-service.ts → src/services/api/modules/diary/legacyDiaryService.ts
- src/services/api/modules/nft/nft-service.ts → src/services/api/modules/nft/nftService.ts
- src/services/api/modules/nft/token-service.ts → src/services/api/modules/nft/tokenService.ts
- src/services/api/modules/user/referral-service.ts → src/services/api/modules/user/referralService.ts
- src/services/api/modules/user/user-service.ts → src/services/api/modules/user/userService.ts
- src/services/api/wallet-auth.service.ts → src/services/api/walletAuth.service.ts
- src/services/game/game-notification.service.ts → src/services/game/gameNotification.service.ts
- src/services/notifications/notification-service.ts → src/services/notifications/notificationService.ts
- src/services/realtime/events/event-bus.ts → src/services/realtime/events/eventBus.ts
- src/services/realtime/websocket/realtime-service-interface.ts → src/services/realtime/websocket/realtimeServiceInterface.ts
- src/services/realtime/websocket/realtime-service.ts → src/services/realtime/websocket/realtimeService.ts
- src/services/realtime/websocket/websocket-manager.ts → src/services/realtime/websocket/websocketManager.ts
- src/services/security/encryption/encryption-service.ts → src/services/security/encryption/encryptionService.ts
- src/services/security/protection/captcha-service.ts → src/services/security/protection/captchaService.ts
- src/services/security/protection/device-fingerprint.ts → src/services/security/protection/deviceFingerprint.ts
- src/services/security/security-service.ts → src/services/security/securityService.ts
- src/services/storage/cache/cache-utils.ts → src/services/storage/cache/cacheUtils.ts
- src/services/storage/memory/memory-manager.ts → src/services/storage/memory/memoryManager.ts
- src/services/wallet/auth/wallet-auth.ts → src/services/wallet/auth/walletAuth.ts
- src/services/wallet/core/wallet-base.ts → src/services/wallet/core/walletBase.ts
- src/services/wallet/wallet-initialization.ts → src/services/wallet/walletInitialization.ts
- src/services/wallet/wallet-selector.ts → src/services/wallet/walletSelector.ts
- src/services/wallet/wallet-service.ts → src/services/wallet/walletService.ts
- src/types/api-types.ts → src/types/apiTypes.ts
- src/types/axios-cache-adapter.d.ts → src/types/axios-cache-adapter.d.ts
- src/types/diary-extended.ts → src/types/diaryExtended.ts
- src/types/global.d.ts → src/types/global.d.ts
- src/types/jsencrypt.d.ts → src/types/jsencrypt.d.ts
- src/types/realtime-types.ts → src/types/realtimeTypes.ts
- src/types/walletconnect.d.ts → src/types/walletconnect.d.ts
- src/utils/auth-debugger.ts → src/utils/authDebugger.ts
- src/utils/initialize-debug.ts → src/utils/initializeDebug.ts
- src/utils/secure-storage.ts → src/utils/secureStorage.ts
- src/utils/wallet-connection-debugger.ts → src/utils/walletConnectionDebugger.ts

## Directory Renames

- animations → animations
- colorsystem → colorsystem
- galaxy → galaxy
- common → common
- debug → debug
- diary → diary
- errors → errors
- game → game
- elements → elements
- examples → examples
- sections → sections
- icons → icons
- layout → layout
- ui → ui
- auth → auth
- edit → edit
- error → error
- profile → profile
- routes → routes
- services → services
- api → api
- client → client
- base → base
- optimized → optimized
- modules → modules
- nft → nft
- user → user
- wallet → wallet
- memory → memory
- notification → notification
- notifications → notifications
- realtime → realtime
- events → events
- websocket → websocket
- security → security
- encryption → encryption
- protection → protection
- storage → storage
- cache → cache
- core → core
- providers → providers
- ethereum → ethereum
- solana → solana
- ton → ton
- styles → styles

## Next Steps

1. Verify that all imports are correctly updated
2. Check that Next.js page routing still works correctly
3. Run the TypeScript compiler to catch any missed imports
4. Update any dynamic imports that might be using string literals

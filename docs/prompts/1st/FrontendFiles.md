# Frontend Files Structure

## Directory Structure

```
frontend/
├── api-comparison-report/
│   ├── auth-service-comparison.txt
│   ├── diary-service-comparison.txt
│   ├── nft-service-comparison.txt
│   ├── realtime-service-comparison.txt
│   ├── referral-service-comparison.txt
│   ├── token-service-comparison.txt
│   ├── user-service-comparison.txt
│   └── wallet-service-comparison.txt
├── .env.local
├── .eslintrc.json
├── frontend-files.txt
├── .next/
│   ├── build-manifest.json
│   ├── cache/
│   ├── package.json
│   ├── react-loadable-manifest.json
│   ├── server/
│   ├── static/
│   └── trace
├── next.config.js
├── next-env.d.ts
├── next-i18next.config.js
├── package.json
├── postcss.config.js
├── public/
│   ├── assets/
│   │   └── wallets/
│   │       ├── binance.svg
│   │       ├── default-wallet.svg
│   │       ├── metamask.svg
│   │       ├── phantom.svg
│   │       ├── solflare.svg
│   │       ├── tonkeeper.svg
│   │       ├── trust.svg
│   │       └── walletconnect.svg
│   ├── favicon.ico
│   ├── locales/
│   │   ├── de/
│   │   │   └── common.json
│   │   ├── en/
│   │   │   └── common.json
│   │   ├── es/
│   │   │   └── common.json
│   │   └── fr/
│   │       └── common.json
│   ├── patches/
│   │   └── wallet-guard.js
│   ├── tests/
│   │   └── index.html
│   ├── wallet-tester.html
│   ├── wallet-test.html
│   ├── wallet-test-improved.html
│   ├── wallet-tests/
│   │   └── index.html
│   └── wallet-utils/
│       ├── README.md
│       ├── trust-wallet-fix.js
│       └── wallet-loader.js
├── src/
│   ├── animations/
│   │   ├── colorsystem/
│   │   │   ├── colorSystem.ts
│   │   │   ├── galaxyColorSystem.ts
│   │   │   └── index.ts
│   │   └── galaxy/
│   │       ├── galaxyAnimation.ts
│   │       ├── galaxyTransitionManager.ts
│   │       ├── index.ts
│   │       ├── types.ts
│   │       └── useGalaxyAnimation.ts
│   ├── components/
│   │   ├── common/
│   │   │   └── ModalPortal.tsx
│   │   ├── debug/
│   │   │   ├── AuthDebugPanel.tsx
│   │   │   ├── DebugWrapper.tsx
│   │   │   ├── WalletDebugPanel.module.css
│   │   │   ├── WalletDebugPanel.tsx
│   │   │   ├── WalletDebugWrapper.module.css
│   │   │   └── WalletDebugWrapper.tsx
│   │   ├── diary/
│   │   │   ├── DiaryCard.tsx
│   │   │   ├── DiaryForm.tsx
│   │   │   ├── MediaRecorder.tsx
│   │   │   └── RichTextEditor.tsx
│   │   ├── errors/
│   │   │   ├── NotFoundPage.tsx
│   │   │   ├── RateLimitPage.tsx
│   │   │   └── ServerErrorPage.tsx
│   │   ├── game/
│   │   │   ├── elements/
│   │   │   │   ├── AnimatedImage.tsx
│   │   │   │   ├── index.ts
│   │   │   │   ├── NavigationButton.tsx
│   │   │   │   └── TypedText.tsx
│   │   │   ├── examples/
│   │   │   │   └── GalaxyAnimationExample.tsx
│   │   │   ├── GameNotificationBell.tsx
│   │   │   ├── GameNotificationIcon.tsx
│   │   │   ├── GameNotificationPanel.tsx
│   │   │   ├── hooks/
│   │   │   │   ├── index.ts
│   │   │   │   └── useGameSections.ts
│   │   │   ├── index.ts
│   │   │   └── sections/
│   │   │       ├── BaseSection.tsx
│   │   │       ├── CardCarouselSection.tsx
│   │   │       ├── index.ts
│   │   │       ├── TextImageSection.tsx
│   │   │       └── TimelineSection.tsx
│   │   ├── icons/
│   │   │   └── BellIcon.tsx
│   │   ├── layout/
│   │   │   ├── Footer.tsx
│   │   │   ├── Layout.tsx
│   │   │   └── Navbar.tsx
│   │   ├── LocationDetector.tsx
│   │   ├── NFTTransferMonitor.tsx
│   │   ├── NFTTransferMonitor.tsx.bak
│   │   ├── NotificationBell.tsx
│   │   ├── NotificationsPanel.tsx
│   │   ├── ProfileOnboarding.tsx
│   │   ├── RealTimeBalance.tsx
│   │   ├── RealTimeBalance.tsx.bak
│   │   ├── ThemeToggle.tsx
│   │   ├── ui/
│   │   │   ├── Alert.tsx
│   │   │   ├── Button.tsx
│   │   │   ├── index.ts
│   │   │   ├── Select.tsx
│   │   │   └── Spinner.tsx
│   │   ├── UserConnectionStatus.tsx
│   │   ├── WalletBalanceMonitor.tsx
│   │   ├── WalletBalanceMonitor.tsx.bak
│   │   ├── WalletConnectButton.tsx
│   │   ├── wallet-selector/
│   │   │   ├── index.ts
│   │   │   ├── WalletSelector.module.css
│   │   │   ├── WalletSelector.tsx
│   │   │   └── WalletSelectorModal.tsx
│   │   ├── WebSocketDemoContent.tsx
│   │   ├── WebSocketIndicator.tsx
│   │   └── WebSocketStatus.tsx
│   ├── config/
│   │   ├── api.config.ts
│   │   └── blockchain/
│   │       └── constants.ts
│   ├── constants/
│   │   └── networkConfig.ts.bak
│   ├── contexts/
│   │   ├── AuthProvider.tsx
│   │   ├── WalletProvider.tsx
│   │   └── WebSocketProvider.tsx
│   ├── hooks/
│   │   ├── useAuth.ts
│   │   ├── useAuthDebug.ts
│   │   ├── useObservable.ts
│   │   └── useUserConnection.ts
│   ├── i18n-basic.ts
│   ├── i18n.ts
│   ├── icons/
│   │   └── Bell.tsx
│   ├── pages/
│   │   ├── _app.tsx
│   │   ├── auth/
│   │   │   └── connect.tsx
│   │   ├── bootstrap-demo.tsx
│   │   ├── diary/
│   │   │   ├── create.tsx
│   │   │   ├── edit/
│   │   │   │   └── [id].tsx
│   │   │   ├── index.tsx
│   │   │   └── [id].tsx
│   │   ├── _document.tsx
│   │   ├── error/
│   │   │   ├── not-found.tsx
│   │   │   ├── rate-limit.tsx
│   │   │   ├── server.tsx
│   │   │   └── [...slug].tsx
│   │   ├── game-demo/
│   │   │   └── index.tsx
│   │   ├── index.tsx
│   │   ├── login.tsx
│   │   ├── profile.tsx
│   │   ├── real-time-demo.tsx
│   │   ├── wallet-demo.tsx
│   │   └── web-socket-demo.tsx
│   ├── profile/
│   │   └── profileService.ts
│   ├── services/
│   │   ├── api/
│   │   │   ├── apiClient.ts
│   │   │   ├── auth.ts
│   │   │   ├── auth-service.ts
│   │   │   ├── client/
│   │   │   │   ├── base/
│   │   │   │   │   └── index.ts
│   │   │   │   ├── index.ts
│   │   │   │   └── optimized/
│   │   │   │       ├── batchRequest.ts
│   │   │   │       ├── cachedApi.ts
│   │   │   │       ├── compressedApi.ts
│   │   │   │       ├── encryptedApiClient.ts
│   │   │   │       ├── index.ts
│   │   │   │       ├── monitoringApi.ts
│   │   │   │       ├── offlineApi.ts
│   │   │   │       ├── secureApiClient.ts
│   │   │   │       └── selectiveApi.ts
│   │   │   ├── eventBus.ts
│   │   │   ├── index.ts
│   │   │   ├── modules/
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth-service-bridge.ts
│   │   │   │   │   ├── auth-service.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── wallet-auth-service.ts
│   │   │   │   ├── diary/
│   │   │   │   │   ├── diaryService.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   └── legacyDiaryService.ts
│   │   │   │   ├── index.ts
│   │   │   │   ├── nft/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── nftService.ts
│   │   │   │   │   └── tokenService.ts
│   │   │   │   ├── realtime.ts
│   │   │   │   ├── user/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── referralService.ts
│   │   │   │   │   └── userService.ts
│   │   │   │   └── wallet/
│   │   │   │       └── index.ts
│   │   │   └── walletAuth.service.ts
│   │   ├── game/
│   │   │   └── gameNotification.service.ts
│   │   ├── import-mapping.txt
│   │   ├── index.ts
│   │   ├── location/
│   │   │   ├── index.ts
│   │   │   └── location-service.ts
│   │   ├── notifications/
│   │   │   ├── index.ts
│   │   │   └── notificationService.ts
│   │   ├── realtime/
│   │   │   ├── config.ts
│   │   │   ├── events/
│   │   │   │   ├── eventBus.ts
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   └── websocket/
│   │   │       ├── index.ts
│   │   │       ├── realtimeService.ts
│   │   │       ├── realtimeServiceInterface.ts
│   │   │       └── websocketManager.ts
│   │   ├── realtime.ts
│   │   ├── security/
│   │   │   ├── device-fingerprint.ts
│   │   │   ├── encryption/
│   │   │   │   ├── encryptionService.ts
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   ├── modules/
│   │   │   │   ├── device-fingerprint.ts
│   │   │   │   └── index.ts
│   │   │   ├── protection/
│   │   │   │   ├── captchaService.ts
│   │   │   │   ├── deviceFingerprint.ts
│   │   │   │   └── index.ts
│   │   │   └── securityService.ts
│   │   ├── storage/
│   │   │   ├── cache/
│   │   │   │   ├── cacheUtils.ts
│   │   │   │   └── index.ts
│   │   │   ├── index.ts
│   │   │   └── memory/
│   │   │       ├── index.ts
│   │   │       └── memoryManager.ts
│   │   ├── wallet/
│   │   │   ├── auth/
│   │   │   │   ├── challenge.ts
│   │   │   │   ├── wallet-AuthProvider.ts
│   │   │   │   ├── walletAuth.ts
│   │   │   │   └── walletAuthService.ts
│   │   │   ├── core/
│   │   │   │   ├── connection.ts
│   │   │   │   └── walletBase.ts
│   │   │   ├── index.ts
│   │   │   ├── providers/
│   │   │   │   ├── ethereum/
│   │   │   │   │   ├── binance.ts
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── metamask.ts
│   │   │   │   │   ├── trustwallet.ts
│   │   │   │   │   └── walletconnect.ts
│   │   │   │   ├── solana/
│   │   │   │   │   ├── index.ts
│   │   │   │   │   ├── phantom.ts
│   │   │   │   │   └── solflare.ts
│   │   │   │   └── ton/
│   │   │   │       ├── index.ts
│   │   │   │       └── tonkeeper.ts
│   │   │   ├── types.ts
│   │   │   ├── walletExtensions.ts
│   │   │   ├── walletInitialization.ts
│   │   │   ├── walletSelector.ts
│   │   │   └── walletService.ts
│   │   └── WalletProvider.ts
│   ├── styles/
│   │   ├── components/
│   │   │   ├── UserConnectionStatus.css
│   │   │   └── WalletConnectButton.module.css
│   │   ├── DiaryList.module.css
│   │   ├── error-pages.css
│   │   ├── game/
│   │   │   ├── animations.css
│   │   │   ├── index.css
│   │   │   ├── section-base.css
│   │   │   ├── section-card-carousel.css
│   │   │   ├── section-galaxy-background.css
│   │   │   ├── section-text-image.css
│   │   │   └── section-timeline.css
│   │   └── globals.css
│   ├── tests/
│   │   └── wallet/
│   │       ├── walletAuthTest.ts
│   │       └── walletAuthTestRunner.html
│   ├── types/
│   │   ├── apiTypes.ts
│   │   ├── axios-cache-adapter.d.ts
│   │   ├── diary.ts
│   │   ├── diaryExtended.ts
│   │   ├── global.d.ts
│   │   ├── jsencrypt.d.ts
│   │   ├── realtimeTypes.ts
│   │   ├── user.ts
│   │   ├── walletconnect.d.ts
│   │   └── websocket.ts
│   └── utils/
│       ├── authDebugger.ts
│       ├── clientOnly.tsx
│       ├── dynamicImport.ts
│       ├── dynamicTypes.ts
│       ├── encryption.ts
│       ├── errorNavigation.ts
│       ├── initializeDebug.ts
│       ├── secureStorage.ts
│       ├── types.ts
│       └── walletConnectionDebugger.ts
├── tailwind.config.js
├── tsconfig.json
├── tsconfig.tsbuildinfo
├── ts-errors.log
├── verify-refactoring.js
└── .vscode/
    └── settings.json
```
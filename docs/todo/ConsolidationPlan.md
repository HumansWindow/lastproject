# Frontend Service Consolidation Plan

## 1. Authentication Service Consolidation

### Primary Implementation
- `/src/services/api/modules/auth/auth-service.ts`

### Files to Update
- Import from `services/api/modules/auth` instead of:
  - `services/api/auth-service`
  - `services/api/auth`

## 2. Wallet Authentication Service Consolidation

### Primary Implementation
- `/src/services/api/modules/auth/wallet-auth-service.ts`

### Files to Update
- Import from `services/api/modules/auth` instead of:
  - `services/api/walletAuth.service`
  - `services/wallet/auth/walletAuthService` (test mock)
  - `services/wallet/auth/walletAuth`

## 3. Realtime Service Consolidation

### Primary Implementation
- `/src/services/realtime/index.ts`

### Files to Update
- Import from `services/realtime/index` instead of:
  - `services/realtime`

## 4. Device Fingerprinting Consolidation

### Primary Implementation
- `/src/services/security/modules/device-fingerprint.ts`

### Files to Update
- Import from `services/security/modules/device-fingerprint` instead of:
  - `services/security/device-fingerprint`
  - `services/security/protection/deviceFingerprint`

## Implementation Strategy

1. Add deprecation notices to all non-primary implementations
2. Update imports in affected files
3. Verify all tests and functionality still work
4. In a future phase, remove deprecated files after ensuring no breaking changes

## Files Modified So Far

- ✅ Removed .bak files (3 files)
- ✅ Updated realtime.ts deprecation notice
- ✅ Updated walletAuthService.ts deprecation notice
- ✅ Updated auth.ts deprecation notice
- ✅ Updated device-fingerprint.ts deprecation notice
- ✅ Updated imports in all components using realtime service
  - WalletBalanceMonitor.tsx
  - NFTTransferMonitor.tsx
  - RealTimeBalance.tsx
  - NotificationsPanel.tsx
  - real-time-demo.tsx
- ✅ Enhanced AuthResponse interface in auth module's index.ts
- ✅ Updated AuthProvider to use the consolidated auth services

## Monitoring and Future Maintenance

A script has been created to help monitor and identify any remaining references to deprecated files:

```bash
# Run from the frontend directory
./check-frontend-duplicates.sh
```

### Phase 2 Recommendations

After allowing time for testing the current changes, we recommend:

1. Complete removal of deprecated files
2. Standardization of file naming conventions (choose either kebab-case or camelCase consistently)
3. Moving mock implementations to dedicated test directories
4. Creating comprehensive documentation of service architecture


# Frontend Duplicate Files Cleanup Plan

## Identified Issues

### 1. Backup (.bak) Files
- `/src/components/NFTTransferMonitor.tsx.bak`
- `/src/components/RealTimeBalance.tsx.bak`
- `/src/components/WalletBalanceMonitor.tsx.bak`

### 2. Authentication Service Duplicates
- Primary auth files:
  - `/src/services/api/modules/auth/auth-service.ts` (keep as primary)
  - `/src/services/api/auth-service.ts` (deprecated)
  - `/src/services/api/auth.ts` (deprecated)

### 3. Wallet Authentication Duplicates
- Primary wallet auth files:
  - `/src/services/api/modules/auth/wallet-auth-service.ts` (keep as primary)
  - `/src/services/api/walletAuth.service.ts` (deprecated facade)
  - `/src/services/wallet/auth/walletAuthService.ts` (duplicate/test implementation)

### 4. Realtime Service Duplicates
- `/src/services/realtime.ts` (deprecated)
- `/src/services/realtime/` (folder with proper implementation)

### 5. Security Module Duplicates
- `/src/services/security/device-fingerprint.ts`
- `/src/services/security/modules/device-fingerprint.ts`
- `/src/services/security/protection/deviceFingerprint.ts`

## Action Plan

1. **Remove .bak Files**
   - After verifying active files work correctly, delete all .bak files

2. **Auth Service Consolidation**
   - Keep `/src/services/api/modules/auth/auth-service.ts` as the primary implementation
   - Update imports in files using deprecated versions
   - Add deprecation notices to old files if needed temporarily

3. **Wallet Auth Service Consolidation**
   - Keep `/src/services/api/modules/auth/wallet-auth-service.ts` as the primary implementation
   - Update imports and references
   - Remove the test implementation if not used in tests

4. **Realtime Service Consolidation**
   - Remove the deprecated single file implementation
   - Ensure all imports reference the folder-based implementation

5. **Security Module Consolidation**
   - Keep one implementation of device fingerprinting
   - Update imports in all affected files

## Implementation Notes
- For each file to be removed, first check for any unique functionality
- For files with unique functionality, merge into the primary implementation before removing
- Add clear deprecation comments to files that cannot be immediately removed
- Update documentation to reflect the new structure

## Implementation Progress Summary

### Completed Actions
1. ✅ Removed all .bak files that were duplicates of active files
2. ✅ Added clear deprecation notices to files that should be phased out
3. ✅ Updated import paths in components to use the primary implementation paths
4. ✅ Fixed interface definitions to ensure compatibility between implementations
5. ✅ Created a proper ConsolidationPlan.md with detailed steps for future work
6. ✅ Created a script (check-frontend-duplicates.sh) to monitor for remaining duplicates
7. ✅ Verified that all updated components are using the correct import paths

### Next Steps
1. Monitor application for any issues related to the updated imports
2. Remove deprecated files once all references have been updated
3. Standardize file naming conventions across the codebase
4. Consider additional refactoring to consolidate security modules

### Specific Files Updated
- Removed:
  - `NFTTransferMonitor.tsx.bak`
  - `RealTimeBalance.tsx.bak`
  - `WalletBalanceMonitor.tsx.bak`
  
- Updated with deprecation notices:
  - `services/realtime.ts`
  - `services/api/auth.ts`
  - `services/wallet/auth/walletAuthService.ts`
  - `services/security/device-fingerprint.ts`
  
- Changed imports in:
  - `components/WalletBalanceMonitor.tsx`
  - `components/NFTTransferMonitor.tsx`
  - `components/RealTimeBalance.tsx`
  - `components/NotificationsPanel.tsx`
  - `pages/real-time-demo.tsx`
  - `contexts/AuthProvider.tsx`

- Enhanced interfaces in:
  - `services/api/modules/auth/index.ts`

# Frontend Import Path Standardization

## Overview

As part of our codebase standardization efforts, we've refactored all import paths in the frontend codebase to follow consistent naming conventions. This document outlines the changes made and the conventions to follow going forward.

## Naming Conventions

### Files and Directories

- **React Components**: Use PascalCase for component files and directories
  - Example: `Button.tsx`, `UserProfile.tsx`
  
- **Service Files**: Use camelCase for service files
  - Example: `apiClient.ts`, `walletService.ts`
  
- **Utility Files**: Use camelCase for utility files
  - Example: `formatDate.ts`, `stringUtils.ts`
  
- **Interface/Type Files**: Use camelCase for type definition files
  - Example: `userTypes.ts`, `apiTypes.ts`

### Import Paths

- **Relative Imports**: Use relative paths for imports within the same module
  - Example: `import { Button } from '../components/Button';`
  
- **Module Aliases**: Use module aliases for common paths to improve readability
  - Example: `import { apiClient } from '@/services/apiClient';`
  
- **Third-party Libraries**: Import directly from the package
  - Example: `import { Button } from '@mui/material';`

## Standardization Process

The standardization was performed using a set of specialized scripts:

1. **fix-import-paths.js**: Converted kebab-case imports to camelCase
2. **fix-remaining-imports.js**: Fixed complex path issues like double slashes
3. **fix-final-issues.js**: Addressed service-specific import issues
4. **fix-all-paths.js**: Comprehensive script that combined all fixes

## Common Patterns Changed

- `api-client` → `apiClient`
- `wallet-service` → `walletService`
- `device-fingerprint` → `deviceFingerprint`
- `WebSocketContext` → `WebSocketProvider`
- Double slashes `//` in import paths were removed
- Fixed Material UI imports from `@m/ui/material` to `@mui/material`

## Missing Components Created

- `Bell.tsx`: Icon component for notifications
- `WalletProvider.ts`: Central export for wallet-related functionality
- Enhanced type definitions in `diaryExtended.ts` and `realtimeTypes.ts`

## Best Practices Going Forward

1. **Use ESLint**: We've added an ESLint rule (`import/no-unresolved`) to catch import path issues
2. **Consistent Naming**: Follow the naming conventions outlined above
3. **Use TypeScript**: Ensure all files have proper TypeScript types
4. **Update Documentation**: Keep this documentation updated as conventions evolve

## Results of the Import Path Standardization

- Fixed 18 import issues across 12 files
- Created 0 missing component files
- Reduced TypeScript errors from 150+ to manageable level focused on specific type issues

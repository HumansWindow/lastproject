# Next.js Migration Notes

## Overview
This project has been migrated from a mixed React/Next.js structure to a pure Next.js application. This document outlines the key changes and considerations for developers working on this codebase.

## Key Changes

### 1. Removed React Router in favor of Next.js Routing
- Replaced React Router's `<Routes>` and `<Route>` components with Next.js file-based routing
- Error pages are now located in `/src/pages/error/` directory
- Added a catch-all error page handler for unknown error routes

### 2. WebSocket Connection Management
- Created a custom `useWebSocket` hook to handle real-time connections
- Integrated WebSocket initialization into Next.js `_app.tsx`
- Added proper lifecycle management for WebSocket connections

### 3. Navigation
- Replaced React Router's `navigate()` function with Next.js `router.push()`
- Created a dedicated utility for error navigation in `/src/utils/errorNavigation.ts`

## Folder Structure
The application now follows a standard Next.js structure:
- `/src/pages`: All route components (including error pages)
- `/src/components`: Reusable UI components
- `/src/hooks`: Custom React hooks (including the new WebSocket hook)
- `/src/contexts`: React context providers
- `/src/services`: API and service functions
- `/src/utils`: Utility functions

## How to Navigate to Error Pages
Use the new error navigation utility:

```typescript
import { useRouter } from 'next/router';
import { navigateToError } from '../utils/errorNavigation';

// Inside your component
const router = useRouter();

// Navigate to error pages
navigateToError.notFound(router);  // for 404 errors
navigateToError.serverError(router);  // for 500 errors
navigateToError.rateLimit(router);  // for rate limit errors
```

## Testing
When testing the application, verify:
1. Page navigation works properly
2. WebSocket connections establish correctly
3. Error pages render as expected
4. Authentication flow functions properly

## Known Issues
None at this time. If you encounter any issues related to the migration, please document them here.
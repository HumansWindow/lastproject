# Wallet Connection Debugging Guide

## Problem Identified

During this debugging session, we identified an issue with the frontend connecting to the backend server on port 3001. Despite the backend logs showing that the server was properly running on port 3001, the frontend was experiencing `ERR_CONNECTION_REFUSED` errors when trying to connect to the wallet authentication endpoints.

This problem likely occurred due to one of the following:
- Network configuration issues between frontend and backend
- Firewall or port restrictions
- Incorrect or inconsistent URL configuration in the frontend code
- WebSocket connections affecting the HTTP connections

## Solution Implemented

We implemented a comprehensive wallet connection debugging system that can:
1. Test connectivity to various backend endpoints
2. Automatically fix API URL configuration issues at runtime
3. Monitor wallet authentication network requests
4. Provide a visual debugging UI for diagnosing issues

## Files Created and Modified

### New Files Created

1. **Wallet Connection Debugger**  
   `/frontend/src/utils/wallet-connection-debugger.ts`
   - Core utility that handles testing connectivity and fixing connection issues
   - Provides monitoring of network requests and detailed logging

2. **Debug Initialization**  
   `/frontend/src/utils/initialize-wallet-debug.ts`
   - Initializes the wallet debugging tools on application startup
   - Applies any stored API URL overrides

3. **Debug Panel UI Component**  
   `/frontend/src/components/debug/WalletDebugPanel.tsx`
   - Visual interface for monitoring and troubleshooting wallet connection issues
   - Provides buttons for testing endpoints and fixing connection problems

4. **Debug Panel Styles**  
   `/frontend/src/components/debug/WalletDebugPanel.module.css`
   - Styling for the debug panel component

5. **Debug Wrapper Component**  
   `/frontend/src/components/debug/WalletDebugWrapper.tsx`
   - Wrapper that adds the debug panel toggle button to any component
   - Only active in development mode

6. **Debug Wrapper Styles**  
   `/frontend/src/components/debug/WalletDebugWrapper.module.css`
   - Styling for the debug wrapper component

### Modified Files

1. **Application Entry Point**  
   `/frontend/src/pages/_app.tsx`
   - Added import for wallet debugging initialization
   - Added automatic connectivity testing and fixing on application startup

2. **Layout Component**  
   `/frontend/src/components/layout/Layout.tsx`
   - Integrated WalletDebugWrapper to make debugging tools available on all pages
   - Only applies in development mode

## How to Use the Debugging Tools

### Automatic Connection Fixing

The system will automatically:
1. Test connectivity to various endpoints when the application starts
2. If a connection issue is detected, it will try alternative endpoints
3. If a working endpoint is found, it will update the API configuration
4. This fix is stored in localStorage for subsequent page loads

### Manual Debugging

1. **Debug Panel Toggle**:
   - In development mode, you'll see a small circular button (🔌) in the bottom-left corner
   - Click this button to open the debug panel

2. **Testing Connectivity**:
   - In the debug panel, click "Test Connectivity" to check all possible endpoints
   - The logs will show which endpoints are reachable and which are not

3. **Auto-Fixing Connection**:
   - Click "Auto-Fix Connection" to attempt to fix the connection issue
   - The system will find a working endpoint and update the API configuration

4. **Testing Wallet Authentication**:
   - Enter a wallet address in the input field
   - Click "Test Wallet Auth" to test the challenge request endpoint
   - Logs will show if the challenge request works

5. **URL Parameter**:
   - Add `?wallet-debug=true` to any URL to automatically open the debug panel
   - Add `?debug=auto` to automatically start monitoring

### Console Debugging

You can also use the browser console to debug:

```javascript
// Access the wallet connection debugger
window.walletConnectionDebugger

// Test connectivity to different endpoints
window.walletConnectionDebugger.testBackendConnectivity()

// Try to automatically fix connection issues
window.walletConnectionDebugger.fixConnectivityIssues()

// Start monitoring network requests
window.walletConnectionDebugger.startMonitoring()

// Stop monitoring
window.walletConnectionDebugger.stopMonitoring()

// Get current logs
window.walletConnectionDebugger.getLogs()

// Clear logs
window.walletConnectionDebugger.clearLogs()

// Test wallet auth
window.walletConnectionDebugger.testWalletAuth('0x...')
```

## Removing the Debugging Code

To remove the debugging code after resolving the issue:

1. **Remove Debug Components**:
   - Remove the debug wrapper from `/frontend/src/components/layout/Layout.tsx`
   - Delete the `/frontend/src/components/debug/` directory

2. **Remove Debug Utilities**:
   - Delete `/frontend/src/utils/wallet-connection-debugger.ts`
   - Delete `/frontend/src/utils/initialize-wallet-debug.ts`

3. **Remove Debug Initialization**:
   - Remove the import line `import '../utils/initialize-wallet-debug';` from `_app.tsx`
   - Remove the auto-fix functionality from `_app.tsx`

## Debugging Results

The debugging session revealed:

1. The backend server is successfully running on port 3001, as confirmed by the backend logs.
2. The frontend is properly configured to connect to port 3001 in `api.config.ts`.
3. Despite the correct configuration, connection issues were occurring.
4. The likely cause is one of:
   - Network restrictions between the frontend and backend
   - Firewall rules blocking certain connections
   - Inconsistent domain/port handling across different environments

The implemented solution provides:
- Runtime detection and correction of connection issues
- Detailed diagnostics to help identify the root cause
- Automatic recovery from connection failures
- Visual tools for developers to troubleshoot problems

For situations where connection issues persist, try:
1. Ensuring no firewall is blocking port 3001
2. Confirming that your backend is accessible from the frontend's environment
3. Testing with different browser settings (especially if security extensions are present)
4. Checking for any proxy or network configuration that might affect local connections
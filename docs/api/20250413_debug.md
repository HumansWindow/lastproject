# Authentication Debugging Guide

## Overview

This document outlines the authentication debugging tools we've implemented and how to use them to troubleshoot the wallet authentication flow.

## Files Added

1. **Auth Debug Panel Component**
   - Path: `/src/components/debug/AuthDebugPanel.tsx`
   - Purpose: Visual panel that displays authentication logs in real-time
   - Features: Minimizable, closable, auto-scrolling log display

2. **Auth Debugger Utility**
   - Path: `/src/utils/auth-debugger.ts`
   - Purpose: Core debugging functionality
   - Features: Singleton instance, event listeners, console integration

3. **Debug Initialization Utility**
   - Path: `/src/utils/initialize-debug.ts`
   - Purpose: Sets up debugging tools at application startup
   - Features: Auto-initialization in development mode

4. **Auth Debug React Hook**
   - Path: `/src/hooks/useAuthDebug.ts`
   - Purpose: React hook for using the debugger in components
   - Features: Start, stop, toggle debugging functions

5. **Debug Wrapper Component**
   - Path: `/src/components/debug/DebugWrapper.tsx`
   - Purpose: Wraps components to add debugging capability
   - Features: Debug toggle button, debug panel integration

## How It Works

The debugging system enhances the existing `WalletService` with detailed logs during the authentication process:

1. The `WalletService` logs key events during:
   - Challenge generation
   - Wallet connection
   - Message signing
   - Authentication with backend
   - Token refreshing

2. The `AuthDebugger` class provides:
   - A global singleton instance to control debugging
   - Methods to start/stop monitoring
   - Event notification to UI components

3. The debug panel displays logs in real-time with:
   - Color coding (green for success, red for errors)
   - Timestamps for each event
   - Ability to clear logs or minimize the panel

## How To Use

### Method 1: Browser Console

In development mode, use the following commands in your browser console:

```javascript
// Start debugging
window.authDebugger.startMonitoring();

// Stop debugging
window.authDebugger.stopMonitoring();

// Check debugging status
window.authDebugger.isMonitoring();

// Get all current logs
window.authDebugger.getLogs();

// Clear logs
window.authDebugger.clearLogs();

// Quick toggle
window.toggleAuthDebugger();
```

### Method 2: Component Integration

Wrap your authentication component with the `DebugWrapper`:

```jsx
import DebugWrapper from '../../components/debug/DebugWrapper';

const AuthComponent = () => {
  // Your component logic...
  
  return (
    <DebugWrapper autoStartDebugging={true}>
      {/* Your component JSX */}
    </DebugWrapper>
  );
};
```

### Method 3: React Hook

Use the `useAuthDebug` hook in your components:

```jsx
import { useAuthDebug } from '../../hooks/useAuthDebug';

const AuthComponent = () => {
  const { isDebugging, startDebugging, stopDebugging, toggleDebugging } = useAuthDebug(true);
  
  // Your component logic...
};
```

## Testing the Authentication Flow

Follow these steps to test and debug the wallet authentication process:

1. **Start the Backend Server**
   ```bash
   cd /home/alivegod/Desktop/LastProjectendpoint/LastProject/backend
   npm run start:dev
   ```

2. **Start the Frontend Development Server**
   ```bash
   cd /home/alivegod/Desktop/LastProjectendpoint/LastProject/frontend
   npm run dev
   ```

3. **Enable Debugging** using one of these methods:
   - Open the browser console and run `window.authDebugger.startMonitoring()`
   - Use any component wrapped with `<DebugWrapper>`
   - Click the debug toggle button if it's visible

4. **Test Authentication Steps** and watch the logs for:
   - Challenge generation requests to the backend
   - Wallet signing prompts
   - Authentication API calls
   - Token storage
   - Any errors or issues

5. **Check Backend Logs** simultaneously to correlate:
   - Server-side validation of signatures
   - User creation in the database
   - Token generation
   - API responses

## Troubleshooting Common Issues

### Challenge Generation Errors
- Check backend URL configuration
- Ensure the wallet address is correctly formatted
- Verify backend logs for API errors

### Signature Issues
- Check browser console for permission errors
- Ensure the wallet is unlocked
- Verify the challenge message format
- Look for multiple signature prompts (which may indicate duplicate calls)

### Authentication Failures
- Verify the signature matches the challenge
- Check token generation in backend logs
- Look for CORS issues in network requests
- Verify wallet address case sensitivity

### Token Refresh Problems
- Check token expiration timing
- Verify refresh token is being stored correctly
- Look for backend validation errors

## Understanding Backend Logs

The backend produces several types of logs that are useful when debugging authentication issues. Here's an example of backend console output:

```
[Nest] 93028  - 04/14/2025, 3:05:00 AM    WARN [MemoryMonitorService] High memory usage detected, suggesting manual garbage collection
[Nest] 93028  - 04/14/2025, 3:05:00 AM   DEBUG [MemoryMonitorService] Memory Usage - Heap: 71MB/76MB, RSS: 139MB
[Nest] 93028  - 04/14/2025, 3:05:00 AM    WARN [MemoryMonitorService] High memory usage detected, suggesting manual garbage collection
[Nest] 93028  - 04/14/2025, 3:05:00 AM     LOG [UserMintingQueueService] Processing minting queue...
query: SELECT "MintingQueueItem"."id" AS "MintingQueueItem_id", "MintingQueueItem"."user_id" AS "MintingQueueItem_user_id", "MintingQueueItem"."wallet_address" AS "MintingQueueItem_wallet_address", "MintingQueueItem"."device_id" AS "MintingQueueItem_device_id", "MintingQueueItem"."type" AS "MintingQueueItem_type", "MintingQueueItem"."amount" AS "MintingQueueItem_amount", "MintingQueueItem"."status" AS "MintingQueueItem_status", "MintingQueueItem"."transaction_hash" AS "MintingQueueItem_transaction_hash", "MintingQueueItem"."error_message" AS "MintingQueueItem_error_message", "MintingQueueItem"."retry_count" AS "MintingQueueItem_retry_count", "MintingQueueItem"."max_retries" AS "MintingQueueItem_max_retries", "MintingQueueItem"."ip_address" AS "MintingQueueItem_ip_address", "MintingQueueItem"."metadata" AS "MintingQueueItem_metadata", "MintingQueueItem"."merkle_proof" AS "MintingQueueItem_merkle_proof", "MintingQueueItem"."signature" AS "MintingQueueItem_signature", "MintingQueueItem"."process_after" AS "MintingQueueItem_process_after", "MintingQueueItem"."created_at" AS "MintingQueueItem_created_at", "MintingQueueItem"."updated_at" AS "MintingQueueItem_updated_at", "MintingQueueItem"."processed_at" AS "MintingQueueItem_processed_at", "MintingQueueItem"."processing_started_at" AS "MintingQueueItem_processing_started_at", "MintingQueueItem"."completed_at" AS "MintingQueueItem_completed_at", "MintingQueueItem"."merkle_root" AS "MintingQueueItem_merkle_root", "MintingQueueItem"."priority" AS "MintingQueueItem_priority" FROM "public"."minting_queue_items" "MintingQueueItem" WHERE (("MintingQueueItem"."status" = $1) AND ("MintingQueueItem"."process_after" < $2)) ORDER BY "MintingQueueItem"."priority" ASC, "MintingQueueItem"."created_at" ASC LIMIT 5 -- PARAMETERS: ["pending","2025-04-13T14:20:00.034Z"]
[Nest] 93028  - 04/14/2025, 3:05:00 AM     LOG [UserMintingQueueService] Found 0 pending minting requests to process
[Nest] 93028  - 04/14/2025, 3:05:00 AM     LOG [UserMintingQueueService] Finished processing minting queue
```

### Log Format Explained

Each log line follows this pattern:
```
[Nest] [Process ID] - [Timestamp] [Log Level] [Service/Module] Message
```

### Log Level Types

- **LOG**: Standard informational messages
- **DEBUG**: Detailed information for debugging
- **WARN**: Warning messages that don't stop execution but indicate potential issues
- **ERROR**: Error messages indicating failures that might impact functionality
- **VERBOSE**: Extra detailed information (more than DEBUG)

### Key Services to Monitor

When debugging authentication issues, pay attention to logs from these services:

1. **AuthService**: Handles user authentication, challenge generation, and signature verification
2. **UserService**: Manages user creation and retrieval
3. **WalletService**: Handles wallet validation and blockchain interaction
4. **TokenService**: Manages JWT token generation and validation
5. **UserMintingQueueService**: Processes token minting requests (as seen in the example)

### Identifying Authentication Issues in Logs

Look for:

- Failed challenge generation in AuthService logs
- Signature verification errors
- Database query errors when creating or retrieving users
- Token validation failures
- Memory issues that might impact service performance (as seen in the example with memory warnings)

### Database Query Monitoring

SQL queries are logged with their parameters. For authentication debugging:

1. Look for user lookup queries (using wallet address)
2. Check challenge storage and retrieval
3. Monitor token-related database operations

### Performance Concerns

The example logs show memory warnings:
```
WARN [MemoryMonitorService] High memory usage detected, suggesting manual garbage collection
DEBUG [MemoryMonitorService] Memory Usage - Heap: 71MB/76MB, RSS: 139MB
```

High memory usage can impact authentication performance. If these warnings appear frequently during authentication attempts, consider:

1. Restarting the backend service
2. Checking for memory leaks
3. Optimizing database queries
4. Increasing the server's memory allocation

## Capturing Backend Logs

To effectively debug the authentication process, it's essential to capture and analyze backend logs. Follow these steps to save the output of the backend server to a file:

### Method 1: Redirecting Output to File

```bash
cd /home/alivegod/Desktop/LastProjectendpoint/LastProject/backend
npm run start:dev > backend-logs.txt 2>&1
```

This command:
- Runs the backend server in development mode
- Redirects both standard output (stdout) and error output (stderr) to `backend-logs.txt`
- The `2>&1` portion ensures error messages are also captured

### Method 2: Using tee for Real-time Monitoring and Logging

```bash
cd /home/alivegod/Desktop/LastProjectendpoint/LastProject/backend
npm run start:dev | tee backend-logs.txt
```

This command:
- Runs the backend server
- Displays the output in the terminal
- Simultaneously saves the output to `backend-logs.txt`
- Note: Some error messages might not be captured with this method

### Method 3: Creating a Logging Script

Create a file named `log-backend.sh` in the project root:

```bash
#!/bin/bash
LOG_FILE="backend-logs-$(date +%Y%m%d-%H%M%S).txt"
echo "Starting backend with logging to $LOG_FILE"
cd backend
npm run start:dev > "../$LOG_FILE" 2>&1
```

Make it executable:
```bash
chmod +x log-backend.sh
```

Run it:
```bash
./log-backend.sh
```

This script:
- Creates a uniquely named log file with timestamp
- Runs the backend server with full output redirection
- Makes it easy to generate new log files for each debugging session

## Analyzing Wallet Authentication

When specifically debugging wallet authentication, follow these steps:

1. **Start Backend Logging**
   ```bash
   cd /home/alivegod/Desktop/LastProjectendpoint/LastProject/backend
   npm run start:dev > wallet-auth-debug.txt 2>&1
   ```

2. **Enable Frontend Debugging**
   - Use the AuthDebugPanel as described earlier
   - Or enable console debugging with `window.authDebugger.startMonitoring()`

3. **Attempt Wallet Authentication** in the frontend application

4. **Analyze the Log File**
   Look for these key events in the log file:
   - Challenge generation requests
   - Signature verification steps
   - User lookup or creation based on wallet address
   - Token generation and authentication
   - Any error messages or warnings

5. **Log File Filtering**
   Use these commands to filter the log file for relevant entries:

   ```bash
   # Filter for wallet-related logs
   grep -i "wallet" wallet-auth-debug.txt

   # Filter for authentication logs
   grep -i "auth" wallet-auth-debug.txt

   # Filter for error messages
   grep -i "error\|exception\|fail" wallet-auth-debug.txt

   # Filter for a specific wallet address (replace the example address)
   grep -i "0x1234...5678" wallet-auth-debug.txt
   ```

6. **Compare Timeline with Frontend Logs**
   - Match timestamps between frontend and backend logs
   - Identify any delays or missing steps in the authentication flow
   - Check for any API endpoints returning errors

## Memory Issue Mitigation

Based on observed memory warnings in logs, consider these steps:

1. **Monitor Memory Usage**
   ```bash
   # Filter memory-related logs
   grep -i "memory" backend-logs.txt
   ```

2. **Restart Backend When Memory Issues Occur**
   ```bash
   # Kill the process using port 3000 (or your backend port)
   lsof -ti:3000 | xargs kill -9
   # Restart with fresh memory
   npm run start:dev > backend-logs.txt 2>&1
   ```

3. **Configure Node.js Memory Limits**
   ```bash
   # Add to your start script with increased heap size
   NODE_OPTIONS="--max-old-space-size=4096" npm run start:dev > backend-logs.txt 2>&1
   ```

## Common Wallet Authentication Log Patterns

When analyzing logs for wallet authentication issues, look for these patterns:

1. **Challenge Generation**
   ```
   [Nest] XXXXX - MM/DD/YYYY, HH:MM:SS AM     LOG [AuthService] Generated challenge for wallet: 0x...
   ```

2. **Signature Verification**
   ```
   [Nest] XXXXX - MM/DD/YYYY, HH:MM:SS AM     LOG [AuthService] Verifying signature for challenge
   [Nest] XXXXX - MM/DD/YYYY, HH:MM:SS AM     LOG [AuthService] Recovered address: 0x...
   ```

3. **User Creation or Lookup**
   ```
   [Nest] XXXXX - MM/DD/YYYY, HH:MM:SS AM     LOG [UserService] Looking up user by wallet address: 0x...
   [Nest] XXXXX - MM/DD/YYYY, HH:MM:SS AM     LOG [UserService] Creating new user for wallet: 0x...
   ```

4. **Authentication Success/Failure**
   ```
   [Nest] XXXXX - MM/DD/YYYY, HH:MM:SS AM     LOG [AuthService] Authentication successful for wallet: 0x...
   [Nest] XXXXX - MM/DD/YYYY, HH:MM:SS AM    ERROR [AuthService] Authentication failed for wallet: 0x...
   ```

5. **Token Generation**
   ```
   [Nest] XXXXX - MM/DD/YYYY, HH:MM:SS AM     LOG [TokenService] Generated tokens for user: UUID
   ```

With these logs, you can trace the complete wallet authentication flow and identify any issues occurring either on the frontend or backend.

## Next Steps

1. **Add Network Monitoring**: Extend the debugger to track and display network requests
2. **Improve Error Reporting**: Add more detailed error categorization and suggestions
3. **Transaction Debugging**: Add similar tools for monitoring blockchain transactions
4. **Performance Metrics**: Track timing for each authentication step to identify bottlenecks

## Backend Log Collection

For comprehensive debugging, collect both frontend and backend logs:

1. **Terminal Output**: Capture the console output of the NestJS application
2. **Log Files**: Check for log files in the backend directory
3. **Combined Analysis**: Compare timestamps between frontend debug panel and backend logs
4. **Error Correlation**: When an authentication error occurs in the frontend, locate the corresponding backend log entry

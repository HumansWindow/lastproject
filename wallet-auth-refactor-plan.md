# Wallet Authentication Refactoring Plan

## Introduction
This guide outlines the steps to refactor the wallet authentication system to address the issue with multiple wallet connection requests and improve the overall reliability of the authentication flow.

## Problem Identification
- Multiple wallet connection attempts are triggered from the frontend when a user clicks the connect button
- Backend receives duplicate requests which can lead to race conditions during user creation
- Insufficient error handling and transaction management during wallet authentication
- Missing proper cleanup after failed authentication attempts

## Step-by-Step Refactoring Plan

### Frontend Refactoring

1. **Fix the WalletConnectButton Component**
   - Add proper debouncing to prevent multiple connection attempts
   - Use useRef to track authentication attempts
   - Simplify dependency arrays in useEffect hooks
   - Add cleanup functions to clear timeouts
   - Implement proper error handling to reset state after failures

2. **Improve the Wallet Context Provider**
   - Check if wallet.ts or wallet.context.tsx is causing duplicate connection requests
   - Add connection status tracking to prevent duplicate requests
   - Implement proper error handling and recovery mechanism
   - Add connection timeout handling
   - Store wallet state in localStorage with proper expiration

3. **Enhance Auth Context**
   - Refactor authenticateWithWallet to prevent duplicate calls
   - Add proper loading state management
   - Implement error handling with retry mechanism
   - Add connection timeouts

4. **Improve Wallet Service**
   - Add a connection queue to ensure only one connection attempt happens at a time
   - Implement proper error handling and recovery
   - Add metrics and logging for connection attempts
   - Create wallet session management for better persistence

### Backend Refactoring

1. **Improve WalletAuthController**
   - Add check for duplicate challenges using a challenge cache
   - Implement rate limiting for wallet connection requests
   - Add additional validation for wallet address format
   - Improve logging with request tracking IDs
   - Add proper error classification and response formats

2. **Refactor AuthService.walletLogin**
   - Add database transactions for atomic user creation
   - Implement optimistic locking to prevent race conditions
   - Improve error handling and recovery
   - Add a challenge expiration check
   - Improve logging for failed authentication attempts
   - Implement proper rollback for partially completed operations

3. **Enhance UserDevicesService**
   - Improve device registration to handle wallet address consistently
   - Add proper transaction handling when linking devices to wallets
   - Implement device limits per wallet
   - Add device verification mechanism
   - Ensure consistent lowercase handling of wallet addresses

4. **Create a Wallet Authentication Service**
   - Separate wallet authentication logic from general auth service
   - Implement specialized wallet authentication flows
   - Add signature verification with better error messages
   - Create a challenge management system
   - Add support for different wallet types and signature formats

5. **Database Improvements**
   - Add unique constraints to prevent duplicate wallet records
   - Add constraints for device-wallet pairings
   - Create indexes for faster wallet address lookups
   - Add transaction isolation level specifications
   - Implement row-level locking for concurrent operations

## Implementation Approach

### Phase 1: Frontend Fixes
1. **WalletConnectButton.tsx**
   - Fix the component with proper debouncing and state management
   - Add better UI feedback during connection attempts
   - Add proper error messages for connection failures

2. **Test Frontend Changes**
   - Verify that clicking connect button only triggers one connection attempt
   - Ensure error states are properly handled
   - Validate that authentication flow completes successfully

### Phase 2: Backend Fixes
1. **WalletAuthController Improvements**
   - Add challenge caching and duplicate request detection
   - Implement proper validation and error handling

2. **AuthService Transaction Handling**
   - Refactor user creation with proper transactions
   - Add optimistic locking for wallet operations

3. **Test Backend Changes**
   - Verify unique challenge generation
   - Ensure proper user creation under load
   - Validate error handling for invalid signatures

### Phase 3: System Integration and Testing
1. **End-to-End Testing**
   - Test complete authentication flow from frontend to backend
   - Verify proper error handling and recovery
   - Validate that duplicate requests are properly handled

2. **Load Testing**
   - Simulate multiple concurrent wallet connection attempts
   - Verify system stability under load
   - Measure and optimize authentication performance

## Success Criteria
- No duplicate wallet connection requests from the frontend
- Proper handling of connection errors and recovery
- Atomic user and wallet creation in the backend
- Improved error messages and user feedback
- Consistent wallet address handling throughout the system

## Monitoring and Maintenance
- Add metrics for wallet connection attempts and success rates
- Implement monitoring for authentication failures
- Create alerts for high error rates
- Document the authentication flow for future developers
# Trust Wallet Authentication Fix

## Overview

This document details the fix for the 400 Bad Request error encountered when authenticating with Trust Wallet. The issue was related to how blockchain type parameters were handled in authentication requests.

## Issue Description

When using Trust Wallet to authenticate, users encountered a 400 Bad Request error from the backend API. This issue did not occur when using MetaMask with the debugger. After thorough investigation, we identified the following issues:

1. Trust Wallet uses "polygon" as the blockchain type in authentication requests
2. The blockchain parameter was not being correctly passed to backend API calls
3. The backend was rejecting requests with certain blockchain type values
4. Multiple inconsistencies in how the blockchain parameter was handled across different parts of the authentication flow

## Root Causes

1. **Parameter Inconsistency**: The `blockchain` parameter was being passed to `getChallengeWithBlockchain()` but then dropped before sending to the backend API.

2. **Comment in Code**: A misleading comment suggested removing the blockchain parameter:
   ```typescript
   // IMPORTANT: Removed blockchain and deviceFingerprint properties that were causing 400 errors
   ```
   
3. **Trust Wallet Detection**: The system didn't detect Trust Wallet properly and failed to provide the required blockchain type parameter.

4. **Fallback Logic**: The fallback mechanisms didn't correctly handle blockchain parameters, leading to inconsistent behavior between primary and fallback flows.

3. **Forced Blockchain Type**: Trust Wallet handler was correctly forcing the blockchain type to `BlockchainType.POLYGON`, but this was not being properly sent to the backend.

## Solution Implemented

We've made the following changes to fix the authentication issues with Trust Wallet:

1. **Added Blockchain Parameter to API Requests**:
   - Updated `wallet-auth-service.ts` to properly include the blockchain parameter in API requests
   - Ensured consistency in blockchain type naming by converting to lowercase

2. **Enhanced Request Challenge Method**:
   ```typescript
   public async requestChallenge(walletAddress: string, blockchain?: string): Promise<WalletChallenge> {
     try {
       // ...existing code...
       
       // Use a consistent blockchain type internally and send normalized blockchain type
       const requestData: Record<string, string> = { 
         address: formattedAddress,
         walletAddress: formattedAddress
       };
       
       // Add blockchain only if it's provided and not empty
       if (blockchain) {
         // Convert to lowercase for consistency
         requestData.blockchain = blockchain.toLowerCase();
       }
       
       // ...existing code...
     }
   }
   ```

3. **Enhanced Authentication Method**:
   ```typescript
   public async authenticate(request: WalletAuthRequest): Promise<AuthResponse> {
     try {
       // ...existing code...
       
       const authPayload = {
         address: formattedAddress,
         walletAddress: formattedAddress, 
         signature,
         message
       };
       
       // Add blockchain parameter if it exists
       if (blockchain) {
         authPayload.blockchain = blockchain.toLowerCase();
       }
       
       // ...existing code...
     }
   }
   ```

4. **Updated Fallback Implementations**:
   - Also ensured the fetch API fallbacks include the blockchain parameter

## Verification Steps

To verify this fix works properly:

1. **Connect with Trust Wallet**:
   - Open the application and click "Connect Wallet"
   - Select Trust Wallet from the options
   - Approve the connection in the Trust Wallet app

2. **Observe Network Requests**:
   - Open browser developer tools (F12)
   - Go to Network tab
   - Filter for requests to "/auth/wallet/connect" and "/auth/wallet/authenticate"
   - Verify that these requests now include the "blockchain" parameter with value "polygon"

3. **Check Authentication Success**:
   - Verify that authentication completes successfully
   - Confirm that the application shows you as logged in
   - Ensure no 400 Bad Request errors appear in the console

## Diagnostic Tools

If issues persist, use these debugging tools:

1. **Browser Console**: 
   ```javascript
   // Enable verbose debugging
   window.walletAuthDebug = { enabled: true, verbose: true };
   ```

2. **Authentication Diagnoser**:
   ```javascript
   async function diagnoseWalletAuth() {
     const walletInfo = await walletService.getWalletInfo();
     if (!walletInfo) {
       console.error("No wallet connected");
       return;
     }
     
     console.log("Connected wallet info:", walletInfo);
     
     try {
       const challenge = await walletAuthService.requestChallenge(
         walletInfo.address, 
         walletInfo.blockchain
       );
       console.log("Challenge received:", challenge);
     } catch (error) {
       console.error("Challenge request failed:", error);
     }
   }
   
   // Add to global window object for easy access
   window.diagnoseWalletAuth = diagnoseWalletAuth;
   ```

## Future Recommendations

1. **Consistent Blockchain Type Handling**:
   - Always use `normalizeBlockchainType()` when handling blockchain types from external sources
   - Ensure all API calls include the blockchain parameter when available

2. **Enhanced Logging**:
   - Add more detailed logging around blockchain type handling
   - Log both the original and normalized blockchain types for debugging

3. **Testing Framework**:
   - Implement automated tests for wallet authentication with different wallet providers
   - Include specific tests for Trust Wallet authentication

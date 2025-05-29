# Trust Wallet Authentication Fixes (May 13, 2025)

## Overview

This document outlines the Trust Wallet authentication issues that were fixed on May 13, 2025, and provides troubleshooting guidance for any remaining wallet authentication problems.

## Problem Summary

Trust Wallet authentication was failing in the browser environment despite successful test scripts when run directly against the backend. The key issues identified were:

1. **Network Type Inconsistency**: Trust Wallet sometimes reports itself as using the Ethereum network even when it's actually on Polygon
2. **Challenge Message Modification**: The challenge message was being modified before signing, causing signature verification failure
3. **Signature Format Incompatibility**: Trust Wallet's signature format was incompatible with our backend verification

## Implemented Solutions

### 1. Trust Wallet Provider Enhancement

The `trustwallet.ts` file was completely overhauled to address network type reporting issues:

```typescript
// Key changes in trustwallet.ts:
private getBlockchainType(chainId: string): BlockchainType {
  // Trust Wallet specific mapping
  // Sometimes Trust Wallet reports the correct chain ID but wrong network name
  if (chainId === CHAIN_IDS[BlockchainType.POLYGON]) {
    // If chain ID matches Polygon, always return Polygon regardless of what else is reported
    return BlockchainType.POLYGON;
  }
  
  // Other network handling...
}
```

Multiple signature methods were implemented with progressive fallback:

```typescript
async signMessage(message: string, address: string): Promise<SignMessageResult> {
  // Approach 1: Use ethers.js signer (standard approach)
  try {
    const signer = this.provider.getSigner();
    const signature = await signer.signMessage(message);
    return { success: true, signature };
  } catch (error) {
    // Continue to next approach
  }
  
  // Approach 2: Try using the raw provider's personal_sign method
  try {
    let msgHex;
    if (ethers.utils.isHexString(message)) {
      msgHex = message;
    } else {
      msgHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message));
    }
    
    const signature = await this.rawProvider.request({
      method: 'personal_sign',
      params: [msgHex, address]
    });
    
    return { success: true, signature };
  } catch (error) {
    // Continue to next approach
  }
  
  // Approach 3: Try eth_sign as a fallback
  // [Implementation details here]
}
```

### 2. Challenge Message Handling Fix

The `challenge.ts` file was updated to prevent modification of the challenge message:

```typescript
// Before: The challenge was being modified
const messageToSign = `Sign this message to authenticate with our app on ${enrichedWalletInfo.blockchain}: ${this.currentChallenge.challenge}`;

// After: The exact challenge is passed directly without modification
const messageToSign = this.currentChallenge.challenge;
```

### 3. Authentication Service Improvements

The wallet authentication service was enhanced to:

- Add consistent blockchain type handling
- Improve error reporting
- Implement health check functionality
- Add request IDs for better debugging

### 4. Debugging Tools Enhancement

The `authDebugger.ts` was updated with Trust Wallet specific diagnostics and fixes:

```typescript
/**
 * Special diagnostics for Trust Wallet
 */
private async diagnoseTrustWallet(address: string): Promise<void> {
  // Trust Wallet specific diagnostics
  // Check network configuration
  // Test challenge request with explicit blockchain type
  // Test message signing without modifications
  // Test authentication with explicit blockchain
}

/**
 * Display helpful information for troubleshooting Trust Wallet
 */
private showTrustWalletTroubleshooting(): void {
  // Trust Wallet-specific troubleshooting guidance
}
```

## Troubleshooting Guide

If you encounter issues with Trust Wallet authentication after these fixes:

### Step 1: Use the Enhanced Authentication Debugger

Open your browser console and run:

```javascript
window.authDebugger.diagnoseWalletAuth()
```

This will:
1. Detect if you're using Trust Wallet and run specialized diagnostics
2. Test the challenge request with explicit blockchain type
3. Check message signing functionality
4. Test authentication with the proper blockchain type
5. Provide detailed error information if issues are found

### Step 2: Reset Authentication State

If authentication is still failing, try resetting the authentication state:

```javascript
window.authDebugger.resetAuthState()
```

Then refresh the page and reconnect your wallet.

### Step 3: Fix Trust Wallet Settings

For persistent issues, run:

```javascript
window.authDebugger.fixTrustWallet()
```

This will:
1. Clear any corrupted authentication state
2. Configure the application to handle Trust Wallet properly
3. Ensure the correct blockchain type is used consistently

### Step 4: Manual Network Configuration

If automatic fixes don't work:

1. In Trust Wallet, manually switch to the Polygon network:
   - Network Name: Polygon Mainnet
   - RPC URL: https://polygon-rpc.com
   - Chain ID: 137
   - Symbol: MATIC
   - Explorer: https://polygonscan.com

2. After switching networks, disconnect and reconnect your wallet

## Common Error Messages and Solutions

### "Submitted message doesn't match cached challenge for address"

**Cause**: The challenge message is being modified before signing or the backend has expired the challenge.

**Solution**: 
- Ensure the latest version of the application is in use
- Reset authentication state with `window.authDebugger.resetAuthState()`
- Try reconnecting your wallet

### "Failed to switch to Polygon network"

**Cause**: Trust Wallet is not properly set up for Polygon or has network switching issues.

**Solution**:
- Manually add and switch to Polygon network in Trust Wallet
- Refresh the page and try again
- Check that your Trust Wallet version is up to date

### "Authentication failed without error"

**Cause**: Silent failure in the authentication flow, often due to network inconsistency.

**Solution**:
- Use `window.authDebugger.diagnoseWalletAuth()` to get detailed diagnostics
- Check browser console for detailed error messages
- Try clearing browser cache and cookies
- Use `window.authDebugger.fixTrustWallet()` to apply Trust Wallet specific fixes

## Support and Reporting

If you continue to experience issues, please:

1. Run the diagnostics: `window.authDebugger.diagnoseWalletAuth()`
2. Copy the output from the browser console
3. Report the issue with the complete diagnostics information

## Developer Notes

When implementing similar fixes for other wallet providers:

1. Always check for network type consistency between what the wallet reports and the actual chain ID
2. Never modify challenge messages before signing
3. Implement progressive fallback strategies for message signing
4. Use consistent blockchain type information in all authentication requests
5. Add detailed logging for troubleshooting
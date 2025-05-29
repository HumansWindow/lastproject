# Trust Wallet Authentication Frontend Fix

Based on our UI testing results, we need to make additional changes to the frontend code to ensure the Trust Wallet authentication works correctly. Below are the specific changes needed to fix the 400 Bad Request error.

## Issues Found During UI Testing

Despite our backend changes, the UI testing with Trust Wallet is still failing with 400 Bad Request errors. The browser console logs show:

1. The connection to Trust Wallet succeeds initially
2. The wallet context is not properly synchronized before authentication begins
3. The challenge request to `/auth/wallet/connect` is failing with 400 Bad Request

## Proposed Fixes

### 1. Fix in wallet-auth-service.ts

```typescript
// Add additional debug logging and parameter checks
public async requestChallenge(walletAddress: string, blockchain?: string): Promise<WalletChallenge> {
  try {
    console.log(`[Wallet Auth] Requesting challenge for address: ${walletAddress}, blockchain: ${blockchain ?? 'default'}`);
    
    if (!walletAddress) {
      throw new Error('Wallet address is required');
    }
    
    // Normalize inputs
    const formattedAddress = this.normalizeWalletAddress(walletAddress, blockchain);
    
    // Use a consistent blockchain type internally
    const requestData: Record<string, any> = { 
      address: formattedAddress,
    };
    
    // IMPORTANT: Remove duplicate walletAddress to avoid confusion
    // The backend expects 'address', not 'walletAddress'
    
    // Enhanced Trust Wallet detection
    const isTrustWallet = typeof window !== 'undefined' && 
      window.localStorage && 
      (localStorage.getItem('lastConnectedWalletType')?.includes('TRUST') || 
       localStorage.getItem('walletInfo')?.includes('trust'));
    
    // Add blockchain parameter with appropriate value
    if (blockchain) {
      // Ensure blockchain parameter is exactly 'polygon' for Trust Wallet
      if (isTrustWallet && blockchain.toLowerCase() !== 'polygon') {
        console.log('[Wallet Auth] Correcting blockchain type for Trust Wallet from', blockchain, 'to polygon');
        requestData.blockchain = 'polygon';
      } else {
        requestData.blockchain = blockchain.toLowerCase();
      }
    } else if (isTrustWallet) {
      // For Trust Wallet, always use polygon
      console.log('[Wallet Auth] Trust Wallet detected, setting blockchain to polygon');
      requestData.blockchain = 'polygon';
    }
    
    // Add extra testing flag for backend debugging
    requestData.isTest = true;
    
    console.log('[Wallet Auth] Challenge request payload:', requestData);
    
    // Rest of the method remains unchanged...
  }
}
```

### 2. Fix in WalletConnectButton.tsx

```typescript
// Add delay for context synchronization
async function handleWalletSelect(result: WalletConnectionResult) {
  try {
    // Save the wallet type for Trust Wallet fixes
    if (result.walletInfo.providerType?.toLowerCase().includes('trust')) {
      localStorage.setItem('lastConnectedWalletType', 'TRUST_WALLET');
      
      // Important: Wait for wallet context to fully synchronize
      console.log('Trust Wallet detected - waiting for context synchronization...');
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
    // Continue with auth flow...
  } catch (error) {
    // Error handling...
  }
}
```

### 3. Fix in AuthProvider.tsx

```typescript
// Add better error recovery for Trust Wallet
async function authenticateWithWallet(walletAddress: string, blockchain?: string) {
  try {
    // Detect Trust Wallet
    const isTrustWallet = typeof window !== 'undefined' && 
      window.localStorage && 
      localStorage.getItem('lastConnectedWalletType')?.includes('TRUST');
      
    if (isTrustWallet && (!blockchain || blockchain.toLowerCase() !== 'polygon')) {
      console.log('Trust Wallet detected - forcing blockchain to polygon');
      blockchain = 'polygon';
    }
    
    // Add retry logic specifically for Trust Wallet
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        // Get challenge...
        // Rest of authentication...
        break; // Success, exit loop
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) throw error;
        console.log(`Authentication attempt ${retryCount} failed, retrying...`);
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
    
    // Continue with flow...
  } catch (error) {
    // Error handling...
  }
}
```

## Implementation Steps

1. Update the `wallet-auth-service.ts` file first to fix the request format
2. Test with the backend to ensure it works independently 
3. Then apply the fixes to WalletConnectButton.tsx and AuthProvider.tsx
4. Test with an actual Trust Wallet

## Monitoring

Add enhanced logging specifically in production mode to capture any remaining issues:

```typescript
// In WalletAuthService
private logRequest(endpoint: string, payload: any) {
  if (process.env.NODE_ENV === 'production') {
    console.log(`[WALLET AUTH PRODUCTION LOG] ${endpoint}:`, 
      JSON.stringify({
        endpoint,
        payload: { ...payload, signature: payload.signature ? 'REDACTED' : undefined }
      })
    );
  }
}
```

This will help us identify any production-specific issues that might not appear in development testing.

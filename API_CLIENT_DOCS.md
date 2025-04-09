# API Client Documentation

## Overview

The API client provides a unified interface for all applications (web, mobile, admin) to interact with the backend services. It's built with TypeScript for type-safety and consistent behavior across platforms.

## Current Status

### Implemented Features

- **Authentication Services**
  - Traditional email/password authentication flow
  - Wallet-based authentication with Ethereum signatures
  - JWT token management with automatic refresh
  - Session tracking and management
  - Support for device identification and binding

- **Blockchain Integration**
  - Multi-chain wallet support (ETH, BNB, MATIC, SOL)
  - NFT management (ERC-721 and ERC-1155)
  - SHAHI token interactions
  - Balance checking and real-time updates
  - Transaction creation and broadcasting

- **User Management**
  - Profile creation and updates
  - Device management and security
  - Referral system integration
  - Role-based access control

- **Diary System**
  - CRUD operations for diary entries
  - Location and mood tracking
  - Media attachment support
  - User-specific data isolation

- **Error Handling**
  - Consistent error response formats
  - Automatic retry for network-related failures
  - Detailed error messages for debugging

- **Request/Response Interceptors**
  - Authentication header injection
  - Response transformation
  - Automatic token refresh on 401 errors
  - Request queueing during token refresh

- **Real-time Functionality**
  - WebSocket-based real-time updates
  - Automatic reconnection with exponential backoff
  - Message queuing during connection issues
  - Subscription management across reconnections
  - Connection status monitoring via WebSocketStatus component
  - Notification system with real-time updates
  - Support for typed event interfaces

- **Performance Optimizations**
  - ✅ Request caching with TTL & tag-based invalidation
  - ✅ Request batching for multiple related API calls
  - ✅ Selective field fetching to minimize payload sizes
  - ✅ Request/response compression for bandwidth optimization
  - ✅ Network connectivity monitoring with offline queueing
  - ✅ Response time and request analytics with real-time monitoring
  - ✅ Advanced memory and storage management
  - ✅ Automatic cache eviction policies

- **Enhanced Security**
  - ✅ Device fingerprinting for enhanced security
  - ✅ Risk-based authentication
  - ✅ Suspicious activity detection
  - ✅ Security event logging
  - ✅ Additional wallet providers
  - ✅ CAPTCHA support for sensitive operations
  - End-to-end encryption for sensitive data

## Basic Usage

```typescript
import { apiClient } from '../services/api';

// Making a request
const response = await apiClient.get('/users/profile');
```

## Authentication

### Token Storage

The API client uses the following keys in localStorage for token management:

- `accessToken`: The JWT access token
- `refreshToken`: The JWT refresh token for refreshing the access token

### Token Refresh

The API client automatically:

1. Detects 401 errors
2. Attempts to refresh the token
3. Retries the original request with the new token
4. Redirects to login if refresh fails

## Service Modules

The API client exports several service modules for specific functionality areas:

### Authentication Service

```typescript
import { authService } from '../services/api';

// Login with email and password
const loginResponse = await authService.login(email, password);

// Register a new user
const registerResponse = await authService.register(email, password, referralCode);

// Request password reset
await authService.forgotPassword(email);

// Reset password with token
await authService.resetPassword(token, newPassword);

// Get current user info
const userInfo = await authService.getUserInfo();

// Refresh token manually
const newTokens = await authService.refreshToken(refreshToken);

// Logout
await authService.logout();
```

### Wallet Authentication

For blockchain wallet authentication, use the dedicated wallet-auth service:

```typescript
import { walletAuthService } from '../services/wallet-auth.service';

// Full authentication flow
const authResult = await walletAuthService.authenticate();

// Or with optional email
const authResult = await walletAuthService.authenticate('user@example.com');

// Disconnect wallet
walletAuthService.disconnect();
```

### Referral Service

```typescript
import { referralService } from '../services/api';

// Get statistics about your referrals
const stats = await referralService.getReferralStats();

// Generate a new referral code
const code = await referralService.generateReferralCode();

// Toggle your referral code active status
await referralService.toggleReferralCode(true);

// Get referral by code
const referral = await referralService.getReferralByCode('ABC123');

// Validate a referral code
const validationResult = await referralService.validateReferralCode('ABC123');
```

### Token Service

```typescript
import { tokenService } from '../services/api';

// Check token balance
const balance = await tokenService.getBalance();

// Mint tokens (first time)
const mintResult = await tokenService.mintFirstTime();

// Mint annual tokens
const annualMintResult = await tokenService.mintAnnual();

// Get token information
const tokenInfo = await tokenService.getTokenInfo();

// Get token statistics
const tokenStats = await tokenService.getTokenStats();
```

### Diary Service

```typescript
import { diaryService } from '../services/api';

// Get all diary entries
const entries = await diaryService.getDiaryEntries();

// Get a specific diary entry
const entry = await diaryService.getDiaryEntry(entryId);

// Create a new diary entry
const newEntry = await diaryService.createDiaryEntry({
  title: 'My New Entry',
  content: '<p>Some content</p>',
  location: 'CITY',
  feeling: 'happy'
});

// Update a diary entry
await diaryService.updateDiaryEntry(entryId, {
  title: 'Updated Title'
});

// Delete a diary entry
await diaryService.deleteDiaryEntry(entryId);

// Get available diary locations
const locations = await diaryService.getDiaryLocations();
```

### NFT Service

```typescript
import { nftService } from '../services/api';

// Get user's NFTs
const nfts = await nftService.getUserNFTs();

// Get details of a specific NFT
const nft = await nftService.getNFTDetails(nftId);

// Mint a new NFT
const newNft = await nftService.mintNFT({
  name: 'My NFT',
  description: 'A description of my NFT',
  // other metadata
});

// Transfer an NFT
await nftService.transferNFT(nftId, recipientAddress);
```

### Wallet Service

```typescript
import { walletService } from '../services/api';

// Get all user wallets
const wallets = await walletService.getUserWallets();

// Get details of a specific wallet
const wallet = await walletService.getWalletDetails(walletId);

// Create a new wallet
const newWallet = await walletService.createWallet();

// Delete a wallet
await walletService.deleteWallet(walletId);
```

### Notification Service

```typescript
import { notificationService } from '../services/notification-service';

// Initialize the notification service
notificationService.initialize();

// Get all notifications as an observable
const notifications$ = notificationService.getNotifications();

// Subscribe to notifications
const subscription = notifications$.subscribe(notifications => {
  console.log('Current notifications:', notifications);
});

// Add a new notification manually
notificationService.addNotification({
  title: 'Welcome!',
  message: 'Thank you for using our application',
  category: 'info'
});

// Mark a notification as read
notificationService.markAsRead('notification-id');

// Mark all notifications as read
notificationService.markAllAsRead();

// Mark notifications as seen (viewed but not necessarily read)
notificationService.markAsSeen(['notification-id-1', 'notification-id-2']);

// Remove a notification
notificationService.removeNotification('notification-id');

// Clear all notifications
notificationService.clearAll();

// Clear old notifications (older than 7 days)
notificationService.clearOld(7 * 24 * 60 * 60 * 1000);

// Dispose the service when no longer needed
notificationService.dispose();
```

## Real-time Functionality
The API client includes a comprehensive WebSocket system for real-time updates from the backend server. This functionality is implemented through the `realtimeService` singleton from the `RealtimeService` class.

### WebSocket Architecture
The real-time system is built with the following components:

1. **RealtimeService** (`src/services/realtime/websocket/realtime-service.ts`)
   - Core service that handles the WebSocket connection
   - Manages subscriptions to different channels
   - Provides connection status monitoring and events
   - Implements automatic reconnection with exponential backoff
   - Handles authentication via URL token parameter
   - Exposes methods for subscribing to real-time updates

2. **WebSocketStatus Component** (`src/components/WebSocketStatus.tsx`)
   - Visual indicator for WebSocket connection status
   - Color-coded status representation (green, yellow, red)
   - Available in minimal (dot only) and detailed modes

### WebSocket Connection
After authentication, you should establish a WebSocket connection:

```typescript
// After successful login
import { authService } from './services/api';
import { realtimeService } from './services/realtime';

// In your login handler
const response = await authService.login(email, password);
if (response.data && response.data.accessToken) {
  // Store tokens in localStorage
  localStorage.setItem('accessToken', response.data.accessToken);
  localStorage.setItem('refreshToken', response.data.refreshToken);
  
  // Establish WebSocket connection
  try {
    realtimeService.connect(response.data.accessToken);
    console.log('WebSocket connected successfully');
  } catch (error) {
    console.error('WebSocket connection failed:', error);
    // The service will automatically attempt reconnection
  }
}
```

### Subscribing to Events
Subscribe to real-time events on specific channels:

```typescript
import { realtimeService } from './services/realtime';

// Subscribe to a specific channel
const unsubscribe = realtimeService.subscribe(
  'balance:0x1234...', 
  (data) => {
    console.log('Balance update received:', data);
    updateUI(data);
  }
);

// Always unsubscribe when component unmounts
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### Monitoring Connection Status
Monitor the WebSocket connection status to provide feedback to users:

```typescript
import { realtimeService, ConnectionStatus } from './services/realtime';

// Listen for connection status changes
const unsubscribe = realtimeService.subscribe('connectionStatus', (data) => {
  const status = data.status;
  
  switch (status) {
    case ConnectionStatus.CONNECTED:
      hideOfflineBanner();
      showSuccessToast('Connected to real-time updates');
      break;
    case ConnectionStatus.CONNECTING:
      showConnectingIndicator();
      break;
    case ConnectionStatus.RECONNECTING:
      showReconnectingBanner('Reconnecting to server...');
      break;
    case ConnectionStatus.DISCONNECTED:
      showOfflineBanner('You are offline. Real-time updates are disabled.');
      break;
    case ConnectionStatus.ERROR:
      showConnectionErrorMessage('Failed to connect to server.');
      break;
  }
});

// Remove the listener when component unmounts
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### Using the WebSocketStatus Component
For a quick way to display connection status, use the pre-built WebSocketStatus component:

```tsx
import WebSocketStatus from '../components/WebSocketStatus';

// In your component's render method:
<div className="header-status">
  {/* Simple dot indicator */}
  <WebSocketStatus />
  
  {/* Detailed status with text */}
  <WebSocketStatus showDetails={true} />
  
  {/* With additional options */}
  <WebSocketStatus 
    showDetails={true}
    showConnectionDuration={true}
    showDiagnosticInfo={true}
    className="custom-status"
  />
</div>
```

### Error Handling
Register callbacks for WebSocket errors:

```typescript
import { realtimeService, WebSocketError } from './services/realtime';

// Listen for WebSocket errors
const unsubscribe = realtimeService.onError((error: WebSocketError) => {
  console.error('WebSocket error:', error);
  showErrorNotification(`Connection error: ${error.message}`);
});

// Clean up when component unmounts
useEffect(() => {
  return () => unsubscribe();
}, []);
```

### Connection Health Monitoring
You can check the connection health with a ping:

```typescript
import { realtimeService } from './services/realtime';

// Check connection health
async function checkConnectionHealth() {
  try {
    await realtimeService.ping();
    console.log('Connection is healthy');
    return true;
  } catch (error) {
    console.error('Connection ping failed:', error);
    return false;
  }
}
```

### Handling Offline Scenarios
The RealtimeService automatically handles connection issues, but you can provide additional feedback to users:

```typescript
import { realtimeService, ConnectionStatus } from './services/realtime';

// Listen for online/offline events
useEffect(() => {
  function handleOnline() {
    if (realtimeService.getConnectionStatus() === ConnectionStatus.DISCONNECTED) {
      // Try to reconnect when device comes back online
      const token = localStorage.getItem('accessToken');
      if (token) {
        realtimeService.connect(token);
      }
    }
  }
  
  window.addEventListener('online', handleOnline);
  window.addEventListener('offline', () => {
    showOfflineBanner('Your device is offline. Real-time updates paused.');
  });
  
  return () => {
    window.removeEventListener('online', handleOnline);
    window.removeEventListener('offline', () => {});
  };
}, []);
```

## Performance Optimizations

### Request Caching

```typescript
import { cachedApiClient, cacheHelpers } from './services/cached-api';

// Regular API calls will be automatically cached based on configuration
const tokenInfo = await cachedApiClient.get('/blockchain/token/info');

// Subsequent calls within the TTL period will use cached data
const sameTokenInfo = await cachedApiClient.get('/blockchain/token/info');

// Manually invalidate cache when needed
function refreshData() {
  cacheHelpers.invalidateByTag('token');
  fetchTokenInfo(); // This will make a fresh API request
}

// Clear all cache
function logout() {
  cacheHelpers.clearCache();
  // other logout logic...
}
```

### Request Batching

```typescript
import { batchedApiClient } from './services/batch-request';

// These calls will automatically be batched
async function loadDashboardData(userId) {
  // These requests will be grouped into a single HTTP request
  const userProfile = await batchedApiClient.get(`/user/${userId}/profile`);
  const walletData = await batchedApiClient.get(`/user/${userId}/wallets`);
  const referralStats = await batchedApiClient.get(`/referral/stats?userId=${userId}`);
  
  return { userProfile, walletData, referralStats };
}

// You can also disable batching when needed
batchedApiClient.configureBatching(false);

// And re-enable it later
batchedApiClient.configureBatching(true);
```

### Selective Field Fetching

```typescript
import { fieldSelection, selectiveApiClient, userFields, nftFields } from './services/selective-api';

// Request only specific fields to reduce payload size
const userProfiles = await fieldSelection.get('/users', {
  fields: userFields.basic // ['id', 'email', 'username']
});

// For detailed user data, include more fields
const userDetail = await fieldSelection.get(`/users/${userId}`, {
  fields: userFields.complete // All user fields including profile data
});

// You can also specify custom field sets
const customFields = await fieldSelection.get('/nfts', {
  fields: ['id', 'name', 'imageUrl'],
  include: ['owner.username'], // Include related data
  exclude: ['metadata.attributes'], // Exclude specific nested fields
  depth: 2 // Control nested object depth
});
```

### Response Compression

```typescript
import { compressedApiClient, compressionConfig } from './services/compressed-api';

// Use the compressed client for large responses
const allUserTransactions = await compressedApiClient.get('/transactions/history');

// Configure compression settings
compressionConfig.setEnabled(true); // Enable/disable compression
compressionConfig.setCompressionThreshold(2048); // Only compress responses larger than 2KB
```

### Offline Support

```typescript
import { offlineApiClient } from './services/offline-api';

// Configure offline support
offlineApiClient.configure({
  enabled: true,
  maxRetries: 5,
  syncInterval: 60000, // Sync pending operations every minute when back online
});

// Listen for connectivity changes
offlineApiClient.on('connectionChange', ({ online }) => {
  if (online) {
    showOnlineStatus();
  } else {
    showOfflineStatus();
  }
});

// Make requests that will work even offline
// If offline, the request will be queued and processed when back online
try {
  await offlineApiClient.post('/diary/entries', newDiaryEntry);
  showSuccess('Diary entry saved');
} catch (error) {
  // This will only happen if offline support is disabled
  showError('Failed to save diary entry');
}

// Check for pending operations
const pendingCount = offlineApiClient.getPendingOperationsCount();
if (pendingCount > 0) {
  showPendingOperationsIndicator(pendingCount);
}

// Manually trigger sync when needed
offlineApiClient.sync();
```

### API Metrics and Monitoring

```typescript
import { monitoringApiClient } from './services/monitoring-api';

// Use the monitoring client to automatically track API call performance
const response = await monitoringApiClient.get('/api/endpoints');

// Get API metrics
const metrics = monitoringApiClient.getMetricsSummary();
console.log(`Success rate: ${metrics.successfulRequests / metrics.totalRequests * 100}%`);
console.log(`Average response time: ${metrics.overallAverageResponseTime}ms`);

// Get endpoint-specific metrics
const endpointMetrics = monitoringApiClient.getEndpointMetrics();
const slowestEndpoints = endpointMetrics
  .sort((a, b) => b.averageResponseTimeMs - a.averageResponseTimeMs)
  .slice(0, 5);

// Configure monitoring options
monitoringApiClient.configure({
  consoleOutput: true, // Log events to console
  logLevel: 3, // 0=none, 1=errors only, 2=warnings, 3=info, 4=debug
  remoteLogging: true, // Send metrics to remote endpoint
  remoteLoggingEndpoint: '/api/metrics',
  remoteLoggingInterval: 60000, // Send metrics every minute
});
```

### Advanced Memory Management

```typescript
import { memoryManager } from './services/memory-manager';

// Configure memory manager with custom settings
memoryManager.configure({
  checkInterval: 30000,  // Check memory usage every 30 seconds
  memoryThreshold: 0.8,  // Trigger cleanup at 80% memory usage
  maxCacheSize: 15 * 1024 * 1024,  // 15MB max cache size
  cacheSizeInterval: 20000,  // Check cache size every 20 seconds
  logStats: true  // Enable logging for debugging
});

// Trigger memory cleanup manually when needed
document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    // Clean up when tab is not visible to free resources
    memoryManager.performMemoryCleanup();
  }
});

// Check cache statistics
const stats = memoryManager.getCacheStats();
console.log(`Cache status: ${stats.entryCount} entries, ~${Math.round(stats.size / 1024)}KB`);

// Force aggressive cleanup if app seems sluggish
function handleLowPerformance() {
  memoryManager.performMemoryCleanup(true);
}
```

### Automatic Cache Eviction Policies

```typescript
import { ApiCacheManager, EvictionPolicy } from './services/cache-utils';

// Create a cache with LRU (Least Recently Used) policy - best for most use cases
const lruCache = new ApiCacheManager({
  evictionPolicy: EvictionPolicy.LRU,
  maxEntries: 100
});

// Create a cache with LFU (Least Frequently Used) policy - best for access frequency patterns
const lfuCache = new ApiCacheManager({
  evictionPolicy: EvictionPolicy.LFU,
  maxEntries: 100
});

// Create a cache with FIFO (First In First Out) policy - simple time-based removal
const fifoCache = new ApiCacheManager({
  evictionPolicy: EvictionPolicy.FIFO,
  maxEntries: 100
});

// Create a cache with TTL-based eviction - prioritizes items closest to expiration
const ttlCache = new ApiCacheManager({
  evictionPolicy: EvictionPolicy.TTL,
  maxEntries: 100
});

// Manually evict entries if needed
lruCache.evictEntries(10); // Remove 10 least recently used entries

// Clear expired entries only
const removedCount = lruCache.clearExpiredEntries();
console.log(`Removed ${removedCount} expired entries`);
```

### Combining Multiple Optimizations

```typescript
import { selectiveApiClient, fieldSelection, nftFields } from './services/selective-api';
import { compressedApiClient } from './services/compressed-api';
import { offlineApiClient } from './services/offline-api';
import { cachedApiClient } from './services/cached-api';
import { monitoringApiClient } from './services/monitoring-api';

// For small, frequently accessed data - use caching
const tokenPrices = await cachedApiClient.get('/tokens/prices');

// For large responses - use compression
const allTransactions = await compressedApiClient.get('/transactions/history');

// For customized data needs - use selective field fetching
const nftList = await fieldSelection.get('/nfts', { 
  fields: nftFields.list
});

// For offline-compatible operations - use offline support
const createResult = await offlineApiClient.post('/diary/entries', newEntry);

// For performance-critical code paths - use monitoring
const criticalData = await monitoringApiClient.get('/user/preferences');
```

## Enhanced Security

### Device Fingerprinting

```typescript
import { deviceFingerprint } from './services/device-fingerprint';

// Get the device fingerprint (creates one if not exists)
const fingerprintResult = await deviceFingerprint.getFingerprint();
console.log(`Device fingerprint: ${fingerprintResult.fingerprint}`);
console.log(`Confidence score: ${fingerprintResult.confidence}`);

// Register the current device as trusted
await deviceFingerprint.registerTrustedDevice();

// Check if the current device is a known/trusted device
const isKnownDevice = await deviceFingerprint.isKnownDevice();
if (isKnownDevice) {
  console.log('This is a trusted device');
} else {
  console.log('This is a new device, consider additional verification');
}

// Get a risk score for the current device (0-100, higher = riskier)
const riskScore = await deviceFingerprint.getRiskScore();
console.log(`Device risk score: ${riskScore}`);

// Reset device fingerprint (useful for testing or user request)
deviceFingerprint.reset();
```

### Security Service

```typescript
import { 
  securityService, 
  secureApiClient, 
  SecurityLevel, 
  AuthFactor,
  SecurityEventType 
} from './services/security-service';

// Set the security level
securityService.setSecurityLevel(SecurityLevel.HIGH);

// Mark authentication factors as completed
securityService.completeAuthFactor(AuthFactor.PASSWORD);
securityService.completeAuthFactor(AuthFactor.DEVICE);

// Check if user is fully authenticated
const fullyAuthenticated = securityService.isFullyAuthenticated();

// If not fully authenticated, get missing factors
if (!fullyAuthenticated) {
  const missingFactors = securityService.getMissingFactors();
  console.log('Additional authentication required:', missingFactors);
}

// Evaluate risk for an action
const loginRisk = await securityService.evaluateRisk('login', {
  newDevice: true,
  abnormalLocation: false
});

// Check if an action is allowed based on risk assessment
const transactionCheck = await securityService.isActionAllowed('transaction', {
  amount: 2000,
  recipient: '0x1234...'
});

if (transactionCheck.allowed) {
  // Proceed with transaction
  console.log(`Transaction allowed with risk score: ${transactionCheck.riskScore}`);
  
  // Check if additional verification is needed
  if (transactionCheck.requiresMfa) {
    // Request additional authentication
    console.log('Additional verification required');
  }
} else {
  console.log(`Transaction blocked: ${transactionCheck.reason}`);
}

// Record security events
await securityService.recordEvent(
  SecurityEventType.LOGIN_SUCCESS, 
  { method: 'password' }
);

// Get recent security events
const recentLogins = securityService.getEvents(5, SecurityEventType.LOGIN_SUCCESS);

// Register current device as trusted
await securityService.trustCurrentDevice();

// Check if current device is trusted
const isTrusted = await securityService.isDeviceTrusted();
```

### Secure API Client

```typescript
import { secureApiClient } from './services/security-service';

// The secureApiClient automatically adds security headers to all requests
// including device fingerprinting information

// Use it just like the regular API client
const response = await secureApiClient.get('/user/profile');

// It works with all HTTP methods
const createResponse = await secureApiClient.post('/data/create', {
  name: 'New item'
});
```

### Risk-Based Authentication

The security service implements risk-based authentication that dynamically adjusts security requirements based on the context of the request:

```typescript
// Configure risk thresholds
securityService.configure({
  maxRiskScore: 70,
  riskThresholds: {
    requireMfa: 30,  // Require MFA when risk is ≥ 30
    requireApproval: 60, // Require manual approval when risk is ≥ 60
    block: 80 // Block actions when risk is ≥ 80
  }
});

// Example login flow with risk assessment
async function secureLogin(username, password) {
  // First evaluate the risk of this login attempt
  const riskAssessment = await securityService.isActionAllowed('login', {
    username,
    newDevice: !await securityService.isDeviceTrusted(),
    abnormalTime: isAbnormalLoginTime()
  });
  
  if (!riskAssessment.allowed) {
    return { success: false, reason: riskAssessment.reason };
  }
  
  // Attempt login
  try {
    const loginResponse = await authService.login(username, password);
    
    // If login successful but risk assessment requires MFA
    if (riskAssessment.requiresMfa) {
      return { 
        success: true, 
        requireAdditionalVerification: true,
        loginResponse 
      };
    }
    
    // Record successful login
    await securityService.recordEvent(SecurityEventType.LOGIN_SUCCESS, {
      riskScore: riskAssessment.riskScore
    });
    
    return { success: true, loginResponse };
  } catch (error) {
    // Record failed login attempt
    await securityService.recordEvent(SecurityEventType.LOGIN_FAILURE, {
      reason: error.message,
      riskScore: riskAssessment.riskScore
    });
    
    return { success: false, error };
  }
}
```

### CAPTCHA Protection

The API client now includes CAPTCHA verification for high-risk operations to protect against automated attacks and bots.

```typescript
import { invisibleRecaptcha, visibleCaptcha, CaptchaProvider } from './services/captcha-service';
import { secureApiClient } from './services/secure-api-client';

// Initialize CAPTCHA when your app loads
async function initializeCaptchaService() {
  await invisibleRecaptcha.initialize();
  console.log('CAPTCHA service initialized');
}

// For direct use of CAPTCHA in forms
function registerWithCaptcha() {
  // Add a container in your HTML
  // <div id="captcha-container"></div>
  
  // Initialize visible CAPTCHA
  visibleCaptcha.initialize();
  
  // When form is submitted, check for valid CAPTCHA response
  document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    if (!visibleCaptcha.isTokenValid()) {
      alert('Please complete the CAPTCHA verification');
      return;
    }
    
    // Get the token
    const captchaToken = visibleCaptcha.getToken();
    
    // Submit form with token
    try {
      await apiClient.post('/auth/register', {
        // form data
        captcha_token: captchaToken
      });
    } catch (error) {
      // Handle error
      visibleCaptcha.reset(); // Reset CAPTCHA if there's an error
    }
  });
}

// Using the secure API client which automatically handles CAPTCHA for high-risk operations
async function performSecureOperation() {
  try {
    // The secure API client will automatically trigger CAPTCHA verification
    // if the operation is deemed high risk
    const response = await secureApiClient.post('/wallet/transfer', {
      recipient: '0x1234...',
      amount: 1000
    });
    
    console.log('Transfer successful:', response.data);
  } catch (error) {
    console.error('Transfer failed:', error);
  }
}

// For operations where you always want CAPTCHA verification
async function alwaysUseCaptcha() {
  try {
    const response = await secureApiClient.withCaptcha(() => 
      secureApiClient.post('/admin/user-management/delete-user', {
        userId: 'user-123'
      })
    );
    
    console.log('Operation successful:', response.data);
  } catch (error) {
    console.error('Operation failed:', error);
  }
}

// For operations requiring comprehensive security
async function comprehensiveSecurity() {
  try {
    const response = await secureApiClient.withEnhancedSecurity(
      // The actual request
      () => secureApiClient.post('/wallet/withdraw', {
        amount: 5000,
        address: '0x1234...'
      }),
      // Security options
      {
        action: 'withdraw',
        context: { amount: 5000 },
        // Callback for MFA verification if required
        mfaCallback: async () => {
          // Show MFA dialog
          const code = prompt('Please enter your 2FA code:');
          if (!code) return false;
          
          // Verify MFA code
          try {
            await apiClient.post('/auth/verify-mfa', { code });
            return true;
          } catch {
            return false;
          }
        }
      }
    );
    
    console.log('Withdrawal successful:', response.data);
  } catch (error) {
    console.error('Withdrawal failed:', error.message);
  }
}

// Listen for CAPTCHA events
function setupCaptchaListeners() {
  window.addEventListener('captcha:success', (e) => {
    console.log('CAPTCHA verified successfully', e.detail.token);
  });
  
  window.addEventListener('captcha:expired', () => {
    console.log('CAPTCHA expired, please verify again');
  });
  
  window.addEventListener('captcha:error', () => {
    console.log('CAPTCHA error occurred');
  });
}
```

#### High-Risk Operations Protected by CAPTCHA

The secure API client automatically triggers CAPTCHA verification for the following high-risk operations:

1. Password reset and change
2. Email address updates
3. Wallet transfers and withdrawals
4. NFT minting
5. Admin panel operations

#### Configuring CAPTCHA Protection

You can configure the CAPTCHA protection level:

```typescript
import { secureApiClient, SecureApiConfig } from './services/secure-api-client';
import { SecurityLevel } from './services/security-service';

// Configure secure API client
secureApiClient.configure({
  enableCaptcha: true, // Enable/disable CAPTCHA protection
  captchaForHighRiskOnly: true, // Only trigger for high-risk operations
  riskThresholdForCaptcha: 40, // Lower threshold triggers CAPTCHA more often
  securityLevel: SecurityLevel.HIGH // Increase overall security level
});
```

### End-to-End Encryption
The API client now supports end-to-end encryption for sensitive data exchange between client and server. This feature uses hybrid encryption combining RSA for key exchange and AES for data encryption.

```typescript
import { encryptionService } from './services/encryption-service';
import { encryptedApiClient } from './services/encrypted-api-client';

// Initialize encryption service
async function setupEncryption() {
  const initialized = await encryptionService.initialize();
  
  if (initialized) {
    console.log('Encryption service initialized successfully');
  } else {
    console.error('Failed to initialize encryption service');
  }
}

// Using encrypted API client which automatically encrypts/decrypts sensitive data
async function sendSensitiveData() {
  try {
    // This data will be automatically encrypted if the route is marked as sensitive
    const response = await encryptedApiClient.post('/user/financial-details', {
      cardNumber: '1234-5678-9012-3456',
      cvv: '123',
      expiryDate: '12/25'
    });
    
    console.log('Data sent securely:', response.data);
  } catch (error) {
    console.error('Failed to send encrypted data:', error);
  }
}

// Explicitly encrypt data regardless of route
async function forcedEncryption() {
  try {
    // Use the encrypted request method to force encryption
    const response = await encryptedApiClient.encryptedRequest(
      'POST',
      '/some/endpoint',
      { sensitiveField: 'sensitive-value' }
    );
    
    console.log('Response:', response.data);
  } catch (error) {
    console.error('Error:', error);
  }
}

// Directly encrypt/decrypt data for custom use cases
async function manualEncryptDecrypt() {
  // Ensure service is initialized
  if (!encryptionService.isReady()) {
    await encryptionService.initialize();
  }
  
  // Encrypt data
  try {
    const data = { secretMessage: "This is confidential!" };
    const encryptedPayload = await encryptionService.encrypt(data);
    
    console.log('Encrypted payload:', encryptedPayload);
    
    // Send via other means or store temporarily
    
    // Later, decrypt the data
    const decryptedData = await encryptionService.decrypt(encryptedPayload);
    console.log('Decrypted data:', decryptedData);
  } catch (error) {
    console.error('Encryption/decryption error:', error);
  }
}

// Reset encryption keys (for testing or when needed)
async function resetEncryption() {
  const reset = await encryptionService.reset();
  
  if (reset) {
    console.log('Encryption service reset successfully');
  } else {
    console.error('Failed to reset encryption service');
  }
}
```

#### Sensitive Routes with Automatic Encryption

The encrypted API client automatically handles encryption and decryption for these routes:

1. `/user/kyc` - Know Your Customer data
2. `/user/update-email` - Email change requests
3. `/user/update-password` - Password change requests
4. `/user/financial-details` - Financial information
5. `/user/security-settings` - Security settings
6. `/user/personal-info` - Personal identifiable information
7. `/wallet/withdraw` - Cryptocurrency withdrawals
8. `/wallet/transfer` - Cryptocurrency transfers
9. `/payment/process` - Payment processing
10. `/payment/add-method` - Adding payment methods
11. `/auth/mfa-setup` - Multi-factor authentication setup
12. `/auth/reset-password` - Password reset operations
13. `/auth/recovery-options` - Account recovery options
14. Admin routes (`/admin/*`) - All administrative operations
15. Security routes (`/security/*`) - Security-related operations
16. Verification routes (`/verification/*`) - Identity verification operations

#### Configuring Encryption

You can configure the encryption client behavior:

```typescript
import { encryptedApiClient } from './services/encrypted-api-client';
import { SecurityLevel } from './services/security-service';

// Configure the encrypted API client
encryptedApiClient.config = {
  // Basic security settings
  enableSecurity: true,
  enableCaptcha: true,
  securityLevel: SecurityLevel.HIGH,
  captchaForHighRiskOnly: true,
  riskThresholdForCaptcha: 50,
  
  // Encryption-specific settings
  enableEncryption: true, // Enable/disable encryption globally
  alwaysEncryptSensitiveRoutes: true, // Automatically encrypt sensitive routes
  encryptionHeaderName: 'X-Encrypted-Request' // Custom header name
};
```

#### End-to-End Encryption Implementation Details

The encryption system uses:

1. **RSA-2048** for asymmetric key exchange
2. **AES-256-CBC** for symmetric data encryption (with GCM support when available)
3. **SHA-256** for data integrity verification
4. **Hybrid encryption** approach:
   - Data is encrypted with a randomly generated AES key
   - The AES key is encrypted with the recipient's RSA public key
   - Both the encrypted data and encrypted key are transmitted together

#### Security Considerations

- Key pairs are generated client-side and stored securely in localStorage
- Private keys never leave the client
- All keys have configurable expiration periods
- Digital signatures are used to verify data integrity
- The system automatically handles key generation and exchange
- End-to-end encryption can be combined with TLS for maximum security

## Next Steps
1. **Performance Optimizations**
   - ✅ Implement request batching for multiple related API calls
   - ✅ Add request caching for frequently accessed data
   - ✅ Optimize payload sizes with compression
   - ✅ Implement selective field fetching
   - ✅ Add offline support for operations during connectivity issues
   - ✅ Implement API call monitoring and performance metrics
   - ✅ Advanced memory and storage management
   - ✅ Automatic cache eviction policies
2. **Enhanced Security**
   - ✅ Implement device fingerprinting for enhanced security
   - ✅ Add risk-based authentication
   - ✅ Implement suspicious activity detection
   - ✅ Add security event logging
   - ✅ Add support for additional wallet providers
   - ✅ Add CAPTCHA support for sensitive operations
   - ⬜ Introduce end-to-end encryption for sensitive data
     - Implement key generation and exchange mechanisms
     - Create encrypted payload handling for sensitive routes
     - Add client-side encryption/decryption utilities
     - Design secure key storage with proper expiration policies
     - Implement digital signature verification for data integrity
3. **Developer Experience**
   - ⬜ Create comprehensive TypeScript type definitions for all API responses
   - ⬜ Add detailed JSDoc comments for better IDE integration
   - ⬜ Generate API documentation with TypeDoc
   - ⬜ Create example implementations for common use cases
4. **Testing and Reliability**
   - ⬜ Implement comprehensive unit tests for all client modules
   - ⬜ Add integration tests for API interactions
   - ⬜ Create mock service workers for frontend testing
   - ⬜ Implement automated regression testing
5. **Advanced Features**
   - ✅ Notification service with persistent storage
   - ⬜ Support for GraphQL queries alongside REST
   - ⬜ Implement rate limiting with retry strategies
   - ⬜ Add analytics for API usage patterns
   - ⬜ Create visualization tools for API performance monitoring

## Troubleshooting Guide

### WebSocket Issues

1. **Connection Failures**
   - Check network connectivity
   - Verify authentication token is valid and not expired
   - Ensure backend WebSocket service is running

2. **Disconnections**
   - Automatic reconnection will attempt to restore the connection
   - Check for network issues or firewall restrictions
   - The UI should reflect connection status changes

3. **Missing Updates**
   - Verify you're subscribed to the correct channel
   - Check subscription callback for errors
   - Ensure the backend is publishing events to the correct channels

4. **Authentication Errors**
   - The system will attempt to refresh tokens automatically
   - If persistent, try logging out and back in
   - Check browser console for specific error messages

### Caching Issues

1. **Stale Data**
   - Check that cache invalidation is being triggered when data changes
   - Use the appropriate tags when invalidating related cache entries
   - Reduce TTL values for frequently changing data

2. **Cache Not Working**
   - Check that the correct API client is being used (cachedApiClient vs. regular apiClient)
   - Verify the endpoint is included in the cache configuration
   - Ensure localStorage is available and not full

3. **Memory Issues**
   - If the app becomes slow, try `memoryManager.performMemoryCleanup()`
   - Consider using a more aggressive eviction policy for large datasets
   - Monitor cache size with `memoryManager.getCacheStats()`

### Batching Issues

1. **Requests Not Being Batched**
   - Check that batching is enabled: `batchedApiClient.isBatchingEnabled()`
   - Verify the requests are made close enough in time (within the batchTimeWindow)
   - Some request types (like authentication) are never batched for security

2. **Batch Errors**
   - Individual request errors won't fail the entire batch
   - Check for error handling in your code when using batched requests
   - If batching consistently fails, it will auto-disable after multiple errors

### Selective Field Fetching Issues

1. **Fields Not Being Filtered**
   - Verify the backend supports field filtering with the query parameters you're using
   - Check that field names match exactly what the backend expects
   - Some endpoints may not support selective fetching

2. **Missing Related Data**
   - Use the `include` parameter to explicitly request related entity fields
   - Specify the correct path notation (e.g., `owner.username` for nested properties)
   - Check the `depth` parameter if nested objects aren't being included

### Compression Issues

1. **Compression Not Working**
   - Verify the compressed client is being used (`compressedApiClient`)
   - Check if the payload is larger than the configured threshold
   - Ensure the backend supports and correctly processes the compression headers

2. **Performance Concerns**
   - Compression adds CPU overhead; it may not be worth it for small payloads
   - For very large responses, consider using pagination instead
   - Use the monitoring client to measure the actual performance impact

### Offline Mode Issues

1. **Operations Not Being Queued**
   - Ensure offline mode is enabled with `offlineApiClient.configure({ enabled: true })`
   - Check that the operation is supported for offline queueing (usually mutating operations)
   - Verify that you're using the correct client (`offlineApiClient`)

2. **Sync Not Working**
   - Network conditions might prevent successful synchronization
   - Listen to sync events to get detailed information about sync issues
   - Check for conflict errors if the same resource was modified both offline and online

### Monitoring Issues

1. **Missing Metrics**
   - Ensure you're using the `monitoringApiClient` for the operations you want to track
   - Some very fast operations might not be tracked accurately
   - Check the configuration settings for monitoring thresholds

### Memory Management Issues

1. **App Performance Degradation**
   - If the app becomes sluggish over time, check memory usage with `memoryManager.getCacheStats()`
   - Try manual cleanup with `memoryManager.performMemoryCleanup(true)`
   - Consider adjusting the `memoryThreshold` and `maxCacheSize` in configuration

2. **Mobile Device Performance**
   - On mobile devices, use more aggressive cleanup settings
   - Consider setting lower `maxEntries` and `maxCacheSize` values
   - Use the `devicememory` event to detect low-memory conditions

### Security Issues

1. **Device Not Recognized**
   - The system may require additional verification on new devices
   - Use `securityService.trustCurrentDevice()` after successful verification
   - Check for browser features that might be blocking fingerprinting

2. **Additional Verification Required**
   - High-risk actions may require additional verification
   - Check `requiresMfa` property in the result of `isActionAllowed()`
   - Implement appropriate MFA flow based on missing authentication factors

3. **Security Events**
   - Review security events with `securityService.getEvents()`
   - Investigate suspicious activity events
   - Use the risk score to understand security decisions

4. **False Positives**
   - If legitimate actions are being blocked, adjust risk thresholds
   - Configure security level with `securityService.setSecurityLevel()`
   - Fine-tune with `securityService.configure()`

### Wallet Connection Issues

1. **Wallet Not Available or Not Detected**
   - Ensure the wallet extension is installed and enabled in your browser
   - Check if the wallet is unlocked (logged in)
   - Try refreshing the page and reconnecting

2. **Signature Requests Not Appearing**
   - Check if the wallet extension is functioning properly
   - Ensure pop-ups are not being blocked by your browser
   - Try using a different method for the same wallet provider

3. **Wrong Network or Chain**
   - Use `multiWalletProvider.switchChain()` to request the correct network
   - Ensure the user has the required network added to their wallet
   - Check console for errors related to network switching

4. **Account Changed During Session**
   - The wallet integration automatically handles account changes
   - Users will be logged out if they switch to a different wallet address
   - This is a security feature to prevent unauthorized access

### CAPTCHA Issues

1. **CAPTCHA Not Loading**
   - Check if the CAPTCHA script is being loaded properly
   - Ensure the container element exists for visible CAPTCHAs
   - Try initializing the CAPTCHA service manually

2. **CAPTCHA Token Not Being Accepted**
   - Tokens might be expired; they're valid for about 2 minutes
   - Ensure the token is being properly sent in the request
   - Check network logs to confirm the token is included

3. **Invisible CAPTCHA Not Being Triggered**
   - Ensure the risk threshold is appropriate for your use case
   - Check if the operation is marked as high-risk
   - Try using `secureApiClient.withCaptcha()` to explicitly require CAPTCHA

4. **Browser Compatibility Issues**
   - Some privacy-focused browsers might block CAPTCHA services
   - Check for console errors related to third-party cookies or scripts
   - Consider providing alternative verification methods

## Recommendations for Usage

1. **Use Service Modules**: Always use the provided service modules rather than calling apiClient directly when possible.

2. **Token Management**: Don't manually manage tokens in your components; the API client handles this for you.

3. **Error Handling**: Implement proper error handling in your components, but don't worry about logging the details (the API client does this for you).

4. **Type Safety**: Consider creating TypeScript interfaces for your API responses to improve type safety.

5. **Testing**: When writing tests, you can mock the API services by mocking the service modules.

6. **Client Selection**: Choose the appropriate specialized client for each use case:
   - `apiClient`: For basic API interactions
   - `cachedApiClient`: For frequently accessed data that doesn't change often
   - `batchedApiClient`: For many small requests that should be combined
   - `selectiveApiClient`: For reducing payload size by requesting only needed fields
   - `compressedApiClient`: For large responses that benefit from compression
   - `offlineApiClient`: For operations that should work offline and sync later
   - `monitoringApiClient`: For performance-critical operations that need monitoring

7. **Memory Management**: For optimal performance, especially in long-running applications:
   - Configure cache eviction policies based on your data access patterns
   - Monitor memory usage with the memory manager
   - Trigger cleanup during idle periods or when the app is backgrounded
   - Consider using different policies for different types of data

8. **Security Features**: For optimal security:
   - Use the `secureApiClient` for all API calls
   - Implement MFA flows for high-risk actions
   - Monitor security events regularly
   - Consider using risk-based authentication for sensitive operations
   - Register trusted devices after successful authentication

## Security Considerations

- Tokens are stored in localStorage, which means they are vulnerable to XSS attacks. Ensure your application has proper XSS protection.
- The API client will automatically redirect to the login page on authentication failures after attempting a token refresh.
- All API calls use HTTPS as defined by your environment configuration.
- Offline operations are stored in localStorage and could potentially include sensitive data. Consider what operations are enabled for offline use.
- The memory manager helps ensure that sensitive data isn't kept in memory longer than necessary, but you should still be careful with what you cache.
- Device fingerprinting is used to enhance security but should be combined with other authentication factors for sensitive operations.
- Security events are stored locally and also sent to the backend for monitoring and analysis.
- Risk scores are calculated based on various factors and may require tuning for your specific application.
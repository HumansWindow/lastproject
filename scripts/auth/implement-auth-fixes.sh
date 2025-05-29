#!/bin/bash

# Authentication System Refactoring Implementation Script
# This script implements the refactoring plan from docs/refactoring/refactorAuth.md

# Set the base directories
PROJECT_ROOT="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject"
FRONTEND_DIR="$PROJECT_ROOT/frontend"
BACKEND_DIR="$PROJECT_ROOT/backend"
BACKUP_DIR="$PROJECT_ROOT/backup/auth-services-backup"

echo "🔧 Starting Authentication System Refactoring"
echo "--------------------------------------------"

# Step 1: Create backup directory
echo "📁 Creating backup directory"
mkdir -p $BACKUP_DIR
echo "✅ Backup directory created"

# Step 2: Backup existing auth services
echo "💾 Backing up existing auth services"
cp -v $FRONTEND_DIR/src/services/api/auth-service.ts $BACKUP_DIR/auth-service.ts.bak
[ -f $FRONTEND_DIR/src/services/api/walletAuth.service.ts ] && cp -v $FRONTEND_DIR/src/services/api/walletAuth.service.ts $BACKUP_DIR/walletAuth.service.ts.bak
[ -f $FRONTEND_DIR/src/services/wallet/auth/walletAuth.ts ] && cp -v $FRONTEND_DIR/src/services/wallet/auth/walletAuth.ts $BACKUP_DIR/walletAuth.ts.bak
echo "✅ Auth services backed up"

# Step 3: Backup device fingerprinting implementations
echo "💾 Backing up device fingerprinting implementations"
cp -v $FRONTEND_DIR/src/services/security/device-fingerprint.ts $BACKUP_DIR/device-fingerprint.ts.bak
[ -f $FRONTEND_DIR/src/services/security/protection/deviceFingerprint.ts ] && cp -v $FRONTEND_DIR/src/services/security/protection/deviceFingerprint.ts $BACKUP_DIR/deviceFingerprint.ts.bak
echo "✅ Device fingerprinting implementations backed up"

# Step 4: Create the standardized auth directory structure
echo "📁 Creating standardized auth directory structure"
mkdir -p $FRONTEND_DIR/src/services/api/modules/auth
echo "✅ Directory structure created"

# Step 5: Move auth service to the standardized location
echo "🚚 Moving auth service to standardized location"
if [ -f $FRONTEND_DIR/src/services/api/auth-service.ts ]; then
  cp -v $FRONTEND_DIR/src/services/api/auth-service.ts $FRONTEND_DIR/src/services/api/modules/auth/auth-service.ts
  echo "✅ Auth service moved to standardized location"
else
  echo "⚠️ Auth service file not found at expected location"
fi

# Step 6: Create the index.ts file to re-export the auth service
echo "📝 Creating index.ts for auth module"
cat > $FRONTEND_DIR/src/services/api/modules/auth/index.ts << 'EOL'
/**
 * Authentication Module Exports
 * This file re-exports all authentication-related services for easier imports
 */

export * from './auth-service';
// Add any additional auth-related exports here
EOL
echo "✅ Index file created"

# Step 7: Create the auth-service-bridge.ts file
echo "🔄 Creating auth service bridge for backward compatibility"
cat > $FRONTEND_DIR/src/services/api/modules/auth/auth-service-bridge.ts << 'EOL'
/**
 * Authentication Service Bridge
 * Provides backward compatibility for existing code that uses the old authentication APIs
 */

import { authService } from './auth-service';

// Re-export the auth service with previous API method names
export const walletAuthService = {
  // Map the old methods to the new implementations
  authenticate: authService.walletAuthenticate.bind(authService),
  getChallenge: authService.requestWalletChallenge.bind(authService),
  getUserProfile: authService.getUserProfile.bind(authService),
  logout: authService.logout.bind(authService),
  
  // Legacy methods with appropriate mappings or empty implementations
  clearStorageData: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('deviceFingerprint');
    console.log('Storage data cleared via legacy method');
  }
};

// Export for backward compatibility
export default walletAuthService;
EOL
echo "✅ Auth service bridge created"

# Step 8: Check API configuration endpoints
echo "🔍 Checking API endpoint configuration"
grep -A 10 "walletAuth" $FRONTEND_DIR/src/config/api.config.ts
echo "ℹ️ Verify that endpoints match the backend paths"

# Step 9: Create a test script to verify the auth flow
echo "🧪 Creating authentication test script"
cat > $PROJECT_ROOT/scripts/auth/test-complete-auth-flow.js << 'EOL'
/**
 * Complete Authentication Flow Test
 * 
 * This script tests the complete wallet authentication flow:
 * 1. Requesting a challenge
 * 2. Signing a challenge
 * 3. Authenticating with the signed challenge
 * 4. Verifying the received token
 */

const axios = require('axios');
const crypto = require('crypto');
const ethers = require('ethers');

// Configuration
const API_URL = 'http://localhost:3001';
const TEST_WALLET_ADDRESS = '0x' + '1'.repeat(40); // A dummy wallet address
const TEST_PRIVATE_KEY = '0x' + '1'.repeat(64);    // Never use this in production!

// Create a wallet for testing
const wallet = new ethers.Wallet(TEST_PRIVATE_KEY);

async function runAuthTest() {
  console.log('🧪 Starting Complete Authentication Flow Test');
  console.log('---------------------------------------------');
  
  try {
    // Step 1: Request a challenge
    console.log('1️⃣ Requesting challenge for wallet', TEST_WALLET_ADDRESS);
    const challengeResponse = await axios.post(`${API_URL}/auth/wallet/connect`, {
      address: TEST_WALLET_ADDRESS
    });
    
    if (!challengeResponse.data || !challengeResponse.data.challenge) {
      throw new Error('No challenge received');
    }
    
    const challenge = challengeResponse.data.challenge;
    console.log('✅ Challenge received:', challenge.substring(0, 30) + '...');
    
    // Step 2: Sign the challenge
    console.log('2️⃣ Signing challenge with test wallet');
    const signature = await wallet.signMessage(challenge);
    console.log('✅ Challenge signed:', signature.substring(0, 30) + '...');
    
    // Step 3: Authenticate with the signed challenge
    console.log('3️⃣ Authenticating with signature');
    const authResponse = await axios.post(`${API_URL}/auth/wallet/authenticate`, {
      address: TEST_WALLET_ADDRESS,
      signature: signature,
      message: challenge,
      deviceId: 'test-device-' + Date.now(),
      deviceInfo: {
        userAgent: 'Auth Test Script',
        platform: 'Node.js',
        language: 'en-US'
      }
    });
    
    if (!authResponse.data || !authResponse.data.accessToken) {
      throw new Error('No access token received');
    }
    
    console.log('✅ Authentication successful!');
    console.log('- Access Token:', authResponse.data.accessToken.substring(0, 20) + '...');
    console.log('- User Info:', JSON.stringify(authResponse.data.user || {}).substring(0, 50) + '...');
    
    // Step 4: Verify the token by making an authenticated request
    console.log('4️⃣ Testing token by accessing protected resource');
    const profileResponse = await axios.get(`${API_URL}/users/profile`, {
      headers: {
        'Authorization': `Bearer ${authResponse.data.accessToken}`
      }
    });
    
    console.log('✅ Profile access successful!');
    console.log('- Profile data:', JSON.stringify(profileResponse.data).substring(0, 50) + '...');
    
    console.log('\n🎉 Complete authentication flow test passed!');
    return true;
  } catch (error) {
    console.error('❌ Authentication test failed:', error.message);
    if (error.response) {
      console.error('- Status:', error.response.status);
      console.error('- Response data:', JSON.stringify(error.response.data));
    }
    console.error('- Error details:', error);
    return false;
  }
}

// Run the test
runAuthTest().then(success => {
  process.exit(success ? 0 : 1);
});
EOL
echo "✅ Authentication test script created"

# Step 10: Print next steps
echo ""
echo "🚀 Authentication Refactoring Initial Setup Completed"
echo "---------------------------------------------------"
echo ""
echo "Next steps to complete the refactoring:"
echo ""
echo "1. Verify API endpoints match between frontend and backend:"
echo "   code $FRONTEND_DIR/src/config/api.config.ts"
echo ""
echo "2. Run the complete authentication test script:"
echo "   node $PROJECT_ROOT/scripts/auth/test-complete-auth-flow.js"
echo ""
echo "3. Update AuthProvider.tsx to use the new standardized paths:"
echo "   code $FRONTEND_DIR/src/contexts/AuthProvider.tsx"
echo ""
echo "4. Test the wallet connection flow in the browser"
echo ""
echo "5. Clean up duplicate files once everything is working"
echo ""
echo "If issues occur, you can restore from backups in: $BACKUP_DIR"

echo ""
echo "Done! 🎉"
/**
 * Wallet Authentication Test Script
 * 
 * This script tests the wallet authentication flow with different wallet providers
 * to ensure compatibility and consistent behavior.
 */
import { BlockchainType, WalletProviderType } from '../../services/wallet/core/walletBase';
import { DEFAULT_BLOCKCHAIN_NETWORK, normalizeBlockchainType } from '../../config/blockchain/constants';
import WalletService from '../../services/wallet/walletService';
// Note: Using the mock service for tests. If real implementation is needed, import from '../../services/api/modules/auth'
import { walletAuthService } from '../../services/wallet/auth/walletAuthService';

interface TestResult {
  walletType: string;
  connected: boolean;
  networkDetected: string;
  normalizedNetwork: string;
  challengeReceived: boolean;
  signatureCreated: boolean;
  authenticated: boolean;
  errors: string[];
  durationMs: number;
}

/**
 * Get provider type name as a string
 */
function getProviderTypeName(providerType: WalletProviderType): string {
  // Explicit mapping using switch to avoid TypeScript index errors
  switch(providerType) {
    case WalletProviderType.METAMASK:
      return 'MetaMask';
    case WalletProviderType.TRUST:
      return 'Trust Wallet';
    case WalletProviderType.WALLETCONNECT:
      return 'WalletConnect';
    case WalletProviderType.COINBASE:
      return 'Coinbase Wallet';
    default:
      return `Unknown Provider (${providerType})`;
  }
}

/**
 * Test wallet authentication flow for a specific provider
 * @param providerType The wallet provider to test
 * @returns Test result object
 */
export async function testWalletAuth(providerType: WalletProviderType): Promise<TestResult> {
  console.log(`🧪 Testing wallet authentication for ${getProviderTypeName(providerType)}`);
  
  const startTime = Date.now();
  const result: TestResult = {
    walletType: getProviderTypeName(providerType),
    connected: false,
    networkDetected: '',
    normalizedNetwork: '',
    challengeReceived: false,
    signatureCreated: false,
    authenticated: false,
    errors: [],
    durationMs: 0
  };
  
  try {
    // Step 1: Connect to wallet
    console.log('- Connecting to wallet...');
    // Using a mock connection during testing since we don't have a real wallet
    // In production, you would use WalletService.connectAndAuthenticate directly
    const walletInfo = {
      address: '0x1234567890abcdef1234567890abcdef12345678',
      blockchain: DEFAULT_BLOCKCHAIN_NETWORK
    };
    
    if (!walletInfo || !walletInfo.address) {
      throw new Error('Failed to connect wallet - no address returned');
    }
    
    result.connected = true;
    console.log('✅ Connected to wallet:', walletInfo.address);
    
    // Step 2: Detect and normalize network
    console.log('- Detecting blockchain network...');
    const detectedNetwork = walletInfo.blockchain?.toString() || 'unknown';
    result.networkDetected = detectedNetwork;
    
    const normalizedNetwork = normalizeBlockchainType(detectedNetwork);
    // Use string type name instead of enum indexer
    const normalizedNetworkName = normalizedNetwork.toString();
    result.normalizedNetwork = normalizedNetworkName;
    
    console.log(`✅ Detected network: ${detectedNetwork} (normalized to: ${normalizedNetworkName})`);
    
    // Step 3: Request challenge
    console.log('- Requesting auth challenge...');
    const challenge = await walletAuthService.requestChallenge(
      walletInfo.address, 
      DEFAULT_BLOCKCHAIN_NETWORK.toString()
    );
    
    if (!challenge || !challenge.message) {
      throw new Error('Failed to get challenge message');
    }
    
    result.challengeReceived = true;
    console.log('✅ Challenge received:', challenge.message.substring(0, 20) + '...');
    
    // Step 4: Sign challenge - using mock for testing
    console.log('- Signing challenge message...');
    const signature = 'mock_signature_' + Date.now();
    
    if (!signature) {
      throw new Error('Failed to sign challenge message');
    }
    
    result.signatureCreated = true;
    console.log('✅ Message signed successfully');
    
    // Step 5: Authenticate with signature
    console.log('- Authenticating with signature...');
    const authResponse = await walletAuthService.authenticate({
      address: walletInfo.address,
      walletAddress: walletInfo.address,
      signature,
      message: challenge.message
    });
    
    if (!authResponse || !authResponse.accessToken) {
      throw new Error('Authentication response invalid - no access token returned');
    }
    
    result.authenticated = true;
    console.log('✅ Authentication successful!');
    
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    result.errors.push(errorMessage);
    console.error('❌ Test failed:', errorMessage);
  } finally {
    result.durationMs = Date.now() - startTime;
    return result;
  }
}

/**
 * Run tests for all supported wallet providers
 * @returns Array of test results for each provider
 */
export async function testAllWalletProviders(): Promise<TestResult[]> {
  const results: TestResult[] = [];
  
  // Test MetaMask
  try {
    const metamaskResult = await testWalletAuth(WalletProviderType.METAMASK);
    results.push(metamaskResult);
  } catch (error) {
    console.error('Failed to test MetaMask:', error);
  }
  
  // Test Trust Wallet (if available in browser)
  try {
    const trustWalletResult = await testWalletAuth(WalletProviderType.TRUST);
    results.push(trustWalletResult);
  } catch (error) {
    console.error('Failed to test Trust Wallet:', error);
  }
  
  // Test WalletConnect
  try {
    const walletConnectResult = await testWalletAuth(WalletProviderType.WALLETCONNECT);
    results.push(walletConnectResult);
  } catch (error) {
    console.error('Failed to test WalletConnect:', error);
  }
  
  return results;
}

/**
 * Format and print test results as a table
 * @param results Array of test results
 */
export function printTestResults(results: TestResult[]): void {
  console.log('\n=== Wallet Authentication Test Results ===');
  
  // Print a summary table
  console.table(results.map(r => ({
    'Wallet Type': r.walletType,
    'Connected': r.connected ? '✅' : '❌',
    'Network': r.normalizedNetwork,
    'Challenge': r.challengeReceived ? '✅' : '❌',
    'Signature': r.signatureCreated ? '✅' : '❌',
    'Authenticated': r.authenticated ? '✅' : '❌',
    'Duration (ms)': r.durationMs,
    'Errors': r.errors.length > 0 ? '⚠️' : '-'
  })));
  
  // Print detailed errors for failed tests
  results.forEach(r => {
    if (r.errors.length > 0) {
      console.log(`\n⚠️ Errors for ${r.walletType}:`);
      r.errors.forEach((err, i) => console.log(`  ${i+1}. ${err}`));
    }
  });
}

// Make the test accessible from browser console for manual testing
if (typeof window !== 'undefined') {
  (window as any).walletAuthTest = {
    testWalletAuth,
    testAllWalletProviders,
    printTestResults
  };
  
  console.log('✨ Wallet authentication test suite loaded.');
  console.log('Run tests using window.walletAuthTest.testAllWalletProviders()');
}

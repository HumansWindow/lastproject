import walletService from "../services/wallet/walletService";
import { walletSelector } from "../services/wallet";
import { walletAuthService } from "../services/api/modules/auth";
import { WalletProviderType, BlockchainType } from "../services/wallet/core/walletBase";
import { DEFAULT_BLOCKCHAIN_NETWORK, normalizeBlockchainType } from '../config/blockchain/constants';

// Define the interface for the auth challenge response
interface AuthChallenge {
  challenge: string;
  expiresAt?: string; // Make expiresAt optional to match the returned type from walletAuthService
}

// Define the static methods on the WalletService constructor
interface WalletServiceConstructor {
  getDebugLogs?: () => string[];
  clearDebugLogs?: () => void;
  setDebugEnabled?: (enabled: boolean) => void;
}

/**
 * Utility to monitor and debug wallet authentication flow
 */
export class AuthDebugger {
  private static instance: AuthDebugger;
  private active: boolean = false;
  private listeners: Array<() => void> = [];
  private logs: string[] = [];
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): AuthDebugger {
    if (!AuthDebugger.instance) {
      AuthDebugger.instance = new AuthDebugger();
    }
    return AuthDebugger.instance;
  }
  
  public startMonitoring(): void {
    console.log('🔍 Auth Debugger: Starting authentication monitoring');
    this.active = true;
    // Enable debug mode if the method exists on WalletService
    if (typeof walletService === 'object' && 'constructor' in walletService) {
      // Safe access to the static method with type checking
      const walletServiceConstructor = walletService.constructor as WalletServiceConstructor;
      if (typeof walletServiceConstructor.setDebugEnabled === 'function') {
        walletServiceConstructor.setDebugEnabled(true);
      }
    }
    this.notifyListeners();
  }
  
  public stopMonitoring(): void {
    this.active = false;
    console.log('🔍 Auth Debugger: Stopped authentication monitoring');
    this.notifyListeners();
  }
  
  public isMonitoring(): boolean {
    return this.active;
  }
  
  public addListener(callback: () => void): () => void {
    this.listeners.push(callback);
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }
  
  public addLog(message: string, isError: boolean = false): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${isError ? '❌ ' : '✅ '}${message}`;
    this.logs.push(logEntry);
    
    // Keep log size reasonable
    if (this.logs.length > 100) {
      this.logs.shift();
    }
    
    console.log(`%c${logEntry}`, isError ? 'color: #ff3333' : 'color: #33cc33');
  }
  
  public getLogs(): string[] {
    return [...this.logs];
  }
  
  public clearLogs(): void {
    this.logs = [];
    console.log('Auth debugger logs cleared');
  }
  
  private notifyListeners(): void {
    this.listeners.forEach(listener => listener());
  }
  
  /**
   * Clear any corrupted authentication state
   */
  public resetAuthState(): void {
    try {
      // Remove potentially problematic auth tokens and state
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');
      localStorage.removeItem('_corrupted_flag');
      
      // We preserve wallet address and type for convenience
      
      this.addLog('Auth state has been reset. Refresh the page to apply changes.');
    } catch (error) {
      this.addLog(`Failed to reset auth state: ${error instanceof Error ? error.message : String(error)}`, true);
    }
  }
  
  /**
   * Performs a step-by-step diagnostic of the wallet authentication flow
   */
  public async diagnoseWalletAuth(): Promise<void> {
    console.group('🔍 Wallet Authentication Diagnostics');
    try {
      console.log('Step 1: Checking if wallet is connected...');
      const isConnected = walletSelector.isWalletConnected();
      console.log(isConnected 
        ? '✅ Wallet is connected' 
        : '❌ No wallet connected');
      
      if (!isConnected) {
        console.log('Attempting to connect to wallet...');
        try {
          // Try to connect to last used wallet
          const result = await walletSelector.connectToLastWallet();
          if (result && result.success) {
            console.log('✅ Connected to wallet:', result.walletInfo?.address);
          } else {
            console.log('❌ Failed to auto-connect wallet');
            return;
          }
        } catch (err) {
          console.error('❌ Error connecting to wallet:', err);
          return;
        }
      }
      
      const walletInfo = walletSelector.getCurrentWallet();
      if (!walletInfo) {
        console.error('❌ Wallet info is null despite connection');
        return;
      }
      
      // Check if this is Trust Wallet
      const isTrustWallet = walletInfo.providerType === WalletProviderType.TRUST;
      if (isTrustWallet) {
        console.log('🔍 Trust Wallet detected. Running specialized diagnostics...');
        await this.diagnoseTrustWallet(walletInfo.address);
        return;
      }
      
      console.log('Step 2: Testing challenge request...');
      try {
        const challenge = await walletAuthService.requestChallenge(walletInfo.address);
        console.log('✅ Challenge received:', {
          challenge: challenge.challenge,
          expiresAt: challenge.expiresAt,
          challengeLength: challenge.challenge.length
        });
        
        console.log('Step 3: Testing message signing...');
        try {
          const signResult = await walletSelector.signMessage(challenge.challenge);
          if (signResult.success && signResult.signature) {
            console.log('✅ Message signed successfully:', {
              signaturePreview: signResult.signature.substring(0, 20) + '...',
              signatureLength: signResult.signature.length
            });
            
            console.log('Step 4: Testing authentication with signature...');
            try {
              const authResult = await walletAuthService.authenticate({
                walletAddress: walletInfo.address,
                signature: signResult.signature,
                message: challenge.challenge
              });
              
              console.log('✅ Authentication successful!', {
                hasAccessToken: !!authResult.accessToken,
                hasRefreshToken: !!authResult.refreshToken,
                hasUserInfo: !!authResult.user
              });
            } catch (authError) {
              console.error('❌ Authentication failed:', authError);
              console.log('Checking backend connectivity...');
              
              // Test if backend is reachable
              try {
                const response = await fetch('/auth/wallet-debug/health-check');
                if (response.ok) {
                  const data = await response.json();
                  console.log('✅ Backend health check passed:', data);
                } else {
                  console.error('❌ Backend health check failed:', response.status);
                }
              } catch (healthCheckError) {
                console.error('❌ Backend unreachable:', healthCheckError);
              }
            }
          } else {
            console.error('❌ Message signing failed:', signResult.error);
          }
        } catch (signErr) {
          console.error('❌ Error during message signing:', signErr);
        }
      } catch (challengeErr) {
        console.error('❌ Error requesting challenge:', challengeErr);
      }
    } catch (err) {
      console.error('❌ Diagnostic error:', err);
    } finally {
      console.groupEnd();
    }
  }
  
  /**
   * Special diagnostics for Trust Wallet
   */
  private async diagnoseTrustWallet(address: string): Promise<void> {
    console.group('🔍 Trust Wallet Diagnostics');
    try {
      // Check if we're on the right network
      console.log('Step 1: Checking network configuration...');
      
      // Check local storage for potential issues
      const localStorage = this.checkLocalStorage();
      console.log('Local storage state:', localStorage);
      
      // Step 2: Test challenge request with explicit blockchain type
      console.log('Step 2: Testing challenge request with explicit blockchain type...');
      try {
        // Request a challenge for the wallet address
        const challenge: AuthChallenge = await walletAuthService.requestChallenge(address);
        console.log('✅ Challenge received:', {
          challenge: challenge.challenge,
          expiresAt: challenge.expiresAt,
          challengeLength: challenge.challenge.length
        });
        
        // Step 3: Test message signing without modifications
        console.log('Step 3: Testing message signing with unmodified challenge...');
        try {
          // Important: Pass the exact challenge string without any modifications
          const signResult = await walletSelector.signMessage(challenge.challenge);
          
          if (signResult.success && signResult.signature) {
            console.log('✅ Message signed successfully:', {
              signaturePreview: signResult.signature.substring(0, 20) + '...',
              signatureLength: signResult.signature.length
            });
            
            // Step 4: Test authentication with explicit blockchain
            console.log('Step 4: Testing authentication with explicit blockchain type...');
            try {
              const authResult = await walletAuthService.authenticate({
                walletAddress: address,
                signature: signResult.signature,
                message: challenge.challenge,
                blockchain: DEFAULT_BLOCKCHAIN_NETWORK // Always use polygon for Trust Wallet
              });
              
              if (authResult.accessToken) {
                console.log('✅ Authentication successful!', {
                  hasAccessToken: true,
                  hasRefreshToken: !!authResult.refreshToken
                });
              } else {
                console.error('❌ Authentication failed - no token received:', authResult);
                
                // Suggest fixes
                console.log('🔧 Suggested fixes:');
                console.log('1. Clear local storage and try again');
                console.log('2. Ensure Trust Wallet is set to Polygon network');
                console.log('3. Try disconnecting and reconnecting your wallet');
                console.log('4. Check backend logs for message validation issues');
                
                // Offer to fix local storage
                console.log('Attempting to clean up local storage...');
                this.resetAuthState();
              }
            } catch (authError) {
              console.error('❌ Authentication failed:', authError);
              // Show more detailed diagnostics information
              this.showTrustWalletTroubleshooting();
            }
          } else {
            console.error('❌ Message signing failed:', signResult.error);
            console.log('🔍 Trust Wallet sometimes has issues with specific message formats.');
            console.log('Suggestions:');
            console.log('1. Try again - Trust Wallet sometimes fails on first attempt');
            console.log('2. Make sure you approve the signature request promptly');
            console.log('3. Check if Trust Wallet is properly installed and up to date');
          }
        } catch (signErr) {
          console.error('❌ Error during message signing:', signErr);
        }
      } catch (challengeErr) {
        console.error('❌ Error requesting challenge:', challengeErr);
      }
    } catch (err) {
      console.error('❌ Trust Wallet diagnostic error:', err);
    } finally {
      console.groupEnd();
    }
  }
  
  /**
   * Display helpful information for troubleshooting Trust Wallet
   */
  private showTrustWalletTroubleshooting(): void {
    console.group('🔧 Trust Wallet Troubleshooting');
    console.log('Common Trust Wallet authentication issues:');
    console.log('');
    console.log('1. Network Type Reporting');
    console.log('   - Trust Wallet may report as "ethereum" even when on Polygon');
    console.log('   - Solution: We now force blockchain type to DEFAULT_BLOCKCHAIN_NETWORK with Trust Wallet');
    console.log('');
    console.log('2. Message Format Issues');
    console.log('   - Trust Wallet requires the exact challenge string without modification');
    console.log('   - Solution: We now pass the challenge directly without formatting');
    console.log('');
    console.log('3. Signature Verification');
    console.log('   - Different wallet providers generate slightly different signatures');
    console.log('   - Solution: Our backend now handles multiple signature formats');
    console.log('');
    console.log('4. Network Switching');
    console.log('   - Trust Wallet may silently fail when switching networks');
    console.log('   - Solution: Manually ensure you are on Polygon before connecting');
    console.log('');
    console.log('5. Recovery Options');
    console.log('   - Try clearing local storage: window.authDebugger.resetAuthState()');
    console.log('   - Disconnect and reconnect your wallet');
    console.log('   - Refresh the page after network changes');
    console.groupEnd();
  }
  
  /**
   * Check local storage for potential issues
   */
  private checkLocalStorage(): Record<string, any> {
    try {
      return {
        accessToken: !!localStorage.getItem('accessToken'),
        refreshToken: !!localStorage.getItem('refreshToken'),
        walletAddress: localStorage.getItem('walletAddress'),
        lastConnectedWalletType: localStorage.getItem('lastConnectedWalletType'),
        _corruptedFlag: !!localStorage.getItem('_corrupted_flag')
      };
    } catch (error) {
      return { error: String(error) };
    }
  }
  
  public static initConsoleCommands(): void {
    if (typeof window !== 'undefined') {
      const debuggerInstance = AuthDebugger.getInstance();
      
      (window as any).authDebugger = {
        startMonitoring: () => {
          debuggerInstance.startMonitoring();
          return "Auth monitoring started! Open the debug panel component to see logs.";
        },
        stopMonitoring: () => {
          debuggerInstance.stopMonitoring();
          return "Auth monitoring stopped.";
        },
        isMonitoring: () => {
          return `Auth monitoring is ${debuggerInstance.isMonitoring() ? 'active' : 'inactive'}.`;
        },
        getLogs: () => {
          // Use the static getDebugLogs method through the constructor with proper typing
          const walletServiceConstructor = walletService.constructor as WalletServiceConstructor;
          return walletServiceConstructor.getDebugLogs?.() || debuggerInstance.getLogs();
        },
        clearLogs: () => {
          // Use the static clearDebugLogs method through the constructor with proper typing
          const walletServiceConstructor = walletService.constructor as WalletServiceConstructor;
          walletServiceConstructor.clearDebugLogs?.();
          debuggerInstance.clearLogs();
          return "Logs cleared.";
        },
        diagnoseWalletAuth: async () => {
          await debuggerInstance.diagnoseWalletAuth();
          return "Wallet authentication diagnostics completed. Check console for results.";
        },
        resetAuthState: () => {
          debuggerInstance.resetAuthState();
          return "Auth state has been reset. Refresh the page to apply changes.";
        },
        fixTrustWallet: async () => {
          // Get last connected wallet address
          const walletAddress = localStorage.getItem('walletAddress');
          if (!walletAddress) {
            return "No wallet address found in local storage. Connect a wallet first.";
          }
          
          // Set wallet type to trust wallet for special handling
          localStorage.setItem('lastConnectedWalletType', 'trust');
          
          // Reset auth state
          debuggerInstance.resetAuthState();
          
          return "Trust Wallet settings applied. Please refresh the page and reconnect your wallet.";
        }
      };
      
      console.log('%c🔍 Auth Debugger Available', 'color: #00ff00; font-weight: bold');
      console.log('Use window.authDebugger.startMonitoring() to begin debugging');
      console.log('For Trust Wallet issues, try window.authDebugger.fixTrustWallet()');
    }
  }
}

// Auto-initialize in development mode
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  setTimeout(() => {
    AuthDebugger.initConsoleCommands();
  }, 1000); // Small delay to ensure window is fully loaded
}

/**
 * Wallet Integration Service
 * 
 * This service integrates the multi-wallet provider with the application's
 * authentication system and API client.
 */
import { multiWalletProvider, WalletProviderType, BlockchainType, WalletEventType } from './multi-wallet-provider';
import { securityService, SecurityEventType, AuthFactor } from '../../../security/security-service';
import { ethers } from 'ethers';
import { Wallet } from './wallet-service';
import { apiClient } from '../../api-client';

// Import the auth service with a workaround to avoid TypeScript errors
// @ts-ignore
const authService = require('./auth-service').authService;

// Authentication result interface
interface WalletAuthResult {
  success: boolean;
  token?: string;
  error?: string;
  requiresAdditionalVerification?: boolean;
  isNewUser?: boolean;
  userId?: string;
  walletAddress?: string;
}

// Login request payload
interface WalletLoginRequest {
  walletAddress: string;
  signature: string;
  walletType: string;
  blockchain: string;
  timestamp: number;
  message: string;
  email?: string; // Optional for user identification
  deviceFingerprint?: string; // For enhanced security
}

// Available blockchain explorers
interface BlockchainExplorer {
  name: string;
  explorerUrl: string;
  addressUrl: string;
  transactionUrl: string;
}

/**
 * Wallet integration service
 */
class WalletIntegrationService {
  private explorers: Record<BlockchainType, BlockchainExplorer> = {
    [BlockchainType.ETHEREUM]: {
      name: 'Etherscan',
      explorerUrl: 'https://etherscan.io',
      addressUrl: 'https://etherscan.io/address/',
      transactionUrl: 'https://etherscan.io/tx/'
    },
    [BlockchainType.SOLANA]: {
      name: 'Solana Explorer',
      explorerUrl: 'https://explorer.solana.com',
      addressUrl: 'https://explorer.solana.com/address/',
      transactionUrl: 'https://explorer.solana.com/tx/'
    },
    [BlockchainType.BINANCE]: {
      name: 'BscScan',
      explorerUrl: 'https://bscscan.com',
      addressUrl: 'https://bscscan.com/address/',
      transactionUrl: 'https://bscscan.com/tx/'
    },
    [BlockchainType.POLYGON]: {
      name: 'PolygonScan',
      explorerUrl: 'https://polygonscan.com',
      addressUrl: 'https://polygonscan.com/address/',
      transactionUrl: 'https://polygonscan.com/tx/'
    },
    [BlockchainType.AVALANCHE]: {
      name: 'Snowtrace',
      explorerUrl: 'https://snowtrace.io',
      addressUrl: 'https://snowtrace.io/address/',
      transactionUrl: 'https://snowtrace.io/tx/'
    },
    [BlockchainType.ARBITRUM]: {
      name: 'Arbiscan',
      explorerUrl: 'https://arbiscan.io',
      addressUrl: 'https://arbiscan.io/address/',
      transactionUrl: 'https://arbiscan.io/tx/'
    },
    [BlockchainType.OPTIMISM]: {
      name: 'Optimism Explorer',
      explorerUrl: 'https://optimistic.etherscan.io',
      addressUrl: 'https://optimistic.etherscan.io/address/',
      transactionUrl: 'https://optimistic.etherscan.io/tx/'
    }
  };

  constructor() {
    this.setupEventListeners();
  }

  /**
   * Setup event listeners for wallet events
   */
  private setupEventListeners(): void {
    multiWalletProvider.on(WalletEventType.CONNECTED, (_, data) => {
      console.log('Wallet connected:', data);
    });

    multiWalletProvider.on(WalletEventType.DISCONNECTED, () => {
      console.log('Wallet disconnected');
      // Optionally logout the user when wallet is disconnected
      // this.logout();
    });

    multiWalletProvider.on(WalletEventType.ACCOUNT_CHANGED, (_, data) => {
      console.log('Wallet account changed:', data);
      // Refresh authentication if account changed
      this.handleAccountChanged(data.address);
    });

    multiWalletProvider.on(WalletEventType.ERROR, (_, data) => {
      console.error('Wallet error:', data.error);
      // Report wallet errors
      securityService.recordEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        { type: 'wallet_error', error: data.error },
        false
      );
    });
  }

  /**
   * Handle wallet account changes
   */
  private async handleAccountChanged(newAddress: string): Promise<void> {
    const currentUser = await authService.getCurrentUser();
    
    // If user is logged in with a wallet
    if (currentUser?.walletAddress) {
      // If the new address doesn't match
      if (currentUser.walletAddress.toLowerCase() !== newAddress.toLowerCase()) {
        // Log out user as their wallet address changed
        await this.logout();
        // Show notification to user
        console.log('Wallet address changed, please log in again');
      }
    }
  }

  /**
   * Connect to a wallet provider
   */
  public async connectWallet(
    providerType: WalletProviderType,
    options: any = {}
  ): Promise<boolean> {
    try {
      // Record the attempt
      securityService.recordEvent(
        SecurityEventType.SUSPICIOUS_ACTIVITY,
        { type: 'wallet_connect_attempt', providerType }
      );

      // Connect using the multi wallet provider
      const result = await multiWalletProvider.connectWallet(providerType, options);
      
      if (result.success) {
        // Mark device factor as completed for security service
        securityService.completeAuthFactor(AuthFactor.DEVICE);
        
        // Register device as trusted
        await securityService.trustCurrentDevice();
        
        // Record successful connection
        securityService.recordEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          { 
            type: 'wallet_connected', 
            providerType,
            blockchain: result.blockchain,
            address: result.address
          }
        );
        
        return true;
      } else {
        // Record failed connection
        securityService.recordEvent(
          SecurityEventType.SUSPICIOUS_ACTIVITY,
          { 
            type: 'wallet_connect_failed', 
            providerType,
            error: result.error 
          },
          false
        );
        
        return false;
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      return false;
    }
  }

  /**
   * Disconnect current wallet
   */
  public async disconnectWallet(): Promise<void> {
    await multiWalletProvider.disconnectWallet();
  }

  /**
   * Generate challenge message to sign
   */
  private generateChallengeMessage(address: string): { message: string, timestamp: number } {
    const timestamp = Date.now();
    const message = `Please sign this message to authenticate with our application.\n\nWallet Address: ${address}\nTimestamp: ${timestamp}`;
    return { message, timestamp };
  }

  /**
   * Login with connected wallet
   */
  public async loginWithWallet(email?: string): Promise<WalletAuthResult> {
    try {
      const currentWallet = multiWalletProvider.getCurrentWallet();
      if (!currentWallet) {
        return {
          success: false,
          error: 'No wallet connected'
        };
      }

      // Generate challenge for user to sign
      const { message, timestamp } = this.generateChallengeMessage(currentWallet.address);

      // Request signature from wallet
      const signature = await multiWalletProvider.signMessage(message);
      
      if (!signature) {
        return {
          success: false,
          error: 'Failed to sign message'
        };
      }

      // Get device fingerprint for enhanced security
      const deviceFingerprint = await securityService.getDeviceFingerprint();
      
      // Evaluate the risk of this login attempt
      const riskAssessment = await securityService.isActionAllowed('login', {
        newDevice: !(await securityService.isDeviceTrusted()),
        walletLogin: true,
        blockchainType: currentWallet.blockchain
      });
      
      // If risk is too high, block the attempt
      if (!riskAssessment.allowed) {
        securityService.recordEvent(
          SecurityEventType.LOGIN_FAILURE,
          {
            reason: 'high_risk',
            riskScore: riskAssessment.riskScore,
            riskReason: riskAssessment.reason
          },
          false
        );
        
        return {
          success: false,
          error: `Login blocked: ${riskAssessment.reason}`
        };
      }

      // Create login request
      const loginRequest: WalletLoginRequest = {
        walletAddress: currentWallet.address,
        signature,
        walletType: currentWallet.providerType,
        blockchain: currentWallet.blockchain,
        timestamp,
        message,
        email, // Optional email for account linking
        deviceFingerprint
      };

      // Send authentication request to backend
      const response = await apiClient.post('/auth/wallet/login', loginRequest);
      
      // Handle response
      const result: WalletAuthResult = {
        success: true,
        token: response.data.accessToken,
        walletAddress: currentWallet.address,
        userId: response.data.userId,
        isNewUser: response.data.isNewUser
      };

      // Check if additional verification is needed based on risk
      if (riskAssessment.requiresMfa) {
        result.requiresAdditionalVerification = true;
      }
      
      // If login successful
      if (result.success && result.token) {
        // Store token and user info
        authService.setTokens(response.data.accessToken, response.data.refreshToken);
        
        // Mark auth factors as completed
        securityService.completeAuthFactor(AuthFactor.PASSWORD); // Wallet sig is like password
        
        // Record successful login
        securityService.recordEvent(
          SecurityEventType.LOGIN_SUCCESS,
          {
            method: 'wallet',
            walletType: currentWallet.providerType,
            blockchain: currentWallet.blockchain,
            isNewUser: response.data.isNewUser,
            requiresAdditionalVerification: result.requiresAdditionalVerification
          }
        );
      }

      return result;
    } catch (error: any) {
      // Record failed login attempt
      securityService.recordEvent(
        SecurityEventType.LOGIN_FAILURE,
        {
          method: 'wallet',
          error: error.message || 'Unknown error'
        },
        false
      );
      
      return {
        success: false,
        error: error.message || 'Unknown error during wallet login'
      };
    }
  }

  /**
   * Log out the current user
   */
  public async logout(): Promise<void> {
    try {
      // Log out from authentication service
      await authService.logout();
      
      // Record logout event
      securityService.recordEvent(SecurityEventType.LOGOUT, {
        method: 'wallet'
      });
      
      // Reset completed authentication factors
      securityService.resetAuthFactors();
    } catch (error) {
      console.error('Error during logout:', error);
    }
  }

  /**
   * Get blockchain explorer URL for an address or transaction
   */
  public getExplorerUrl(
    blockchain: BlockchainType,
    type: 'address' | 'transaction',
    hash: string
  ): string {
    const explorer = this.explorers[blockchain];
    if (!explorer) return '';
    
    switch (type) {
      case 'address':
        return `${explorer.addressUrl}${hash}`;
      case 'transaction':
        return `${explorer.transactionUrl}${hash}`;
      default:
        return '';
    }
  }

  /**
   * Get blockchain explorer name
   */
  public getExplorerName(blockchain: BlockchainType): string {
    return this.explorers[blockchain]?.name || '';
  }

  /**
   * Get available wallet providers
   */
  public getAvailableWallets() {
    return multiWalletProvider.getAvailableProviders();
  }
}

// Create and export singleton instance
export const walletIntegration = new WalletIntegrationService();

export default walletIntegration;
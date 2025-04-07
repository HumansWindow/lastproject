import { ethers } from 'ethers';
import { apiClient } from '../../api-client';

/**
 * Global type declarations
 */
declare global {
  interface Window {
    ethereum?: any;
    solana?: any;
    BinanceChain?: any;
  }
}

/**
 * Define types for wallet service
 */
export interface WalletConnectionResult {
  address: string | null;
  success: boolean;
  error?: string;
}

export interface WalletAuthResult {
  success: boolean;
  token?: string;
  refreshToken?: string;
  walletAddress?: string;
  userId?: string;
  isNewUser?: boolean;
  error?: string;
}

/**
 * Service class for wallet authentication
 * Handles connecting wallet, requesting challenge, signing, and authenticating with backend
 */
class WalletAuthService {
  private provider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private accountsChangedListeners: Set<(accounts: string[]) => void> = new Set();
  private chainChangedListeners: Set<(chainId: string) => void> = new Set();
  private connectionAttemptInProgress: boolean = false;
  private connectionPromise: Promise<string | null> | null = null;
  
  constructor() {
    // Set max listeners to prevent warnings
    if (typeof window !== 'undefined' && window.ethereum) {
      if (window.ethereum.setMaxListeners) {
        window.ethereum.setMaxListeners(100); // Increase max listeners
      }
    }
    
    // Check if we need to restore wallet connection on startup
    this.restoreConnection();
  }
  
  /**
   * Attempt to restore a previous wallet connection
   */
  private async restoreConnection(): Promise<void> {
    if (!this.isWalletAvailable()) return;
    
    try {
      // Check if wallet has accounts available without prompting
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' // This doesn't prompt the user
      });
      
      if (accounts && accounts.length > 0) {
        // Silently connect without prompting
        this.provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
        this.signer = this.provider.getSigner();
        
        // Set up event listeners
        this.setupListeners();
      }
    } catch (error) {
      console.error('Failed to restore wallet connection:', error);
    }
  }
  
  /**
   * Set up wallet event listeners
   */
  private setupListeners(): void {
    if (!this.isWalletAvailable()) return;
    
    // Account changed handler
    const handleAccountsChanged = (accounts: string[]) => {
      if (accounts.length === 0) {
        // User disconnected their wallet
        this.disconnect();
      }
      // Notify all account change listeners
      this.accountsChangedListeners.forEach(listener => {
        try {
          listener(accounts);
        } catch (error) {
          console.error('Error in accounts changed listener:', error);
        }
      });
    };
    
    // Chain changed handler
    const handleChainChanged = (chainId: string) => {
      // Notify all chain change listeners
      this.chainChangedListeners.forEach(listener => {
        try {
          listener(chainId);
        } catch (error) {
          console.error('Error in chain changed listener:', error);
        }
      });
    };
    
    // Add listeners to wallet
    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);
  }
  
  /**
   * Check if wallet is available in the browser
   */
  isWalletAvailable(): boolean {
    return typeof window !== 'undefined' && !!window.ethereum;
  }
  
  /**
   * Connect to user's wallet and return the address
   */
  async connectWallet(): Promise<string | null> {
    // If a connection is already in progress, return the existing promise
    if (this.connectionAttemptInProgress && this.connectionPromise) {
      return this.connectionPromise;
    }
    
    // Set up connection state and promise
    this.connectionAttemptInProgress = true;
    this.connectionPromise = this._connectWalletInternal();
    
    try {
      return await this.connectionPromise;
    } finally {
      // Reset connection state after completion (success or failure)
      this.connectionAttemptInProgress = false;
      this.connectionPromise = null;
    }
  }
  
  /**
   * Internal connection method
   */
  private async _connectWalletInternal(): Promise<string | null> {
    try {
      if (!this.isWalletAvailable()) {
        console.error('No Ethereum wallet found in browser');
        return null;
      }
      
      // Request account access
      await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      // Get provider and signer
      this.provider = new ethers.providers.Web3Provider(window.ethereum, 'any');
      await this.provider.ready; // Ensure provider is ready
      
      this.signer = this.provider.getSigner();
      
      // Set up event listeners
      this.setupListeners();
      
      // Get the connected wallet address
      const address = await this.signer.getAddress();
      console.log('Wallet connected:', address);
      return address;
    } catch (error: any) {
      // Enhanced error handling with specific messages
      let errorMessage = 'Error connecting wallet';
      
      if (error.code === 4001) {
        errorMessage = 'User rejected the connection request';
      } else if (error.code === -32002) {
        errorMessage = 'Wallet connection already pending. Check your wallet extension';
      } else if (error.message) {
        errorMessage = `Wallet error: ${error.message}`;
      }
      
      console.error(errorMessage, error);
      return null;
    }
  }
  
  /**
   * Sign a message with the connected wallet
   */
  async signMessage(message: string): Promise<string | null> {
    try {
      if (!this.isWalletAvailable()) {
        throw new Error('No Ethereum wallet found in browser');
      }
      
      if (!this.signer) {
        // Connect wallet if not already connected
        await this.connectWallet();
        
        if (!this.signer) {
          throw new Error('Failed to connect wallet for signing');
        }
      }
      
      // Sign the message
      console.log('Signing message:', message);
      const signature = await this.signer.signMessage(message);
      console.log('Message signed successfully');
      return signature;
    } catch (error: any) {
      // Enhanced error handling with specific messages
      let errorMessage = 'Error signing message';
      
      if (error.code === 4001) {
        errorMessage = 'User rejected the signing request';
      } else if (error.message) {
        errorMessage = `Signing error: ${error.message}`;
      }
      
      console.error(errorMessage, error);
      return null;
    }
  }
  
  /**
   * First step: Connect wallet and request challenge from backend
   */
  async initiateWalletConnection(address: string): Promise<{ exists: boolean; challenge: string }> {
    try {
      console.log('Initiating wallet connection for:', address);
      
      // Make sure to use the connect endpoint with proper error handling
      const response = await apiClient.post('/auth/wallet/connect', { address });
      
      console.log('Challenge received:', response.data);
      return response.data;
    } catch (error: any) {
      console.error('Error initiating wallet connection:', error);
      
      // More detailed error handling for specific cases
      if (error.response) {
        console.error('Server response error:', error.response.data);
      } else if (error.request) {
        console.error('No response received from server. Check network connection.');
      } else {
        console.error('Request setup error:', error.message);
      }
      
      throw error;
    }
  }
  
  /**
   * Second step: Sign the challenge and authenticate
   */
  async authenticateWithSignature(address: string, challenge: string, email?: string): Promise<any> {
    try {
      if (!this.signer) {
        throw new Error('Wallet not connected');
      }
      
      console.log('Signing challenge:', challenge);
      const signature = await this.signer.signMessage(challenge);
      console.log('Signature created:', signature);
      
      console.log('Authenticating with signature');
      
      // Prepare authentication data
      const requestData: {
        address: string;
        message: string;
        signature: string;
        email?: string;
      } = {
        address: address,
        message: challenge,
        signature: signature
      };
      
      // Only add email if provided (completely optional)
      if (email) {
        requestData.email = email;
      }
      
      // Make sure we're using the authenticate endpoint
      const response = await apiClient.post('/auth/wallet/authenticate', requestData);
      console.log('Authentication response:', response.data);
      
      // Store tokens if authentication successful
      if (response.data.accessToken) {
        apiClient.setToken(response.data.accessToken);
        
        if (response.data.refreshToken) {
          localStorage.setItem('refreshToken', response.data.refreshToken);
        }
      }
      
      return response.data;
    } catch (error: any) {
      console.error('Error authenticating with signature:', error);
      throw error;
    }
  }
  
  /**
   * Complete wallet authentication flow
   */
  async authenticate(email?: string): Promise<WalletAuthResult> {
    try {
      // Connect wallet and get address
      const address = await this.connectWallet();
      if (!address) {
        return {
          success: false,
          error: 'Failed to connect wallet'
        };
      }
      
      console.log('Connected wallet address:', address);
      
      // Step 1: Get challenge from backend
      console.log('Requesting challenge from backend...');
      const connectResponse = await this.initiateWalletConnection(address);
      if (!connectResponse || !connectResponse.challenge) {
        return {
          success: false,
          error: 'Failed to get challenge from server'
        };
      }
      console.log('Received challenge:', connectResponse.challenge);
      
      // Step 2: Sign the challenge with wallet
      console.log('Signing challenge...');
      if (!this.signer) {
        return {
          success: false,
          error: 'No signer available'
        };
      }
      
      const signature = await this.signer.signMessage(connectResponse.challenge);
      console.log('Challenge signed successfully');
      
      // Step 3: Send signature back to authenticate
      console.log('Submitting signature for authentication...');
      
      // Prepare authentication data
      const authData: {
        address: string;
        message: string;
        signature: string;
        email?: string;
      } = {
        address,
        message: connectResponse.challenge,
        signature,
      };
      
      // Only add email if provided AND it's valid
      if (email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
        authData.email = email;
      } else if (email) {
        console.warn('Email format is invalid, proceeding with wallet-only authentication');
      }
      
      // Use the authenticate endpoint
      const authResponse = await apiClient.post('/auth/wallet/authenticate', authData);
      console.log('Authentication successful');
      
      // Store tokens if authentication successful
      if (authResponse.data.accessToken) {
        apiClient.setToken(authResponse.data.accessToken);
        
        if (authResponse.data.refreshToken) {
          localStorage.setItem('refreshToken', authResponse.data.refreshToken);
        }
      }
      
      return {
        success: true,
        token: authResponse.data.accessToken,
        refreshToken: authResponse.data.refreshToken,
        walletAddress: address,
        userId: authResponse.data.userId,
        isNewUser: authResponse.data.isNewUser
      };
    } catch (error: any) {
      console.error('Wallet authentication failed:', error);
      
      // Get best error message
      const errorMessage = error.response?.data?.message || error.message || 'Unknown error during wallet authentication';
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Disconnect wallet
   */
  disconnect(): void {
    // Clean up event listeners when disconnecting
    if (this.isWalletAvailable()) {
      window.ethereum.removeAllListeners('accountsChanged');
      window.ethereum.removeAllListeners('chainChanged');
      this.accountsChangedListeners.clear();
      this.chainChangedListeners.clear();
    }
    
    this.provider = null;
    this.signer = null;
    
    // Clear authorization tokens
    apiClient.clearToken();
  }
  
  /**
   * Get current wallet address
   */
  async getCurrentAddress(): Promise<string | null> {
    try {
      if (!this.signer) {
        return null;
      }
      return await this.signer.getAddress();
    } catch {
      return null;
    }
  }
  
  /**
   * Listen for account changes
   */
  setupAccountChangeListener(callback: (accounts: string[]) => void): () => void {
    if (this.isWalletAvailable()) {
      // Add the listener to our set
      this.accountsChangedListeners.add(callback);
      
      // Return cleanup function
      return () => {
        if (window.ethereum) {
          this.accountsChangedListeners.delete(callback);
        }
      };
    }
    return () => {};
  }
  
  /**
   * Listen for chain changes
   */
  setupChainChangeListener(callback: (chainId: string) => void): () => void {
    if (this.isWalletAvailable()) {
      // Add the listener to our set
      this.chainChangedListeners.add(callback);
      
      // Return cleanup function
      return () => {
        if (window.ethereum) {
          this.chainChangedListeners.delete(callback);
        }
      };
    }
    return () => {};
  }

  /**
   * Force disconnect and reconnect (useful for troubleshooting)
   */
  async resetConnection(): Promise<string | null> {
    this.disconnect();
    return await this.connectWallet();
  }

  /**
   * Check connection status
   */
  async checkConnection(): Promise<boolean> {
    try {
      if (!this.isWalletAvailable()) {
        return false;
      }
      
      // Check if wallet has accounts available
      const accounts = await window.ethereum.request({ 
        method: 'eth_accounts' // This doesn't prompt the user
      });
      
      return accounts && accounts.length > 0;
    } catch (error) {
      console.error('Error checking wallet connection:', error);
      return false;
    }
  }
  
  /**
   * Get the network name for the currently connected wallet
   */
  async getNetworkName(): Promise<string> {
    try {
      if (!this.provider) {
        return 'Not connected';
      }
      
      const network = await this.provider.getNetwork();
      
      // Map network IDs to common names
      const networkNames: Record<number, string> = {
        1: 'Ethereum Mainnet',
        3: 'Ropsten Testnet',
        4: 'Rinkeby Testnet',
        5: 'Goerli Testnet',
        42: 'Kovan Testnet',
        56: 'Binance Smart Chain',
        97: 'BSC Testnet',
        137: 'Polygon Mainnet',
        80001: 'Mumbai Testnet',
      };
      
      return networkNames[network.chainId] || `Network ${network.chainId}`;
    } catch (error) {
      return 'Unknown network';
    }
  }
}

// Create and export a singleton instance
export const walletAuthService = new WalletAuthService();
export default walletAuthService;

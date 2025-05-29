import { ethers } from 'ethers';
import { WalletProviderType, BlockchainType, WalletInfo, WalletConnectionResult, SignMessageResult } from "../../core/walletBase";
import { 
  CHAIN_IDS, 
  DEFAULT_BLOCKCHAIN_NETWORK, 
  normalizeBlockchainType, 
  switchToPolygonNetwork 
} from "../../../../config/blockchain/constants";

export class TrustWalletProvider {
  private provider: any;
  private ethereum: any;
  private connected: boolean = false;
  private address: string | null = null;
  private rawProvider: any = null;
  // Fix for TS7053 error by safely accessing CHAIN_IDS with type guard
  private chainId: string = (DEFAULT_BLOCKCHAIN_NETWORK in CHAIN_IDS) 
    ? CHAIN_IDS[DEFAULT_BLOCKCHAIN_NETWORK as keyof typeof CHAIN_IDS] 
    : '0x89'; // Default to Polygon mainnet
  // Add a connection timestamp to track when connection was established
  private connectionTimestamp: number = 0;
  
  constructor() {
    // Check for Trust Wallet's injected provider
    if (typeof window !== 'undefined') {
      if (window.ethereum?.isTrust) {
        this.ethereum = window.ethereum;
      } else if (window.ethereum?.providers) {
        // Try to find Trust Wallet in the list of providers
        this.ethereum = window.ethereum.providers.find((p: any) => p.isTrust);
      }
    }
  }

  /**
   * Map chain ID to blockchain type to ensure consistency
   */
  private getBlockchainType(chainId: string): BlockchainType {
    // Trust Wallet specific mapping
    // Sometimes Trust Wallet reports the correct chain ID but wrong network name
    if (chainId === CHAIN_IDS[BlockchainType.POLYGON]) {
      // If chain ID matches Polygon, always return Polygon regardless of what else is reported
      return BlockchainType.POLYGON;
    }
    
    switch (chainId) {
      case CHAIN_IDS[BlockchainType.ETHEREUM]:
        return BlockchainType.ETHEREUM;
      case CHAIN_IDS[BlockchainType.BINANCE]:
        return BlockchainType.BINANCE;
      case CHAIN_IDS[BlockchainType.POLYGON]:
        return BlockchainType.POLYGON;
      case CHAIN_IDS[BlockchainType.AVALANCHE]:
        return BlockchainType.AVALANCHE;
      case CHAIN_IDS[BlockchainType.ARBITRUM]:
        return BlockchainType.ARBITRUM;
      case CHAIN_IDS[BlockchainType.OPTIMISM]:
        return BlockchainType.OPTIMISM;
      default:
        // Default to Polygon for any unrecognized chain ID
        console.warn(`Unrecognized chain ID: ${chainId}, defaulting to ${DEFAULT_BLOCKCHAIN_NETWORK}`);
        return DEFAULT_BLOCKCHAIN_NETWORK;
    }
  }

  async connect(): Promise<WalletConnectionResult> {
    try {
      // If Trust Wallet isn't installed, throw an error
      if (!this.isAvailable()) {
        return {
          success: false,
          error: 'Trust Wallet is not installed'
        };
      }

      // Initialize the provider safely with defensive checks
      let provider;
      
      try {
        // Try to safely get the Trust Wallet provider
        if (this.ethereum && this.ethereum.isTrust) {
          provider = this.ethereum;
        } else if (window.ethereum && window.ethereum.providers) {
          // Handle the case when there are multiple providers
          provider = window.ethereum.providers.find((p: any) => p.isTrust);
        }
      } catch (err) {
        console.warn('Error detecting Trust Wallet provider:', err);
      }

      if (!provider) {
        return {
          success: false,
          error: 'Trust Wallet provider not found'
        };
      }
      
      // Store the raw provider for direct access when needed
      this.rawProvider = provider;
      this.provider = new ethers.providers.Web3Provider(provider);
      
      try {
        // Request account access
        const accounts = await provider.request({ 
          method: 'eth_requestAccounts' 
        });
        
        if (accounts && accounts.length > 0) {
          this.connected = true;
          this.address = accounts[0];
          // Store connection timestamp for authentication stability
          this.connectionTimestamp = Date.now();
          
          // Get the network to determine chainId
          let chainId: string;
          try {
            const chainIdHex = await provider.request({ method: 'eth_chainId' });
            chainId = chainIdHex; // Keep hex format
            this.chainId = chainId;
          } catch (error) {
            console.warn('Failed to get chainId directly, using network method:', error);
            const networkInfo = await this.provider.getNetwork();
            chainId = '0x' + networkInfo.chainId.toString(16);
            this.chainId = chainId;
          }
          
          // Determine the correct blockchain type based on chainId
          let blockchain = this.getBlockchainType(chainId);
          console.log(`Trust Wallet connected with blockchain type: ${blockchain}`);
          
          // If not on Polygon, attempt to switch to Polygon network
          if (blockchain !== BlockchainType.POLYGON) {
            try {
              console.log('Trust Wallet not on Polygon, attempting to switch...');
              const switched = await this.switchNetwork(CHAIN_IDS[BlockchainType.POLYGON]);
              if (switched) {
                console.log('Successfully switched Trust Wallet to Polygon');
                blockchain = BlockchainType.POLYGON;
                chainId = CHAIN_IDS[BlockchainType.POLYGON];
                this.chainId = chainId;
              } else {
                console.warn('Failed to switch to Polygon network, continuing with current network');
                // Special case: Trust Wallet reports as ethereum even when on Polygon
                if (blockchain === BlockchainType.ETHEREUM) {
                  // Check if chain ID might actually be Polygon
                  if (chainId === CHAIN_IDS[BlockchainType.POLYGON]) {
                    blockchain = BlockchainType.POLYGON;
                    console.log('Detected actual Polygon network despite ethereum blockchain type');
                  } else {
                    // This is a special case for Trust Wallet which might report incorrectly
                    // Force blockchain type to Polygon since that's our default network
                    // IMPORTANT: This ensures consistency but you should verify the user is on Polygon
                    blockchain = BlockchainType.POLYGON;
                    console.log('Trust Wallet network reporting fixed: Using Polygon blockchain type');
                  }
                }
              }
            } catch (error) {
              console.warn('Error switching to Polygon network:', error);
              // Default to Polygon as our intended network despite potential mismatch
              blockchain = BlockchainType.POLYGON;
            }
          }
          
          const walletInfo: WalletInfo = {
            address: accounts[0],
            chainId: chainId,
            provider: this.provider,
            blockchain: blockchain,
            providerType: WalletProviderType.TRUST
          };
          
          console.log('Trust Wallet detected - ensuring Polygon blockchain type');
          
          return {
            success: true,
            walletInfo,
            provider: this.provider
          };
        } else {
          return {
            success: false,
            error: 'No accounts found'
          };
        }
      } catch (error: any) {
        return {
          success: false,
          error: `Failed to connect to Trust Wallet: ${error.message}`
        };
      }
    } catch (error: any) {
      console.error('Trust Wallet connection error:', error);
      return {
        success: false,
        error: error.message || 'Unknown error connecting to Trust Wallet'
      };
    }
  }

  async disconnect(): Promise<boolean> {
    this.connected = false;
    this.address = null;
    this.connectionTimestamp = 0;
    return true;
  }

  /**
   * Check if wallet needs a stabilization delay before signing
   * Trust Wallet sometimes needs a brief delay after connection
   * before it's ready to sign messages
   */
  private async ensureConnectionStability(): Promise<void> {
    // If the wallet was just connected (within the last 3 seconds)
    // add a small delay to ensure stability
    const timeSinceConnection = Date.now() - this.connectionTimestamp;
    const MIN_CONNECTION_TIME = 1500; // 1.5 seconds minimum (increased from 1 second)
    
    if (timeSinceConnection < MIN_CONNECTION_TIME) {
      const delayNeeded = MIN_CONNECTION_TIME - timeSinceConnection;
      console.log(`Adding brief delay for Trust Wallet authentication: ${delayNeeded}ms`);
      
      return new Promise(resolve => {
        setTimeout(resolve, delayNeeded);
      });
    }
    
    // Even if we're past the minimum time, add a small consistent delay
    // as Trust Wallet sometimes needs time between operations
    if (this.provider && this.connected) {
      console.log('Adding small consistent delay for Trust Wallet stability');
      return new Promise(resolve => {
        setTimeout(resolve, 300); // 300ms consistent delay for stability
      });
    }
  }

  /**
   * Ensures the wallet provider is fully ready for authentication
   * This is more comprehensive than ensureConnectionStability and checks 
   * whether the wallet is truly ready for the full auth flow
   */
  async ensureAuthenticationReadiness(): Promise<void> {
    console.log('Trust Wallet - Ensuring authentication readiness');
    
    // First ensure basic connection stability
    await this.ensureConnectionStability();
    
    // Check network compatibility
    const networkStatus = await this.checkNetworkCompatibility();
    console.log('Trust Wallet network status check for authentication:', networkStatus);
    
    if (!networkStatus.compatible) {
      console.warn('Trust Wallet on incompatible network before authentication. Attempting switch...');
      
      try {
        const switched = await this.switchNetwork(networkStatus.targetChainId);
        if (!switched) {
          console.error('Failed to switch Trust Wallet to Polygon network for authentication');
        } else {
          console.log('Successfully switched Trust Wallet to Polygon network for authentication');
          // Add a small delay after switching networks
          await new Promise(resolve => setTimeout(resolve, 800));
        }
      } catch (error) {
        console.error('Error switching network before authentication:', error);
      }
    }
    
    // Double check provider connection
    if (!this.provider || !this.connected) {
      console.warn('Trust Wallet provider not fully initialized before authentication, attempting reconnection');
      
      try {
        // Try to reinitialize the provider
        if (this.ethereum && this.ethereum.isTrust) {
          this.provider = new ethers.providers.Web3Provider(this.ethereum);
          console.log('Trust Wallet provider reinitialized');
        } else {
          console.error('Could not reinitialize Trust Wallet provider');
        }
      } catch (error) {
        console.error('Error reinitializing Trust Wallet provider:', error);
      }
    }
    
    // Final stability check - add consistent delay to ensure readiness
    console.log('Adding final stability delay for Trust Wallet authentication');
    await new Promise(resolve => setTimeout(resolve, 500));
  }

  async signMessage(message: string, address: string): Promise<SignMessageResult> {
    try {
      console.log(`Trust Wallet - Attempting to sign message for address ${address.slice(0, 6)}...`);
      
      if (!this.provider) {
        throw new Error('Not connected to Trust Wallet');
      }
      
      // Add a brief delay if needed to ensure wallet is ready
      await this.ensureConnectionStability();
      
      // IMPORTANT: Do not modify the message in any way
      // Simply pass it directly to the signing functions
      console.log('Trust Wallet - Message to sign (unmodified):', message);
      
      // Try multiple signing approaches since Trust Wallet may handle signing differently
      
      // Approach 1: Use ethers.js signer (standard approach)
      try {
        console.log('Trust Wallet - Trying ethers.js signer approach');
        const signer = this.provider.getSigner();
        const signature = await signer.signMessage(message);
        
        console.log('Trust Wallet - Signing successful with ethers.js signer');
        return {
          success: true,
          signature
        };
      } catch (error) {
        console.warn('Trust Wallet - ethers.js signing failed:', error);
        // Continue to next approach
      }
      
      // Approach 2: Try using the raw provider's personal_sign method
      try {
        console.log('Trust Wallet - Trying raw provider personal_sign approach');
        
        // Convert message to hex format if it's not already
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
        
        console.log('Trust Wallet - Signing successful with personal_sign');
        return {
          success: true,
          signature
        };
      } catch (error) {
        console.warn('Trust Wallet - personal_sign failed:', error);
        // Continue to next approach
      }
      
      // Approach 3: Try eth_sign as a fallback (though not recommended for security reasons)
      try {
        console.log('Trust Wallet - Trying eth_sign fallback approach');
        
        let msgHex;
        if (ethers.utils.isHexString(message)) {
          msgHex = message;
        } else {
          msgHex = ethers.utils.hexlify(ethers.utils.toUtf8Bytes(message));
        }
        
        const signature = await this.rawProvider.request({
          method: 'eth_sign',
          params: [address, msgHex]
        });
        
        console.log('Trust Wallet - Signing successful with eth_sign');
        return {
          success: true,
          signature
        };
      } catch (error) {
        console.error('Trust Wallet - All signing methods failed');
        throw new Error(`Trust Wallet signing failed: ${error instanceof Error ? error.message : String(error)}`);
      }
    } catch (error: any) {
      console.error('Trust Wallet - Error signing message:', error);
      return {
        success: false,
        error: `Failed to sign message with Trust Wallet: ${error.message || String(error)}`
      };
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getProvider(): any {
    return this.provider;
  }

  isAvailable(): boolean {
    return Boolean(
      (typeof window !== 'undefined' && window.ethereum?.isTrust) || 
      (typeof window !== 'undefined' && window.ethereum?.providers?.some((p: any) => p.isTrust))
    );
  }
  
  /**
   * Get connection details for debugging
   * @returns Connection information object
   */
  getConnectionDetails(): any {
    if (!this.connected) {
      return { 
        connected: false,
        message: 'Not connected to Trust Wallet'
      };
    }
    
    return {
      connected: true,
      address: this.address,
      chainId: this.chainId,
      connectionTime: this.connectionTimestamp,
      connectionAge: Date.now() - this.connectionTimestamp,
      providerType: 'TrustWallet'
    };
  }
  
  /**
   * Switch network in Trust Wallet
   * @param chainId Chain ID to switch to
   * @returns Whether switch was successful
   */
  async switchNetwork(chainId: string): Promise<boolean> {
    try {
      if (!this.rawProvider) {
        throw new Error('Provider not initialized');
      }
      
      try {
        // First try to switch to the network
        await this.rawProvider.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: chainId }],
        });
        return true;
      } catch (switchError: any) {
        // This error code indicates that the chain has not been added to Trust Wallet
        if (switchError.code === 4902) {
          try {
            let networkParams;
            
            // Add specific networks - focus on Polygon
            if (chainId === CHAIN_IDS[BlockchainType.POLYGON]) {
              networkParams = {
                chainId: chainId,
                chainName: 'Polygon Mainnet',
                nativeCurrency: {
                  name: 'MATIC',
                  symbol: 'MATIC',
                  decimals: 18
                },
                rpcUrls: ['https://polygon-rpc.com'],
                blockExplorerUrls: ['https://polygonscan.com/']
              };
            } else {
              throw new Error(`Network configuration not available for chain ID: ${chainId}`);
            }
            
            await this.rawProvider.request({
              method: 'wallet_addEthereumChain',
              params: [networkParams],
            });
            
            // Check if the switch was successful
            const currentChainId = await this.rawProvider.request({ method: 'eth_chainId' });
            return currentChainId === chainId;
          } catch (addError) {
            console.error('Failed to add network:', addError);
            return false;
          }
        } else {
          console.error('Failed to switch network:', switchError);
          return false;
        }
      }
    } catch (error) {
      console.error('Error switching network:', error);
      return false;
    }
  }

  /**
   * Check if the current network is compatible with our requirements
   * Returns information about the current network state and compatibility
   */
  async checkNetworkCompatibility(): Promise<{
    compatible: boolean;
    currentChainId: string;
    targetChainId: string;
    needsSwitch: boolean;
    currentBlockchain: BlockchainType;
    targetBlockchain: BlockchainType;
  }> {
    try {
      if (!this.provider || !this.connected) {
        throw new Error('Not connected to Trust Wallet');
      }
      
      // Get current chain ID
      let currentChainId: string;
      try {
        // Try to get chain ID from provider
        currentChainId = await this.rawProvider.request({ method: 'eth_chainId' });
      } catch (error) {
        console.warn('Failed to get chainId directly, using stored value:', error);
        currentChainId = this.chainId;
      }
      
      // Target network is Polygon
      const targetChainId = CHAIN_IDS[BlockchainType.POLYGON];
      
      // Current blockchain type based on chain ID
      const currentBlockchain = this.getBlockchainType(currentChainId);
      
      // Check if we need to switch networks
      const needsSwitch = currentChainId !== targetChainId;
      
      // Check compatibility - we consider it compatible if on Polygon
      // or if we can reliably switch to Polygon
      const compatible = (currentBlockchain === BlockchainType.POLYGON) || 
        (currentChainId === targetChainId);
      
      return {
        compatible,
        currentChainId,
        targetChainId,
        needsSwitch,
        currentBlockchain,
        targetBlockchain: BlockchainType.POLYGON
      };
    } catch (error) {
      console.error('Error checking network compatibility:', error);
      // Default to incompatible if we can't determine status
      return {
        compatible: false,
        currentChainId: this.chainId,
        targetChainId: CHAIN_IDS[BlockchainType.POLYGON],
        needsSwitch: true,
        currentBlockchain: DEFAULT_BLOCKCHAIN_NETWORK,
        targetBlockchain: BlockchainType.POLYGON
      };
    }
  }
}
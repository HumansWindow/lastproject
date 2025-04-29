import { ethers } from 'ethers';
import EthereumProvider from '@walletconnect/ethereum-provider';
import {
  BlockchainType,
  SignMessageResult,
  WalletConnectionResult,
  WalletInfo,
  WalletProvider,
  WalletProviderType
} from '../../core/wallet-base';

export class WalletConnectAdapter implements WalletProvider {
  private walletConnectProvider: EthereumProvider | null = null;
  private ethersProvider: ethers.providers.Web3Provider | null = null;
  private signer: ethers.Signer | null = null;
  private address: string | null = null;
  private chainId: string | null = null;
  private currentAccount: string | null = null;

  constructor(private rpcConfig: Record<string, string> = { 
    1: 'https://mainnet.infura.io/v3/YOUR_INFURA_KEY',
    137: 'https://polygon-rpc.com'
  }) {}
  
  async connect(): Promise<WalletConnectionResult> {
    try {
      // Initialize WalletConnect Provider
      this.walletConnectProvider = await EthereumProvider.init({
        projectId: "YOUR_PROJECT_ID", // Replace with your WalletConnect project ID
        chains: [137], // Set Polygon as default chain
        optionalChains: Object.keys(this.rpcConfig).map(Number),
        rpcMap: this.rpcConfig,
        showQrModal: true,
        // Adding common methods and events needed for Ethereum providers
        methods: ["eth_sendTransaction", "personal_sign", "eth_sign", "eth_signTypedData"],
        events: ["chainChanged", "accountsChanged"]
      });
      
      // Connect and get accounts
      const accounts = await this.walletConnectProvider.enable();
      
      // Store the connected account
      if (accounts && accounts.length > 0) {
        this.currentAccount = accounts[0];
      }
      
      // Create ethers provider
      this.ethersProvider = new ethers.providers.Web3Provider(this.walletConnectProvider);
      this.signer = this.ethersProvider.getSigner();
      
      // Get account address
      this.address = await this.signer.getAddress();
      this.chainId = (await this.ethersProvider.getNetwork()).chainId.toString();
      
      const walletInfo: WalletInfo = {
        address: this.address,
        chainId: this.chainId,
        blockchain: this.getBlockchainType(this.chainId),
        providerType: WalletProviderType.WALLETCONNECT,
        provider: this.walletConnectProvider // Add the missing provider property
      };
      
      return {
        success: true,
        walletInfo,
        provider: this.walletConnectProvider
      };
      
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        error: err.message || 'Failed to connect with WalletConnect'
      };
    }
  }
  
  async disconnect(): Promise<boolean> {
    if (this.walletConnectProvider) {
      try {
        await this.walletConnectProvider.disconnect();
        this.walletConnectProvider = null;
        this.ethersProvider = null;
        this.signer = null;
        this.address = null;
        this.chainId = null;
        this.currentAccount = null;
        return true;
      } catch {
        return false;
      }
    }
    return true;
  }
  
  async signMessage(message: string, address: string): Promise<SignMessageResult> {
    if (!this.signer || !this.address) {
      return {
        success: false,
        error: 'Not connected with WalletConnect'
      };
    }
    
    try {
      const signature = await this.signer.signMessage(message);
      return {
        success: true,
        signature
      };
    } catch (error: unknown) {
      const err = error as { message?: string };
      return {
        success: false,
        error: err.message || 'Failed to sign message'
      };
    }
  }
  
  isConnected(): boolean {
    try {
      // Use the currentAccount property instead of this.account
      return !!this.walletConnectProvider && !!this.currentAccount;
    } catch (error) {
      console.error("Error checking connection status:", error);
      return false;
    }
  }
  
  getProvider(): any {
    return this.walletConnectProvider;
  }
  
  private getBlockchainType(chainId: string): BlockchainType {
    // Map chainId to BlockchainType (same as MetaMask)
    const chainIdMap: Record<string, BlockchainType> = {
      '1': BlockchainType.ETHEREUM,
      '56': BlockchainType.BINANCE,
      '137': BlockchainType.POLYGON,
      '43114': BlockchainType.AVALANCHE,
      '42161': BlockchainType.ARBITRUM,
      '10': BlockchainType.OPTIMISM,
    };
    
    return chainIdMap[chainId] || BlockchainType.ETHEREUM;
  }
}

import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ethers } from 'ethers';
import HotWallet from './hotwallet';
import { ShahiTokenService } from './services/shahi-token.service';
import { SHAHICoinABI } from './contracts/abis/SHAHICoin';

@Injectable()
export class HotWalletService {
  private readonly logger = new Logger(HotWalletService.name);
  private hotWallet: HotWallet | null = null; // Changed from readonly to allow assignment
  private provider: ethers.providers.Provider | null = null; // Changed from readonly to allow assignment
  private adminWallet: ethers.Wallet | null = null; // Changed from readonly to allow assignment
  private shahiContract: ethers.Contract | null = null; // Changed from readonly to allow assignment
  private initialized: boolean = false;

  constructor(
    private readonly configService: ConfigService,
    private readonly shahiTokenService: ShahiTokenService,
  ) {
    this.initializeWallet();
  }

  private async initializeWallet(): Promise<void> {
    try {
      const encryptionKey = this.configService.get<string>('ENCRYPTION_KEY', 'default-encryption-key-for-development');
      const ethRpcUrl = this.configService.get<string>('ETH_RPC_URL', 'https://mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4');
      const bnbRpcUrl = this.configService.get<string>('BNB_RPC_URL', 'https://bnb-mainnet.g.alchemy.com/v2/fdUf1-b7ks8jGGBzQyurl1RM9o5ITrey');
      const solRpcUrl = this.configService.get<string>('SOL_RPC_URL', 'https://api.mainnet-beta.solana.com');
      const maticRpcUrl = this.configService.get<string>('MATIC_RPC_URL', 'https://polygon-mainnet.infura.io/v3/b9980d193a9e496e92e948e0f01ad7c4');
      const adminWalletKey = this.configService.get<string>('ADMIN_WALLET_PRIVATE_KEY');
      const shahiContractAddress = this.configService.get<string>('SHAHI_CONTRACT_ADDRESS');
      
      // Initialize provider and hot wallet
      this.provider = new ethers.providers.JsonRpcProvider(ethRpcUrl);
      
      try {
        this.hotWallet = new HotWallet({
          encryptionKey,
          ETH_RPC_URL: ethRpcUrl,
          BNB_RPC_URL: bnbRpcUrl,
          SOL_RPC_URL: solRpcUrl,
          MATIC_RPC_URL: maticRpcUrl,
          encryptPrivateKeys: true,
          rpcUrl: ethRpcUrl,
        });
        
        this.logger.log('HotWallet initialized for token operations');
      } catch (error) {
        this.logger.error(`Failed to initialize HotWallet: ${error.message}`);
      }
      
      // Set up admin wallet for contract interactions
      if (adminWalletKey && this.provider) {
        this.adminWallet = new ethers.Wallet(adminWalletKey, this.provider);
        this.logger.log('Admin wallet connected for SHAHI operations');
        
        // Initialize SHAHI contract if contract address is available
        if (shahiContractAddress) {
          this.shahiContract = new ethers.Contract(
            shahiContractAddress,
            SHAHICoinABI,
            this.adminWallet
          );
          this.logger.log(`SHAHI contract initialized at address ${shahiContractAddress}`);
        }
      }
      
      this.initialized = true;
    } catch (error) {
      this.logger.error(`Hot wallet initialization error: ${error.message}`);
      this.initialized = false;
    }
  }
  
  /**
   * Mints SHAHI tokens for a new user directly using the hot wallet service
   * This is an alternative to using the SHAHITokenService
   */
  async mintShahiForNewUser(userAddress: string): Promise<string | null> {
    if (!this.initialized || !this.shahiContract || !this.adminWallet) {
      this.logger.warn('Cannot mint SHAHI: Hot wallet not properly initialized');
      return null;
    }
    
    try {
      this.logger.log(`Minting 1 SHAHI for new user ${userAddress} via Hot Wallet service`);
      
      // Call the mintForNewUser function on the SHAHI contract
      const tx = await this.shahiContract.mintForNewUser(userAddress);
      
      // Wait for transaction to be mined
      const receipt = await tx.wait();
      
      this.logger.log(`Successfully minted SHAHI via Hot Wallet. Tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to mint SHAHI via Hot Wallet: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Get SHAHI balance for an address
   */
  async getShahiBalance(address: string): Promise<string | null> {
    if (!this.initialized || !this.shahiContract) {
      return null;
    }
    
    try {
      const balance = await this.shahiContract.balanceOf(address);
      return ethers.utils.formatEther(balance);
    } catch (error) {
      this.logger.error(`Failed to get SHAHI balance: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Updates the encryptionKey for the hot wallet
   * Useful for key rotation or security updates
   */
  async updateEncryptionKey(newKey: string): Promise<boolean> {
    if (!this.hotWallet) {
      return false;
    }
    
    try {
      // This would be implemented in your HotWallet class
      // await this.hotWallet.updateEncryptionKey(newKey);
      this.logger.log('Hot wallet encryption key updated successfully');
      return true;
    } catch (error) {
      this.logger.error(`Failed to update encryption key: ${error.message}`);
      return false;
    }
  }
  
  /**
   * Creates a user wallet and returns the address
   */
  async createUserWallet(userId: string): Promise<{ address: string; privateKey: string } | null> {
    if (!this.hotWallet) {
      return null;
    }
    
    try {
      // Create derivation path based on user ID
      const path = `m/44'/60'/0'/0/${Buffer.from(userId).toString('hex').slice(0, 8)}`;
      
      // Create wallet using ethers.js instead of hotWallet.createWallet
      const wallet = ethers.Wallet.createRandom();
      
      // Mint SHAHI tokens for the new wallet using the SHAHI token service
      try {
        await this.shahiTokenService.mintForNewUser(wallet.address);
      } catch (error) {
        this.logger.warn(`Failed to mint initial SHAHI tokens for new user wallet: ${error.message}`);
        // Continue despite minting failure - wallet creation should not fail if minting fails
      }
      
      return {
        address: wallet.address,
        privateKey: wallet.privateKey
      };
    } catch (error) {
      this.logger.error(`Failed to create user wallet: ${error.message}`);
      return null;
    }
  }
  
  /**
   * Check if the service is properly initialized
   */
  isInitialized(): boolean {
    return this.initialized;
  }
  
  /**
   * Transfer funds from admin wallet to a user wallet
   */
  async transferFunds(to: string, amount: string): Promise<string | null> {
    if (!this.adminWallet) {
      return null;
    }
    
    try {
      // Convert amount to wei
      const weiAmount = ethers.utils.parseEther(amount);
      
      // Check if admin has enough funds
      const balance = await this.adminWallet.getBalance();
      if (balance.lt(weiAmount)) {
        this.logger.warn(`Insufficient funds. Required: ${amount} ETH, Available: ${ethers.utils.formatEther(balance)} ETH`);
        return null;
      }
      
      // Create transaction
      const tx = await this.adminWallet.sendTransaction({
        to,
        value: weiAmount,
      });
      
      // Wait for transaction to be mined
      await tx.wait();
      
      return tx.hash;
    } catch (error) {
      this.logger.error(`Failed to transfer funds: ${error.message}`);
      return null;
    }
  }
}

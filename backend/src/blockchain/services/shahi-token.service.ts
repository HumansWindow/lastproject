import { Injectable, Logger, Inject, OnModuleInit } from '@nestjs/common';
import { ethers } from 'ethers';
import { ConfigService } from '@nestjs/config';
import { BlockchainConfig } from '../config/blockchain-environment';

@Injectable()
export class ShahiTokenService implements OnModuleInit {
  private readonly logger = new Logger(ShahiTokenService.name);
  private provider: ethers.providers.Provider;
  private contract: ethers.Contract;
  private adminWallet: ethers.Wallet;
  private _initialized = false;
  private tokenContract: ethers.Contract;

  constructor(
    @Inject('BLOCKCHAIN_CONFIG') private readonly blockchainConfig: BlockchainConfig,
    private configService: ConfigService
  ) {}

  async onModuleInit() {
    try {
      await this.initializeProvider();
      await this.initializeContract();
      await this.initializeAdminWallet();
      this._initialized = true;
    } catch (error) {
      this.logger.error('Failed to initialize ShahiTokenService', error);
      // Allow the service to exist but in a non-initialized state
      // This will make any operation that checks isInitialized() fail gracefully
    }
  }

  private async initializeProvider() {
    try {
      // Get RPC URL from blockchain config
      const rpcUrl = this.blockchainConfig.ETH_RPC_URL;
      
      // Try to initialize using HTTP provider which is more reliable than WebSocket
      if (rpcUrl) {
        // Convert WebSocket URL to HTTP if necessary
        const httpUrl = rpcUrl.replace(/^wss?:\/\//, 'https://');
        
        try {
          this.provider = new ethers.providers.JsonRpcProvider(httpUrl);
          this.logger.log(`Provider initialized with HTTP RPC URL: ${httpUrl}`);
        } catch (httpError) {
          // Fallback to WebSocket if HTTP fails
          this.logger.warn(`Failed to initialize HTTP provider: ${httpError.message}`);
          this.provider = new ethers.providers.WebSocketProvider(rpcUrl);
          this.logger.log(`Provider initialized with WebSocket RPC URL: ${rpcUrl}`);
        }
      } else {
        // Use fallback provider if no RPC URL is provided
        this.logger.warn('No ETH_RPC_URL provided, using fallback provider');
        this.provider = ethers.getDefaultProvider();
      }
      
      // Test the provider with a simple call
      await this.provider.getBlockNumber();
    } catch (error) {
      this.logger.error('Failed to initialize provider', error);
      throw new Error(`Failed to initialize blockchain provider: ${error.message}`);
    }
  }

  private async initializeContract() {
    try {
      // Get contract address from blockchain config
      const contractAddress = this.blockchainConfig.TOKEN_CONTRACT_ADDRESS;
      
      if (!contractAddress) {
        this.logger.error('Token contract address is not defined in config');
        throw new Error('Token contract address is missing in configuration');
      }
      
      this.logger.log(`Initializing token contract at address: ${contractAddress}`);
      
      // Use the ABI directly in code to avoid file loading issues
      const minimalAbi = [
        "function totalSupply() view returns (uint256)",
        "function balanceOf(address) view returns (uint256)",
        "function transfer(address to, uint amount) returns (bool)",
        "function mint(address to, uint256 amount) returns (bool)",
        "function burn(uint256 amount) returns (bool)",
        "function name() view returns (string)",
        "function symbol() view returns (string)",
        "function decimals() view returns (uint8)",
        "function approve(address spender, uint256 amount) returns (bool)",
        "function allowance(address owner, address spender) view returns (uint256)",
        "function transferFrom(address sender, address recipient, uint256 amount) returns (bool)",
        "event Transfer(address indexed from, address indexed to, uint256 value)",
        "event Approval(address indexed owner, address indexed spender, uint256 value)",
        "function userMintRecords(address) view returns (bool hasFirstMinted, uint256 lastMintTimestamp, uint256 totalMinted)",
        "function burnedTokens() view returns (uint256)",
        "function totalMintedTokens() view returns (uint256)",
        "function burnExpiredTokens(address) returns (bool)",
        "function mintForNewUser(address) returns (bool)",
        "function adminMint(address to, uint256 amount) returns (bool)",
        "function firstTimeMint(address to, string[] merkleProof, string deviceId) returns (bool)",
        "function annualMint(address to, string signature, string deviceId) returns (bool)"
      ];

      this.contract = new ethers.Contract(contractAddress, minimalAbi, this.provider);
      this.tokenContract = this.contract; // Alias for compatibility with existing code
    } catch (error) {
      this.logger.error('Failed to initialize contract');
      this.logger.error(error);
      throw new Error('Failed to initialize token contract');
    }
  }

  private async initializeAdminWallet() {
    try {
      // Use ADMIN_PRIVATE_KEY instead of ADMIN_WALLET_PRIVATE_KEY
      const privateKey = this.configService.get<string>('ADMIN_PRIVATE_KEY');
      if (!privateKey) {
        throw new Error('Admin wallet private key not configured');
      }
      
      // Ensure private key has the 0x prefix
      const formattedKey = privateKey.startsWith('0x') ? privateKey : `0x${privateKey}`;
      
      this.adminWallet = new ethers.Wallet(formattedKey, this.provider);
      this.logger.log(`Admin wallet initialized with address: ${this.adminWallet.address}`);
    } catch (error) {
      this.logger.error('Failed to initialize admin wallet');
      throw new Error('Admin wallet initialization failed');
    }
  }

  isInitialized(): boolean {
    return this._initialized;
  }

  private checkInitialization() {
    if (!this._initialized || !this.contract || !this.adminWallet) {
      throw new Error('ShahiTokenService not properly initialized');
    }
  }

  async generateMintSignature(address: string, deviceId: string): Promise<string> {
    this.checkInitialization();

    try {
      const messageHash = ethers.utils.solidityKeccak256(
        ['address', 'string'],
        [address, deviceId]
      );
      
      const messageBytes = ethers.utils.arrayify(messageHash);
      const signature = await this.adminWallet.signMessage(messageBytes);
      
      return signature;
    } catch (error) {
      this.logger.error(`Failed to generate mint signature for ${address}`, error);
      throw new Error(`Failed to generate mint signature: ${error.message}`);
    }
  }

  async firstTimeMint(userAddress: string, deviceId: string, merkleProof: string[]): Promise<string> {
    this.checkInitialization();

    try {
      const signer = this.contract.connect(this.adminWallet);
      const tx = await signer.firstTimeMint(userAddress, merkleProof, deviceId);
      const receipt = await tx.wait();
      
      this.logger.log(`First-time mint successful for ${userAddress}, tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`First-time mint failed for ${userAddress}`, error);
      throw new Error(`First-time mint failed: ${error.message}`);
    }
  }

  async annualMint(userAddress: string, deviceId: string): Promise<string> {
    this.checkInitialization();

    try {
      const signature = await this.generateMintSignature(userAddress, deviceId);
      const signer = this.contract.connect(this.adminWallet);
      const tx = await signer.annualMint(userAddress, signature, deviceId);
      const receipt = await tx.wait();
      
      this.logger.log(`Annual mint successful for ${userAddress}, tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Annual mint failed for ${userAddress}`, error);
      throw new Error(`Annual mint failed: ${error.message}`);
    }
  }

  async getMintingStatus(userAddress: string): Promise<{
    hasFirstMinted: boolean;
    lastMintTimestamp: number;
    totalMinted: string;
  }> {
    this.checkInitialization();

    try {
      const userRecord = await this.contract.userMintRecords(userAddress);
      
      return {
        hasFirstMinted: userRecord.hasFirstMinted,
        lastMintTimestamp: userRecord.lastMintTimestamp.toNumber(),
        totalMinted: this.formatEther(userRecord.totalMinted),
      };
    } catch (error) {
      this.logger.error(`Failed to get minting status for ${userAddress}`, error);
      throw new Error(`Failed to get minting status: ${error.message}`);
    }
  }
  
  async getTokenStats(): Promise<{
    totalSupply: string;
    totalBurned: string;
    totalMinted: string;
  }> {
    this.checkInitialization();

    try {
      const [totalSupply, burned, minted] = await Promise.all([
        this.contract.totalSupply(),
        this.contract.burnedTokens(),
        this.contract.totalMintedTokens(),
      ]);
      
      return {
        totalSupply: this.formatEther(totalSupply),
        totalBurned: this.formatEther(burned),
        totalMinted: this.formatEther(minted),
      };
    } catch (error) {
      this.logger.error('Failed to get token stats', error);
      throw new Error(`Failed to get token stats: ${error.message}`);
    }
  }

  async mintForNewUser(address: string): Promise<string | null> {
    if (!this.isInitialized() || !this.contract || !this.adminWallet) {
      this.logger.warn('Cannot mint SHAHI: service not properly initialized');
      return null;
    }

    try {
      this.logger.log(`Minting 1 SHAHI for new user ${address}`);
      
      // Try mintForNewUser first
      try {
        const signer = this.contract.connect(this.adminWallet);
        const tx = await signer.mintForNewUser(address);
        const receipt = await tx.wait();
        
        this.logger.log(`Successfully minted SHAHI for new user. Tx hash: ${receipt.transactionHash}`);
        return receipt.transactionHash;
      } catch (mintError) {
        this.logger.warn(`mintForNewUser failed, trying adminMint: ${mintError.message}`);
        
        // Fall back to adminMint if mintForNewUser fails
        const amountToMint = this.parseEther('1.0');
        const signer = this.contract.connect(this.adminWallet);
        const tx = await signer.adminMint(address, amountToMint);
        const receipt = await tx.wait();
        
        this.logger.log(`Successfully admin minted SHAHI for new user. Tx hash: ${receipt.transactionHash}`);
        return receipt.transactionHash;
      }
    } catch (error) {
      this.logger.error(`Failed to mint SHAHI for new user: ${error.message}`);
      return null;
    }
  }
  
  async burnExpiredTokens(address: string): Promise<string> {
    this.checkInitialization();

    try {
      const signer = this.contract.connect(this.adminWallet);
      const tx = await signer.burnExpiredTokens(address);
      const receipt = await tx.wait();
      
      this.logger.log(`Successfully burned expired tokens for ${address}. Tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to burn expired tokens: ${error.message}`);
      throw new Error(`Failed to burn expired tokens: ${error.message}`);
    }
  }
  
  async getTokenBalance(address: string): Promise<string> {
    try {
      const balance = await this.tokenContract.balanceOf(address);
      return this.formatEther(balance);
    } catch (error) {
      this.logger.error(`Failed to get balance for ${address}`, error);
      throw new Error(`Failed to get token balance for ${address}`);
    }
  }
  
  async transferTokens(toAddress: string, amount: string): Promise<string> {
    try {
      const amountWei = this.parseEther(amount);
      const signer = this.tokenContract.connect(this.adminWallet);
      
      const tx = await signer.transfer(toAddress, amountWei);
      const receipt = await tx.wait();
      
      this.logger.log(`Transferred ${amount} tokens to ${toAddress}, tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to transfer ${amount} tokens to ${toAddress}`, error);
      throw new Error(`Failed to transfer tokens: ${error.message}`);
    }
  }
  
  async getTotalSupply(): Promise<string> {
    try {
      const supply = await this.tokenContract.totalSupply();
      return this.formatEther(supply);
    } catch (error) {
      this.logger.error('Failed to get total supply', error);
      throw new Error('Failed to get total token supply');
    }
  }
  
  async mintTokens(toAddress: string, amount: string): Promise<string> {
    try {
      const amountWei = this.parseEther(amount);
      const signer = this.tokenContract.connect(this.adminWallet);
      
      const tx = await signer.mint(toAddress, amountWei);
      const receipt = await tx.wait();
      
      this.logger.log(`Minted ${amount} tokens to ${toAddress}, tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to mint ${amount} tokens to ${toAddress}`, error);
      throw new Error(`Failed to mint tokens: ${error.message}`);
    }
  }
  
  async burnTokens(amount: string): Promise<string> {
    try {
      const amountWei = this.parseEther(amount);
      const signer = this.tokenContract.connect(this.adminWallet);
      
      const tx = await signer.burn(amountWei);
      const receipt = await tx.wait();
      
      this.logger.log(`Burned ${amount} tokens, tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to burn ${amount} tokens`, error);
      throw new Error(`Failed to burn tokens: ${error.message}`);
    }
  }
  
  async getTokenInfo(): Promise<{
    name: string;
    symbol: string;
    decimals: number;
    totalSupply: string;
  }> {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals(),
        this.tokenContract.totalSupply()
      ]);
      
      return {
        name,
        symbol,
        decimals: decimals.toNumber(),
        totalSupply: this.formatEther(totalSupply)
      };
    } catch (error) {
      this.logger.error('Failed to get token info', error);
      throw new Error('Failed to get token information');
    }
  }
  
  async approveSpender(spender: string, amount: string): Promise<string> {
    try {
      const amountWei = this.parseEther(amount);
      const signer = this.tokenContract.connect(this.adminWallet);
      
      const tx = await signer.approve(spender, amountWei);
      const receipt = await tx.wait();
      
      this.logger.log(`Approved ${amount} tokens for ${spender}, tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to approve ${amount} tokens for ${spender}`, error);
      throw new Error(`Failed to approve tokens: ${error.message}`);
    }
  }
  
  async getAllowance(owner: string, spender: string): Promise<string> {
    try {
      const allowance = await this.tokenContract.allowance(owner, spender);
      return this.formatEther(allowance);
    } catch (error) {
      this.logger.error(`Failed to get allowance for ${owner} -> ${spender}`, error);
      throw new Error(`Failed to get token allowance`);
    }
  }
  
  async transferFrom(from: string, to: string, amount: string): Promise<string> {
    try {
      const amountWei = this.parseEther(amount);
      const signer = this.tokenContract.connect(this.adminWallet);
      
      const tx = await signer.transferFrom(from, to, amountWei);
      const receipt = await tx.wait();
      
      this.logger.log(`Transferred ${amount} tokens from ${from} to ${to}, tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to transfer ${amount} tokens from ${from} to ${to}`, error);
      throw new Error(`Failed to transfer tokens: ${error.message}`);
    }
  }
  
  async getTransactionReceipt(txHash: string): Promise<any> {
    try {
      const receipt = await this.provider.getTransactionReceipt(txHash);
      return {
        status: receipt.status === 1 ? 'success' : 'failed',
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        transactionHash: receipt.transactionHash,
        from: receipt.from,
        to: receipt.to
      };
    } catch (error) {
      this.logger.error(`Failed to get receipt for tx ${txHash}`, error);
      throw new Error(`Failed to get transaction receipt: ${error.message}`);
    }
  }
  
  async getGasPrice(): Promise<string> {
    try {
      const gasPrice = await this.provider.getGasPrice();
      return this.formatEther(gasPrice);
    } catch (error) {
      this.logger.error('Failed to get gas price', error);
      throw new Error('Failed to get current gas price');
    }
  }
  
  async estimateTransferGas(to: string, amount: string): Promise<number> {
    try {
      const amountWei = this.parseEther(amount);
      const signer = this.tokenContract.connect(this.adminWallet);
      
      const gasEstimate = await signer.estimateGas.transfer(to, amountWei);
      return gasEstimate.toNumber();
    } catch (error) {
      this.logger.error(`Failed to estimate gas for transfer to ${to}`, error);
      throw new Error('Failed to estimate transaction gas');
    }
  }

  async getPastTransfers(fromBlock: number, toBlock: number | 'latest' = 'latest'): Promise<any[]> {
    try {
      const fromAddress = this.adminWallet.address;
      const transferEvents = await this.tokenContract.queryFilter(
        this.tokenContract.filters.Transfer(fromAddress, null),
        fromBlock,
        toBlock
      );
      
      return transferEvents.map(event => {
        return {
          from: event.args.from,
          to: event.args.to,
          value: this.formatEther(event.args.value),
          blockNumber: event.blockNumber,
          transactionHash: event.transactionHash
        };
      });
    } catch (error) {
      this.logger.error('Failed to get past transfers', error);
      throw new Error('Failed to retrieve transfer history');
    }
  }

  // Helper methods for ethers formatting/parsing
  private formatEther(value: ethers.BigNumberish): string {
    return ethers.utils.formatEther(value);
  }

  private parseEther(value: string): ethers.BigNumber {
    return ethers.utils.parseEther(value);
  }
}

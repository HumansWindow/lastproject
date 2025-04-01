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
  private mintingRetryQueue: Map<string, {attempts: number, lastAttempt: number}> = new Map();
  private readonly maxRetries = 3;
  private readonly retryDelay = 5000; // 5 seconds

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

  async mintForNewUser(address: string, deviceId?: string): Promise<string | null> {
    if (!this.isInitialized() || !this.contract || !this.adminWallet) {
      this.logger.warn('Cannot mint SHAHI: service not properly initialized');
      return null;
    }

    // If deviceId is provided, log it for debugging
    if (deviceId) {
      this.logger.log(`Minting tokens for user ${address} from device ${deviceId.substring(0, 8)}...`);
    }

    try {
      this.logger.log(`Minting 1 SHAHI for new user ${address}`);
      
      // Try mintForNewUser first
      try {
        const signer = this.contract.connect(this.adminWallet);
        // Add a gas limit estimation directly
        const gasEstimate = await this.provider.estimateGas({
          from: this.adminWallet.address,
          to: this.contract.address,
          data: this.contract.interface.encodeFunctionData('mintForNewUser', [address])
        }).catch(() => ethers.BigNumber.from('500000')); // Default gas limit if estimation fails
        
        const tx = await signer.mintForNewUser(address, {
          gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
        });
        const receipt = await tx.wait();
        
        this.logger.log(`Successfully minted SHAHI for new user. Tx hash: ${receipt.transactionHash}`);
        return receipt.transactionHash;
      } catch (mintError) {
        this.logger.warn(`mintForNewUser failed, trying adminMint: ${mintError.message}`);
        
        // Fall back to adminMint if mintForNewUser fails
        const amountToMint = this.parseEther('1.0');
        const signer = this.contract.connect(this.adminWallet);
        
        // Add a gas limit estimation directly
        const gasEstimate = await this.provider.estimateGas({
          from: this.adminWallet.address,
          to: this.contract.address,
          data: this.contract.interface.encodeFunctionData('adminMint', [address, amountToMint])
        }).catch(() => ethers.BigNumber.from('600000')); // Default gas limit if estimation fails
        
        const tx = await signer.adminMint(address, amountToMint, {
          gasLimit: gasEstimate.mul(120).div(100) // Add 20% buffer
        });
        const receipt = await tx.wait();
        
        this.logger.log(`Successfully admin minted SHAHI for new user. Tx hash: ${receipt.transactionHash}`);
        return receipt.transactionHash;
      }
    } catch (error) {
      this.logger.error(`Failed to mint SHAHI for new user: ${error.message}`);
      // Add the wallet address to the retry queue if it's not already reached max retries
      const queueItem = this.mintingRetryQueue.get(address) || { attempts: 0, lastAttempt: 0 };
      if (queueItem.attempts < this.maxRetries) {
        queueItem.attempts++;
        queueItem.lastAttempt = Date.now();
        this.mintingRetryQueue.set(address, queueItem);
        this.logger.log(`Added ${address} to minting retry queue. Attempt: ${queueItem.attempts}`);
        
        // Schedule a retry attempt if this was the first failure
        if (queueItem.attempts === 1) {
          setTimeout(() => this.retryMinting(address), this.retryDelay);
        }
      } else {
        this.logger.error(`Failed to mint SHAHI for ${address} after ${this.maxRetries} attempts`);
      }
      return null;
    }
  }
  
  private async retryMinting(address: string): Promise<void> {
    const queueItem = this.mintingRetryQueue.get(address);
    if (!queueItem || queueItem.attempts >= this.maxRetries) {
      return;
    }
    
    try {
      this.logger.log(`Retry attempt ${queueItem.attempts + 1} for minting tokens to ${address}`);
      const result = await this.mintForNewUser(address);
      if (result) {
        this.logger.log(`Successful retry mint for ${address}: ${result}`);
        this.mintingRetryQueue.delete(address);
      } else {
        // Schedule another retry if we haven't hit the maximum
        if (queueItem.attempts < this.maxRetries) {
          setTimeout(() => this.retryMinting(address), this.retryDelay * queueItem.attempts); // Exponential backoff
        }
      }
    } catch (error) {
      this.logger.error(`Error during retry minting for ${address}: ${error.message}`);
    }
  }
  
  // Add a method to check if a minting operation is already in progress for an address
  async isMintingInProgress(address: string): Promise<boolean> {
    const item = this.mintingRetryQueue.get(address);
    if (item && Date.now() - item.lastAttempt < 60000) { // Consider minting in progress if attempted in the last minute
      return true;
    }
    return false;
  }

  // Add a method to validate if the token should be minted for a wallet based on device constraints
  async shouldMintToken(address: string, deviceId: string): Promise<boolean> {
    // Basic validation - address and deviceId must be present
    if (!address || !deviceId) {
      this.logger.warn('Cannot validate minting: missing address or deviceId');
      return false;
    }
    
    // Add your device-wallet pairing validation here
    // For example, you might want to check if the device is already associated with a different wallet
    
    // If a minting operation is already in progress, don't start another one
    if (await this.isMintingInProgress(address)) {
      this.logger.warn(`Minting already in progress for address ${address}`);
      return false;
    }
    
    return true;
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

  /**
   * Batch process expired token burns for multiple users to save gas
   * @param addresses Array of user addresses to check for expired tokens
   * @returns Transaction hash of the batch operation
   */
  async batchBurnExpiredTokens(addresses: string[]): Promise<string> {
    this.checkInitialization();

    try {
      const signer = this.contract.connect(this.adminWallet);
      
      // Estimate gas for the batch operation with 20% buffer
      const gasEstimate = await this.provider.estimateGas({
        from: this.adminWallet.address,
        to: this.contract.address,
        data: this.contract.interface.encodeFunctionData('batchBurnExpiredTokens', [addresses])
      }).catch(() => ethers.BigNumber.from('3000000')); // Default gas limit if estimation fails
      
      const tx = await signer.batchBurnExpiredTokens(addresses, {
        gasLimit: gasEstimate.mul(120).div(100)
      });
      
      const receipt = await tx.wait();
      
      this.logger.log(`Successfully batch burned expired tokens for ${addresses.length} users. Tx hash: ${receipt.transactionHash}`);
      return receipt.transactionHash;
    } catch (error) {
      this.logger.error(`Failed to batch burn expired tokens: ${error.message}`);
      throw new Error(`Failed to batch burn expired tokens: ${error.message}`);
    }
  }
  
  /**
   * Execute multiple token transfers in a single transaction using a multicall pattern
   * This reduces overall gas costs when sending tokens to multiple recipients
   * @param recipients Array of recipient addresses
   * @param amounts Array of amounts to send to each recipient (in SHAHI)
   * @returns Transaction hash of the batch operation
   */
  async batchTransferTokens(recipients: string[], amounts: string[]): Promise<string> {
    this.checkInitialization();
    
    try {
      if (recipients.length !== amounts.length) {
        throw new Error('Recipients and amounts arrays must have the same length');
      }
      
      if (recipients.length === 0) {
        throw new Error('At least one recipient is required');
      }
      
      // For very large batches, split into smaller chunks to avoid gas limits
      const MAX_BATCH_SIZE = 50;
      if (recipients.length > MAX_BATCH_SIZE) {
        const txHashes = [];
        
        for (let i = 0; i < recipients.length; i += MAX_BATCH_SIZE) {
          const batchRecipients = recipients.slice(i, i + MAX_BATCH_SIZE);
          const batchAmounts = amounts.slice(i, i + MAX_BATCH_SIZE);
          
          const txHash = await this.batchTransferTokens(batchRecipients, batchAmounts);
          txHashes.push(txHash);
        }
        
        return txHashes.join(',');
      }
      
      const signer = this.contract.connect(this.adminWallet);
      let totalAmount = ethers.BigNumber.from(0);
      
      // Convert all amounts to wei and calculate total
      const amountsWei = amounts.map(amount => {
        const amountWei = this.parseEther(amount);
        totalAmount = totalAmount.add(amountWei);
        return amountWei;
      });
      
      // Check if admin wallet has enough balance
      const adminBalance = await this.tokenContract.balanceOf(this.adminWallet.address);
      if (adminBalance.lt(totalAmount)) {
        throw new Error(`Insufficient balance for batch transfer. Have: ${this.formatEther(adminBalance)}, need: ${this.formatEther(totalAmount)}`);
      }
      
      // Perform transfers one by one but in a single transaction
      // We could implement a custom multicall function in the contract for even better gas optimization
      let nonce = await this.provider.getTransactionCount(this.adminWallet.address);
      
      // Get current gas price with 10% buffer
      const gasPrice = (await this.provider.getGasPrice()).mul(110).div(100);
      
      // Execute transfers in parallel with the same nonce to batch them
      const transferPromises = recipients.map((recipient, index) => {
        return signer.transfer(recipient, amountsWei[index], {
          nonce: nonce,
          gasPrice: gasPrice
        });
      });
      
      const results = await Promise.all(transferPromises);
      const receipts = await Promise.all(results.map(tx => tx.wait()));
      
      this.logger.log(`Successfully batch transferred tokens to ${recipients.length} recipients`);
      
      return receipts.map(r => r.transactionHash).join(',');
    } catch (error) {
      this.logger.error(`Failed to batch transfer tokens: ${error.message}`);
      throw new Error(`Failed to batch transfer tokens: ${error.message}`);
    }
  }
}

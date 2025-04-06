import { Injectable, Logger, Inject } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Contract, ethers } from 'ethers';
// Fix the ABI import issue
// Replace the import with a direct ABI definition
const SHAHI_ABI = [
  // Basic ERC20 functions
  {
    "constant": true,
    "inputs": [],
    "name": "name",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "symbol",
    "outputs": [{"name": "", "type": "string"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "decimals",
    "outputs": [{"name": "", "type": "uint8"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "totalSupply",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "owner", "type": "address"}],
    "name": "balanceOf",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // First-time minting
  {
    "constant": false,
    "inputs": [
      {"name": "user", "type": "address"}, 
      {"name": "proof", "type": "bytes32[]"}, 
      {"name": "deviceId", "type": "string"}
    ],
    "name": "firstTimeMint",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Annual minting
  {
    "constant": false,
    "inputs": [
      {"name": "user", "type": "address"}, 
      {"name": "signature", "type": "bytes"}, 
      {"name": "deviceId", "type": "string"}
    ],
    "name": "annualMint",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Admin minting
  {
    "constant": false,
    "inputs": [
      {"name": "to", "type": "address"}, 
      {"name": "amount", "type": "uint256"}
    ],
    "name": "adminMint",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Burn expired tokens
  {
    "constant": false,
    "inputs": [{"name": "user", "type": "address"}],
    "name": "burnExpiredTokens",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Batch minting functions
  {
    "constant": false,
    "inputs": [
      {"name": "users", "type": "address[]"},
      {"name": "deviceIds", "type": "string[]"},
      {"name": "proofs", "type": "bytes32[][]"}
    ],
    "name": "batchMintFirstTimeTokens",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  {
    "constant": false,
    "inputs": [
      {"name": "users", "type": "address[]"},
      {"name": "deviceIds", "type": "string[]"},
      {"name": "signatures", "type": "bytes[]"}
    ],
    "name": "batchMintAnnualTokens",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Direct minting
  {
    "constant": false,
    "inputs": [
      {"name": "user", "type": "address"}
    ],
    "name": "mintForNewUser",
    "outputs": [],
    "payable": false,
    "stateMutability": "nonpayable",
    "type": "function"
  },
  // Eligibility checks
  {
    "constant": true,
    "inputs": [{"name": "user", "type": "address"}],
    "name": "isEligibleForFirstTimeMinting",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [{"name": "user", "type": "address"}],
    "name": "isEligibleForAnnualMinting",
    "outputs": [{"name": "", "type": "bool"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Token statistics
  {
    "constant": true,
    "inputs": [],
    "name": "totalMintedTokens",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  {
    "constant": true,
    "inputs": [],
    "name": "burnedTokens",
    "outputs": [{"name": "", "type": "uint256"}],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // User minting records
  {
    "constant": true,
    "inputs": [{"name": "user", "type": "address"}],
    "name": "userMintRecords",
    "outputs": [
      {"name": "hasFirstMinted", "type": "bool"},
      {"name": "lastMintTimestamp", "type": "uint256"},
      {"name": "totalMinted", "type": "uint256"}
    ],
    "payable": false,
    "stateMutability": "view",
    "type": "function"
  },
  // Events
  {
    "anonymous": false,
    "inputs": [
      {"indexed": true, "name": "user", "type": "address"},
      {"indexed": false, "name": "amount", "type": "uint256"}
    ],
    "name": "TokensExpiredAndBurned",
    "type": "event"
  }
];

@Injectable()
export class ShahiTokenService {
  private readonly logger = new Logger(ShahiTokenService.name);
  private provider: ethers.providers.JsonRpcProvider;
  private signer: ethers.Wallet;
  private tokenContract: Contract;
  private initialized = false;

  constructor(
    private configService: ConfigService,
    @Inject('BLOCKCHAIN_CONFIG') private blockchainConfig: any
  ) {
    this.initializeConnection();
  }

  private initializeConnection() {
    try {
      // Get configuration from environment
      const rpcUrl = this.blockchainConfig.ETH_RPC_URL || 'http://localhost:8545';
      const contractAddress = this.blockchainConfig.TOKEN_CONTRACT_ADDRESS;
      const adminPrivateKey = this.blockchainConfig.ADMIN_PRIVATE_KEY;

      if (!contractAddress || !adminPrivateKey) {
        this.logger.error('Missing TOKEN_CONTRACT_ADDRESS or ADMIN_PRIVATE_KEY in configuration');
        throw new Error('Missing required blockchain configuration');
      }

      // Connect to blockchain network
      this.provider = new ethers.providers.JsonRpcProvider(rpcUrl);
      
      // Create signer wallet from private key
      this.signer = new ethers.Wallet(adminPrivateKey, this.provider);
      
      // Connect to SHAHI token contract - fix ABI reference
      this.tokenContract = new Contract(
        contractAddress,
        SHAHI_ABI,
        this.signer
      );

      this.initialized = true;
      this.logger.log('Successfully initialized token contract connection');
    } catch (error) {
      this.logger.error(`Error initializing token contract: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Check if the service is initialized correctly
   * @returns True if the service is initialized
   */
  get isInitialized(): boolean {
    return this.initialized;
  }

  /**
   * Determines if a user should be minted a token based on eligibility
   * @param walletAddress User wallet address
   * @param isFirstTime Whether this is first-time minting or annual minting
   * @returns True if the user should be minted a token
   */
  async shouldMintToken(walletAddress: string, isFirstTime: boolean): Promise<boolean> {
    try {
      if (isFirstTime) {
        return await this.isEligibleForFirstTimeMinting(walletAddress);
      } else {
        return await this.isEligibleForAnnualMinting(walletAddress);
      }
    } catch (error) {
      this.logger.error(`Error checking minting eligibility: ${error.message}`);
      return false;
    }
  }

  /**
   * Generate signature for annual minting
   * @param walletAddress User's wallet address for minting
   * @param deviceId Device identifier for security binding
   * @returns Signature that can be used for minting
   */
  async generateMintingSignature(walletAddress: string, deviceId: string): Promise<string> {
    try {
      const timestamp = Math.floor(Date.now() / 1000); // Current time in seconds
      const messageHash = ethers.utils.solidityKeccak256(
        ['address', 'string', 'uint256'],
        [walletAddress, deviceId, timestamp]
      );
      
      const messageHashBinary = ethers.utils.arrayify(messageHash);
      const signature = await this.signer.signMessage(messageHashBinary);
      
      this.logger.log(`Generated minting signature for wallet ${walletAddress.substring(0, 8)}...`);
      return signature;
    } catch (error) {
      this.logger.error(`Error generating minting signature: ${error.message}`);
      throw new Error('Failed to generate minting signature');
    }
  }

  /**
   * Get user's minting status
   * @param walletAddress User wallet address
   * @returns Object with minting status details
   */
  async getMintingStatus(walletAddress: string): Promise<{
    hasFirstMinted: boolean;
    lastMintTimestamp: number;
    totalMinted: string;
  }> {
    try {
      this.logger.log(`Retrieving minting status for ${walletAddress.substring(0, 8)}...`);
      
      const result = await this.tokenContract.userMintRecords(walletAddress);
      
      return {
        hasFirstMinted: result.hasFirstMinted,
        lastMintTimestamp: result.lastMintTimestamp.toNumber(),
        totalMinted: ethers.utils.formatEther(result.totalMinted),
      };
    } catch (error) {
      this.logger.error(`Failed to get minting status: ${error.message}`);
      throw new Error(`Failed to get minting status: ${error.message}`);
    }
  }

  /**
   * Perform first-time minting with Merkle proof
   * @param walletAddress User wallet address
   * @param deviceId Device identifier for security
   * @param merkleProof Merkle proof of eligibility
   * @returns Transaction hash
   */
  async firstTimeMint(walletAddress: string, deviceId: string, merkleProof: string[]): Promise<string> {
    try {
      this.logger.log(`Attempting first-time minting for ${walletAddress.substring(0, 8)}...`);
      
      // Convert Merkle proof format if needed
      const proof = Array.isArray(merkleProof) ? merkleProof : JSON.parse(merkleProof);
      
      // Call contract's first-time minting function
      const tx = await this.tokenContract.firstTimeMint(walletAddress, deviceId, proof);
      await tx.wait();
      
      this.logger.log(`First-time minting transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`First-time minting failed: ${error.message}`);
      throw new Error(`First-time minting failed: ${error.message}`);
    }
  }

  /**
   * Perform annual minting with signature verification
   * @param walletAddress User wallet address
   * @param deviceId Device identifier for security
   * @param signature Valid signature for minting
   * @returns Transaction hash
   */
  async annualMint(walletAddress: string, deviceId: string, signature: string): Promise<string> {
    try {
      this.logger.log(`Attempting annual minting for ${walletAddress.substring(0, 8)}...`);
      
      // Call contract's annual minting function
      const tx = await this.tokenContract.annualMint(walletAddress, deviceId, signature);
      await tx.wait();
      
      this.logger.log(`Annual minting transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Annual minting failed: ${error.message}`);
      throw new Error(`Annual minting failed: ${error.message}`);
    }
  }

  /**
   * Perform admin minting to any address (requires admin privileges)
   * @param walletAddress Recipient wallet address
   * @param amount Amount to mint in wei format
   * @returns Transaction hash
   */
  async adminMint(walletAddress: string, amount: string): Promise<string> {
    try {
      this.logger.log(`Admin minting ${amount} tokens to ${walletAddress.substring(0, 8)}...`);
      
      // Call contract's admin minting function
      const tx = await this.tokenContract.adminMint(walletAddress, amount);
      await tx.wait();
      
      this.logger.log(`Admin minting transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Admin minting failed: ${error.message}`);
      throw new Error(`Admin minting failed: ${error.message}`);
    }
  }

  /**
   * Check if wallet is eligible for first-time minting
   * @param walletAddress Wallet address to check
   * @returns True if eligible for first-time minting
   */
  async isEligibleForFirstTimeMinting(walletAddress: string): Promise<boolean> {
    try {
      return await this.tokenContract.isEligibleForFirstTimeMinting(walletAddress);
    } catch (error) {
      this.logger.error(`Error checking first-time minting eligibility: ${error.message}`);
      throw new Error('Failed to check first-time minting eligibility');
    }
  }

  /**
   * Check if wallet is eligible for annual minting
   * @param walletAddress Wallet address to check
   * @returns True if eligible for annual minting
   */
  async isEligibleForAnnualMinting(walletAddress: string): Promise<boolean> {
    try {
      return await this.tokenContract.isEligibleForAnnualMinting(walletAddress);
    } catch (error) {
      this.logger.error(`Error checking annual minting eligibility: ${error.message}`);
      throw new Error('Failed to check annual minting eligibility');
    }
  }

  /**
   * Get token balance for a wallet
   * @param walletAddress Wallet address
   * @returns Token balance in wei format
   */
  async getTokenBalance(walletAddress: string): Promise<string> {
    try {
      const balance = await this.tokenContract.balanceOf(walletAddress);
      return balance.toString();
    } catch (error) {
      this.logger.error(`Error getting token balance: ${error.message}`);
      throw new Error('Failed to get token balance');
    }
  }

  /**
   * Burns expired tokens for a specific wallet address
   * @param walletAddress The address to check for expired tokens
   * @returns Object containing transaction hash and amount burned
   */
  async burnExpiredTokens(walletAddress: string): Promise<{ transactionHash: string; amountBurned?: string }> {
    try {
      this.logger.log(`Burning expired tokens for wallet: ${walletAddress.substring(0, 8)}...`);
      
      // Call contract's burnExpiredTokens function (assuming it exists in the contract)
      const tx = await this.tokenContract.burnExpiredTokens(walletAddress);
      const receipt = await tx.wait();
      
      // Try to extract burned amount from events
      let amountBurned: string | undefined;
      try {
        // Look for TokensExpiredAndBurned event in the receipt
        const event = receipt.events?.find(e => e.event === 'TokensExpiredAndBurned');
        if (event && event.args) {
          amountBurned = event.args.amount.toString();
        }
      } catch (eventError) {
        this.logger.warn(`Could not extract burned amount from event: ${eventError.message}`);
      }
      
      this.logger.log(`Burned expired tokens for ${walletAddress.substring(0, 8)}, tx: ${tx.hash}`);
      return { 
        transactionHash: tx.hash,
        amountBurned
      };
    } catch (error) {
      this.logger.error(`Failed to burn expired tokens: ${error.message}`);
      throw new Error(`Failed to burn expired tokens: ${error.message}`);
    }
  }

  /**
   * Burns expired tokens for multiple wallet addresses in batches
   * @param walletAddresses Array of wallet addresses to process
   * @param batchSize Optional batch size (default: 50)
   * @returns Array of transaction results
   */
  async batchBurnExpiredTokens(walletAddresses: string[], batchSize = 50): Promise<{ successful: number; failed: number; transactions: Array<{ address: string; result: string | Error }> }> {
    this.logger.log(`Starting batch burn of expired tokens for ${walletAddresses.length} wallets`);
    
    const results: Array<{ address: string; result: string | Error }> = [];
    let successful = 0;
    let failed = 0;
    
    // Process in batches to avoid gas issues
    for (let i = 0; i < walletAddresses.length; i += batchSize) {
      const batch = walletAddresses.slice(i, i + batchSize);
      this.logger.log(`Processing batch ${Math.floor(i/batchSize) + 1} with ${batch.length} wallets`);
      
      // Process each wallet in the current batch
      const batchPromises = batch.map(async (address) => {
        try {
          const result = await this.burnExpiredTokens(address);
          successful++;
          return { address, result: result.transactionHash };
        } catch (error) {
          failed++;
          this.logger.warn(`Failed to burn expired tokens for ${address}: ${error.message}`);
          return { address, result: error as Error };
        }
      });
      
      // Wait for all transactions in this batch to complete
      const batchResults = await Promise.all(batchPromises);
      results.push(...batchResults);
      
      // Add a small delay between batches to avoid rate limiting
      if (i + batchSize < walletAddresses.length) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
    
    this.logger.log(`Batch burn completed: ${successful} successful, ${failed} failed`);
    return { successful, failed, transactions: results };
  }

  /**
   * Get basic token information
   * @returns Basic information about the token
   */
  async getTokenInfo(): Promise<any> {
    try {
      const [name, symbol, decimals, totalSupply] = await Promise.all([
        this.tokenContract.name(),
        this.tokenContract.symbol(),
        this.tokenContract.decimals(),
        this.tokenContract.totalSupply(),
      ]);
      
      return { name, symbol, decimals: decimals.toString(), totalSupply: totalSupply.toString() };
    } catch (error) {
      this.logger.error(`Error fetching token info: ${error.message}`);
      throw new Error('Failed to get token info');
    }
  }

  /**
   * Get token statistics
   * @returns Statistics about the token including total minted, burned, etc.
   */
  async getTokenStats(): Promise<any> {
    try {
      const [totalSupply, totalMintedTokens, burnedTokens] = await Promise.all([
        this.tokenContract.totalSupply(),
        this.tokenContract.totalMintedTokens ? this.tokenContract.totalMintedTokens() : 0,
        this.tokenContract.burnedTokens ? this.tokenContract.burnedTokens() : 0
      ]);
      
      return {
        totalSupply: totalSupply.toString(),
        totalMinted: totalMintedTokens.toString(),
        totalBurned: burnedTokens.toString()
      };
    } catch (error) {
      this.logger.error(`Error fetching token stats: ${error.message}`);
      throw new Error('Failed to get token stats');
    }
  }

  /**
   * Batch mint first-time tokens for multiple users
   * @param walletAddresses Array of wallet addresses
   * @param deviceIds Array of device IDs matching the walletAddresses
   * @param proofs Array of merkle proofs for each user
   * @returns Transaction hash
   */
  async batchMintFirstTimeTokens(
    walletAddresses: string[],
    deviceIds: string[],
    proofs: string[][]
  ): Promise<string> {
    try {
      if (!walletAddresses.length || walletAddresses.length !== deviceIds.length || walletAddresses.length !== proofs.length) {
        throw new Error('Invalid input arrays: must be non-empty and of equal length');
      }

      this.logger.log(`Batch minting first-time tokens for ${walletAddresses.length} addresses`);
      
      // Call the contract's batch minting function
      const tx = await this.tokenContract.batchMintFirstTimeTokens(walletAddresses, deviceIds, proofs);
      await tx.wait();
      
      this.logger.log(`Batch first-time minting transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Batch first-time minting failed: ${error.message}`);
      throw new Error(`Batch first-time minting failed: ${error.message}`);
    }
  }

  /**
   * Batch mint annual tokens for multiple users
   * @param walletAddresses Array of wallet addresses
   * @param deviceIds Array of device IDs matching the walletAddresses
   * @param signatures Array of signatures for each user
   * @returns Transaction hash
   */
  async batchMintAnnualTokens(
    walletAddresses: string[],
    deviceIds: string[],
    signatures: string[]
  ): Promise<string> {
    try {
      if (!walletAddresses.length || walletAddresses.length !== deviceIds.length || walletAddresses.length !== signatures.length) {
        throw new Error('Invalid input arrays: must be non-empty and of equal length');
      }

      this.logger.log(`Batch minting annual tokens for ${walletAddresses.length} addresses`);
      
      // Call the contract's batch minting function
      const tx = await this.tokenContract.batchMintAnnualTokens(walletAddresses, deviceIds, signatures);
      await tx.wait();
      
      this.logger.log(`Batch annual minting transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Batch annual minting failed: ${error.message}`);
      throw new Error(`Batch annual minting failed: ${error.message}`);
    }
  }

  /**
   * Direct minting for new user
   * @param walletAddress User wallet address
   * @returns Transaction hash
   */
  async mintForNewUser(walletAddress: string): Promise<string> {
    try {
      this.logger.log(`Direct minting for new user: ${walletAddress.substring(0, 8)}...`);
      
      const tx = await this.tokenContract.mintForNewUser(walletAddress);
      await tx.wait();
      
      this.logger.log(`Direct minting transaction confirmed: ${tx.hash}`);
      return tx.hash;
    } catch (error) {
      this.logger.error(`Direct minting failed: ${error.message}`);
      throw new Error(`Direct minting failed: ${error.message}`);
    }
  }
}

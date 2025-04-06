import { ethers } from 'ethers';

export interface TransactionServiceConfig {
  defaultGasLimit?: Record<string, string>;
  // Add other config options as needed
}

export interface GasSettings {
  gasLimit?: string | number;
  gasPrice?: string | number | ethers.BigNumber;
  maxFeePerGas?: string | number | ethers.BigNumber;
  maxPriorityFeePerGas?: string | number | ethers.BigNumber;
  type?: number;
}

export interface TransactionRequest {
  to: string;
  value: ethers.BigNumber;
  gasLimit?: string | ethers.BigNumber;
  gasPrice?: string | number | ethers.BigNumber;
  maxFeePerGas?: string | number | ethers.BigNumber;
  maxPriorityFeePerGas?: string | number | ethers.BigNumber;
  type?: number;
  data?: string;
  nonce?: number;
}

export interface TransactionOptions {
  from: string;
  to: string;
  amount: string;
  network: string;
  gasSettings?: GasSettings;
  data?: string;
}

export interface TokenTransferOptions {
  from: string;
  to: string;
  amount: string;
  tokenSymbol: string;
  gasSettings?: GasSettings;
}

/**
 * Service for creating and broadcasting transactions on different blockchain networks
 */
export class TransactionService {
  private handlers: any;
  private config: TransactionServiceConfig;
  private tokenABI: string[];

  /**
   * Create a new TransactionService instance
   * @param {Object} handlers - Chain handlers for different networks
   * @param {Object} config - Configuration options
   */
  constructor(handlers: any, config: TransactionServiceConfig = {}) {
    this.handlers = handlers;
    this.config = config;

    // ERC20/BEP20 Token ABI for transfer function
    this.tokenABI = [
      'function transfer(address to, uint amount) returns (bool)',
      'function balanceOf(address owner) view returns (uint256)',
      'function decimals() view returns (uint8)',
      'function symbol() view returns (string)',
    ];

    console.log('TransactionService initialized');
  }

  /**
   * Send native currency transaction
   * @param {TransactionOptions} options - Transaction options
   * @returns {Promise<Object>} - Transaction receipt
   */
  async sendTransaction({ from, to, amount, network, gasSettings = {} }: TransactionOptions): Promise<any> {
    try {
      network = network.toUpperCase();

      // Get provider based on network
      const provider =
        network === 'MATIC'
          ? this.handlers.providers.MATIC
          : network === 'BNB'
          ? this.handlers.providers.BNB
          : this.handlers.providers.ETH;

      // Create wallet from private key
      const wallet = new ethers.Wallet(from, provider);

      // Prepare transaction
      const tx: TransactionRequest = {
        to,
        value: ethers.utils.parseEther(amount),
      };

      // Add gas settings if provided
      if (gasSettings.gasLimit) {
        tx.gasLimit = ethers.utils.hexlify(
          ethers.BigNumber.from(
            gasSettings.gasLimit || this.config.defaultGasLimit?.[network] || '21000',
          ),
        );
      }

      // For EIP-1559 compatible networks
      if (network === 'ETH' || network === 'MATIC') {
        const feeData = await provider.getFeeData();

        tx.maxFeePerGas = gasSettings.maxFeePerGas || feeData.maxFeePerGas;
        tx.maxPriorityFeePerGas = gasSettings.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas;
        tx.type = 2; // EIP-1559 transaction
      } else {
        // Legacy transaction
        tx.gasPrice = gasSettings.gasPrice || (await provider.getGasPrice());
      }

      // Send transaction
      const transaction = await wallet.sendTransaction(tx);

      // Wait for transaction to be mined
      const receipt = await transaction.wait();

      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        from: receipt.from,
        to: receipt.to,
      };
    } catch (error) {
      console.error(`Error sending ${network} transaction:`, error);
      throw error;
    }
  }

  /**
   * Transfer tokens
   * @param {TokenTransferOptions} options - Token transfer options
   * @returns {Promise<Object>} - Transaction receipt
   */
  async transferToken({ from, to, amount, tokenSymbol, gasSettings = {} }: TokenTransferOptions): Promise<any> {
    try {
      // Get token configuration
      const tokenConfig = this.handlers.handlers[tokenSymbol];

      if (!tokenConfig) {
        throw new Error(`Unsupported token: ${tokenSymbol}`);
      }

      // Determine network from token type
      const network = tokenConfig.network;

      // Get provider based on network
      const provider =
        network === 'MATIC'
          ? this.handlers.providers.MATIC
          : network === 'BNB'
          ? this.handlers.providers.BNB
          : this.handlers.providers.ETH;

      // Create wallet from private key
      const wallet = new ethers.Wallet(from, provider);

      // Create contract instance
      const contract = new ethers.Contract(
        tokenConfig.address,
        tokenConfig.customABI || this.tokenABI,
        wallet,
      );

      // Parse amount based on token decimals
      const parsedAmount = ethers.utils.parseUnits(amount, tokenConfig.decimals);

      // Prepare transaction options
      const overrides: any = {};

      // Add gas settings if provided
      if (gasSettings.gasLimit) {
        overrides.gasLimit = ethers.utils.hexlify(
          ethers.BigNumber.from(gasSettings.gasLimit || '200000'),
        );
      }

      // For EIP-1559 compatible networks
      if (network === 'ETH' || network === 'MATIC') {
        const feeData = await provider.getFeeData();

        overrides.maxFeePerGas = gasSettings.maxFeePerGas || feeData.maxFeePerGas;
        overrides.maxPriorityFeePerGas =
          gasSettings.maxPriorityFeePerGas || feeData.maxPriorityFeePerGas;
        overrides.type = 2; // EIP-1559 transaction
      } else {
        // Legacy transaction
        overrides.gasPrice = gasSettings.gasPrice || (await provider.getGasPrice());
      }

      // Send transfer transaction
      const transaction = await contract.transfer(to, parsedAmount, overrides);

      // Wait for transaction to be mined
      const receipt = await transaction.wait();

      return {
        transactionHash: receipt.transactionHash,
        blockNumber: receipt.blockNumber,
        status: receipt.status === 1,
        gasUsed: receipt.gasUsed.toString(),
        effectiveGasPrice: receipt.effectiveGasPrice.toString(),
        from: receipt.from,
        to: tokenConfig.address, // Contract address
        tokenRecipient: to,
        tokenAmount: amount,
        tokenSymbol: tokenSymbol,
      };
    } catch (error) {
      console.error(`Error transferring ${tokenSymbol}:`, error);
      throw error;
    }
  }

  /**
   * Estimate gas for a transaction
   * @param {TransactionOptions} options - Transaction options
   * @returns {Promise<Object>} Gas estimation details
   */
  async estimateGas({ from, to, amount, network, data = '0x' }: TransactionOptions): Promise<any> {
    try {
      network = network.toUpperCase();
      const provider = this.handlers.providers[network];

      const tx = {
        from,
        to,
        value: ethers.utils.parseEther(amount),
        data
      };

      const gasEstimate = await provider.estimateGas(tx);
      const feeData = await provider.getFeeData();

      return {
        gasLimit: gasEstimate.toString(),
        maxFeePerGas: feeData.maxFeePerGas?.toString(),
        maxPriorityFeePerGas: feeData.maxPriorityFeePerGas?.toString(),
        gasPrice: feeData.gasPrice?.toString()
      };
    } catch (error) {
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }

  /**
   * Send multiple transactions in batch
   * @param {TransactionOptions[]} transactions - Array of transaction objects
   * @param {string} network - Network identifier
   * @returns {Promise<Object>} Batch transaction results
   */
  async sendBatchTransactions(transactions: TransactionOptions[], network: string): Promise<any> {
    const results = [];
    const failures = [];

    for (const tx of transactions) {
      try {
        const receipt = await this.sendTransaction({
          ...tx,
          network
        });
        results.push(receipt);
      } catch (error) {
        failures.push({
          transaction: tx,
          error: error.message
        });
      }
    }

    return {
      successful: results,
      failed: failures,
      totalProcessed: transactions.length,
      successCount: results.length,
      failureCount: failures.length
    };
  }
}

// Export TransactionService as default
export default TransactionService;

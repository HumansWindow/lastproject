import { ethers } from 'ethers';

interface TransactionHistoryConfig {
  maxTransactionHistory: number;
  scanBlocks: number;
  explorerApiKeys: Record<string, string>;
  maxRetries: number;
  retryDelay: number;
  defaultGasLimit?: Record<string, string>;
}

interface QueryOptions {
  includeTokenTransfers?: boolean;
  includeNFTTransfers?: boolean;
  fromBlock?: number;
  toBlock?: string | number;
  limit?: number;
  page?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  startDate?: string | null;
  endDate?: string | null;
  types?: string[];
}

/**
 * Service for retrieving transaction history
 */
class TransactionHistoryService {
  private chainHandlers: any;
  private providers: Record<string, ethers.providers.Provider>;
  private config: TransactionHistoryConfig;
  private transactionCache: Record<string, any[]>;

  constructor(chainHandlers: any, config: Partial<TransactionHistoryConfig> = {}) {
    this.chainHandlers = chainHandlers;
    this.providers = chainHandlers.providers;
    this.config = {
      maxTransactionHistory: 100, // Maximum number of transactions to return
      scanBlocks: 10000, // Default number of blocks to scan
      explorerApiKeys: {}, // Explorer API keys should be provided in config
      maxRetries: 3, // Add retry count
      retryDelay: 1000, // Add retry delay in ms
      ...config
    };
    
    // Cache for transaction history
    this.transactionCache = {};
  }
  
  /**
   * Get transaction history for an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to get history for
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transaction history
   */
  async getTransactionHistory(network: string, address: string, options: QueryOptions = {}): Promise<any[]> {
    try {
      const networkUpper = network.toUpperCase();
      const provider = this.providers[networkUpper];
      
      if (!provider) {
        throw new Error(`No provider available for network ${networkUpper}`);
      }
      
      // Normalize address
      const normalizedAddress = address.toLowerCase();
      
      // Set up options with defaults
      const queryOptions = {
        includeTokenTransfers: options.includeTokenTransfers !== false,
        includeNFTTransfers: options.includeNFTTransfers !== false,
        fromBlock: options.fromBlock || -1000, // Default to last 1000 blocks
        toBlock: options.toBlock || 'latest',
        limit: options.limit || this.config.maxTransactionHistory,
        page: options.page || 1,
        sortBy: options.sortBy || 'blockNumber',
        sortDir: options.sortDir || 'desc', // descending by default
        startDate: options.startDate || null,
        endDate: options.endDate || null,
        types: options.types || ['normal', 'token', 'nft'], // transaction types to include
        ...options
      };
      
      // Create cache key based on query parameters
      const cacheKey = `${networkUpper}_${normalizedAddress}_${JSON.stringify(queryOptions)}`;
      
      // Return cached result if available
      if (this.transactionCache[cacheKey]) {
        return this.transactionCache[cacheKey];
      }
      
      let transactions = [];
      
      // For EVM chains (ETH, BNB, MATIC)
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        // Get transactions from explorer API if possible
        const explorerUrl = this._getExplorerApiUrl(networkUpper);
        const apiKey = this._getExplorerApiKey(networkUpper);
        
        if (explorerUrl && apiKey) {
          transactions = await this._getTransactionsFromExplorer(
            networkUpper,
            normalizedAddress,
            explorerUrl,
            apiKey,
            queryOptions
          );
        } else {
          // Fallback to direct blockchain queries (limited scope)
          const currentBlock = await provider.getBlockNumber();
          const startBlock = queryOptions.fromBlock < 0 ? 
            Math.max(0, currentBlock + queryOptions.fromBlock) : 
            queryOptions.fromBlock;
          
          transactions = await this._getTransactionsFromBlockchain(
            networkUpper,
            provider,
            normalizedAddress,
            startBlock,
            queryOptions.toBlock === 'latest' ? currentBlock : queryOptions.toBlock,
            queryOptions
          );
        }
        
        // Apply additional filtering
        transactions = this._filterTransactions(transactions, queryOptions);
        
        // Apply pagination
        const startIndex = (queryOptions.page - 1) * queryOptions.limit;
        const endIndex = startIndex + queryOptions.limit;
        transactions = transactions.slice(startIndex, endIndex);
      }
      
      // For Solana
      if (networkUpper === 'SOL') {
        // Use Solana connection APIs
        // For this mock implementation, return an empty array
        transactions = [];
      }
      
      // Cache the result
      this.transactionCache[cacheKey] = transactions;
      
      return transactions;
    } catch (error) {
      console.error(`Error getting transaction history for ${address} on ${network}:`, error);
      return [];
    }
  }
  
  /**
   * Get explorer API URL for a network
   * @param {string} network - Network identifier
   * @returns {string|null} Explorer API URL
   * @private
   */
  private _getExplorerApiUrl(network: string): string | null {
    const urls = {
      'ETH': 'https://api.etherscan.io/api',
      'ETH_GOERLI': 'https://api-goerli.etherscan.io/api',
      'ETH_SEPOLIA': 'https://api-sepolia.etherscan.io/api',
      'BNB': 'https://api.bscscan.com/api',
      'BNB_TESTNET': 'https://api-testnet.bscscan.com/api',
      'MATIC': 'https://api.polygonscan.com/api',
      'MATIC_MUMBAI': 'https://api-mumbai.polygonscan.com/api',
      'AVAX': 'https://api.snowtrace.io/api',
      'FTM': 'https://api.ftmscan.com/api',
      'ARB': 'https://api.arbiscan.io/api',
      'OP': 'https://api-optimistic.etherscan.io/api',
    };
    
    return urls[network] || null;
  }
  
  /**
   * Get explorer API key for a network
   * @param {string} network - Network identifier
   * @returns {string|null} API key
   * @private
   */
  private _getExplorerApiKey(network: string): string | null {
    // Extract the base network from testnet identifiers
    const baseNetwork = network.split('_')[0];
    return this.config.explorerApiKeys?.[baseNetwork] || null;
  }
  
  /**
   * Get chain ID for Covalent API
   * @param {string} network - Network identifier
   * @returns {number|null} Covalent chain ID
   * @private
   */
  private _getCovalentChainId(network: string): number | null {
    const chainIds = {
      'ETH': 1,
      'ETH_GOERLI': 5,
      'ETH_SEPOLIA': 11155111,
      'BNB': 56,
      'BNB_TESTNET': 97,
      'MATIC': 137,
      'MATIC_MUMBAI': 80001,
      'AVAX': 43114,
      'FTM': 250,
      'ARB': 42161,
      'OP': 10,
    };
    
    return chainIds[network] || null;
  }
  
  /**
   * Get transactions from blockchain explorer API
   * @param {string} network - Network identifier
   * @param {string} address - Address
   * @param {string} explorerUrl - Explorer API URL
   * @param {string} apiKey - Explorer API key
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transactions
   * @private
   */
  private async _getTransactionsFromExplorer(network: string, address: string, explorerUrl: string, apiKey: string, options: QueryOptions): Promise<any[]> {
    let retries = 0;
    while (retries < this.config.maxRetries) {
      try {
        const transactions = [];
        const limit = options.limit || this.config.maxTransactionHistory;
        const page = options.page || 1;
        
        // Fetch normal transactions
        if (options.types.includes('normal')) {
          const normalTxUrl = `${explorerUrl}?module=account&action=txlist&address=${address}&page=${page}&offset=${limit}&sort=${options.sortDir === 'desc' ? 'desc' : 'asc'}&apikey=${apiKey}`;
          const response = await this._retryFetch(normalTxUrl);
          const data = await response.json();
          
          if (data.status === '1' && Array.isArray(data.result)) {
            const normalTxs = data.result.map(tx => this._formatExplorerTransaction(tx, network));
            transactions.push(...normalTxs);
          }
        }
        
        // Fetch token transactions if requested
        if (options.includeTokenTransfers && options.types.includes('token')) {
          const tokenTxUrl = `${explorerUrl}?module=account&action=tokentx&address=${address}&page=${page}&offset=${limit}&sort=${options.sortDir === 'desc' ? 'desc' : 'asc'}&apikey=${apiKey}`;
          const response = await this._retryFetch(tokenTxUrl);
          const data = await response.json();
          
          if (data.status === '1' && Array.isArray(data.result)) {
            const tokenTxs = data.result.map(tx => this._formatExplorerTokenTransaction(tx, network));
            transactions.push(...tokenTxs);
          }
        }
        
        // Fetch NFT transactions if requested
        if (options.includeNFTTransfers && options.types.includes('nft')) {
          const nftTxUrl = `${explorerUrl}?module=account&action=tokennfttx&address=${address}&page=${page}&offset=${limit}&sort=${options.sortDir === 'desc' ? 'desc' : 'asc'}&apikey=${apiKey}`;
          const response = await this._retryFetch(nftTxUrl);
          const data = await response.json();
          
          if (data.status === '1' && Array.isArray(data.result)) {
            const nftTxs = data.result.map(tx => this._formatExplorerNFTTransaction(tx, network));
            transactions.push(...nftTxs);
          }
        }
        
        // Sort transactions according to options
        return this._sortTransactions(transactions, options.sortBy, options.sortDir);
      } catch (error) {
        retries++;
        if (retries === this.config.maxRetries) {
          throw new Error(`Failed to fetch transactions after ${retries} retries: ${error.message}`);
        }
        await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * retries));
      }
    }
  }

  private async _retryFetch(url: string): Promise<Response> {
    let lastError;
    for (let i = 0; i < this.config.maxRetries; i++) {
      try {
        const response = await fetch(url);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response;
      } catch (error) {
        lastError = error;
        if (i < this.config.maxRetries - 1) {
          await new Promise(resolve => setTimeout(resolve, this.config.retryDelay * (i + 1)));
        }
      }
    }
    throw lastError;
  }
  
  /**
   * Get transactions directly from blockchain
   * @param {string} network - Network identifier
   * @param {Object} provider - Ethers provider
   * @param {string} address - Address
   * @param {number} fromBlock - Starting block
   * @param {number|string} toBlock - Ending block
   * @param {Object} options - Query options
   * @returns {Promise<Array>} Transactions
   * @private
   */
  private async _getTransactionsFromBlockchain(network: string, provider: ethers.providers.Provider, address: string, fromBlock: number, toBlock: number | string, options: QueryOptions): Promise<any[]> {
    // This is a limited implementation that would need to scan blocks
    // In a real implementation, we would use an indexing service
    // For demonstration, return an empty array
    return [];
  }
  
  /**
   * Filter transactions based on options
   * @param {Array} transactions - Transactions to filter
   * @param {Object} options - Filter options
   * @returns {Array} Filtered transactions
   * @private
   */
  private _filterTransactions(transactions: any[], options: QueryOptions): any[] {
    let filtered = [...transactions];
    
    // Filter by date if specified
    if (options.startDate) {
      const startTimestamp = new Date(options.startDate).getTime() / 1000;
      filtered = filtered.filter(tx => tx.timestamp >= startTimestamp);
    }
    
    if (options.endDate) {
      const endTimestamp = new Date(options.endDate).getTime() / 1000;
      filtered = filtered.filter(tx => tx.timestamp <= endTimestamp);
    }
    
    // Filter by transaction type
    if (options.types && options.types.length > 0) {
      filtered = filtered.filter(tx => options.types.includes(tx.type || 'normal'));
    }
    
    return filtered;
  }
  
  /**
   * Sort transactions
   * @param {Array} transactions - Transactions to sort
   * @param {string} sortBy - Field to sort by
   * @param {string} sortDir - Sort direction ('asc' or 'desc')
   * @returns {Array} Sorted transactions
   * @private
   */
  private _sortTransactions(transactions: any[], sortBy: string, sortDir: 'asc' | 'desc'): any[] {
    const multiplier = sortDir === 'desc' ? -1 : 1;
    
    return [...transactions].sort((a, b) => {
      if (a[sortBy] === undefined || b[sortBy] === undefined) return 0;
      
      if (typeof a[sortBy] === 'string' && !isNaN(Number(a[sortBy]))) {
        return multiplier * (Number(a[sortBy]) - Number(b[sortBy]));
      }
      
      if (typeof a[sortBy] === 'string') {
        return multiplier * a[sortBy].localeCompare(b[sortBy]);
      }
      
      return multiplier * (a[sortBy] - b[sortBy]);
    });
  }
  
  /**
   * Format explorer transaction
   * @param {Object} tx - Explorer transaction data
   * @param {string} network - Network identifier
   * @returns {Object} Formatted transaction
   * @private
   */
  private _formatExplorerTransaction(tx: any, network: string): any {
    return {
      hash: tx.hash,
      network,
      type: 'normal',
      blockNumber: parseInt(tx.blockNumber, 10),
      blockHash: tx.blockHash,
      timestamp: parseInt(tx.timeStamp, 10),
      from: tx.from.toLowerCase(),
      to: tx.to ? tx.to.toLowerCase() : null,
      value: tx.value,
      valueFormatted: ethers.utils.formatEther(tx.value),
      gasPrice: tx.gasPrice,
      gasPriceFormatted: ethers.utils.formatUnits(tx.gasPrice, 'gwei'),
      gasUsed: tx.gasUsed,
      nonce: parseInt(tx.nonce, 10),
      status: tx.isError === '0' ? 'success' : 'failed',
      txFee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
      txFeeFormatted: ethers.utils.formatEther(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)),
      data: tx.input,
      confirmations: parseInt(tx.confirmations, 10),
    };
  }
  
  /**
   * Format explorer token transaction
   * @param {Object} tx - Explorer token transaction data
   * @param {string} network - Network identifier
   * @returns {Object} Formatted transaction
   * @private
   */
  private _formatExplorerTokenTransaction(tx: any, network: string): any {
    return {
      hash: tx.hash,
      network,
      type: 'token',
      blockNumber: parseInt(tx.blockNumber, 10),
      blockHash: tx.blockHash,
      timestamp: parseInt(tx.timeStamp, 10),
      from: tx.from.toLowerCase(),
      to: tx.to.toLowerCase(),
      value: '0', // Native token value
      valueFormatted: '0',
      tokenAddress: tx.contractAddress.toLowerCase(),
      tokenName: tx.tokenName,
      tokenSymbol: tx.tokenSymbol,
      tokenDecimal: parseInt(tx.tokenDecimal, 10),
      tokenValue: tx.value,
      tokenValueFormatted: ethers.utils.formatUnits(tx.value, parseInt(tx.tokenDecimal, 10)),
      gasPrice: tx.gasPrice,
      gasPriceFormatted: ethers.utils.formatUnits(tx.gasPrice, 'gwei'),
      gasUsed: tx.gasUsed,
      nonce: parseInt(tx.nonce, 10),
      status: tx.isError === '0' ? 'success' : 'failed',
      txFee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
      txFeeFormatted: ethers.utils.formatEther(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)),
      confirmations: parseInt(tx.confirmations, 10),
    };
  }
  
  /**
   * Format explorer NFT transaction
   * @param {Object} tx - Explorer NFT transaction data
   * @param {string} network - Network identifier
   * @returns {Object} Formatted transaction
   * @private
   */
  private _formatExplorerNFTTransaction(tx: any, network: string): any {
    return {
      hash: tx.hash,
      network,
      type: 'nft',
      blockNumber: parseInt(tx.blockNumber, 10),
      blockHash: tx.blockHash,
      timestamp: parseInt(tx.timeStamp, 10),
      from: tx.from.toLowerCase(),
      to: tx.to.toLowerCase(),
      value: '0', // Native token value
      valueFormatted: '0',
      tokenAddress: tx.contractAddress.toLowerCase(),
      tokenName: tx.tokenName,
      tokenSymbol: tx.tokenSymbol,
      tokenId: tx.tokenID,
      tokenType: tx.tokenType || 'ERC721', // ERC721 or ERC1155
      gasPrice: tx.gasPrice,
      gasPriceFormatted: ethers.utils.formatUnits(tx.gasPrice, 'gwei'),
      gasUsed: tx.gasUsed,
      nonce: parseInt(tx.nonce, 10),
      status: tx.isError === '0' ? 'success' : 'failed',
      txFee: (BigInt(tx.gasUsed) * BigInt(tx.gasPrice)).toString(),
      txFeeFormatted: ethers.utils.formatEther(BigInt(tx.gasUsed) * BigInt(tx.gasPrice)),
      confirmations: parseInt(tx.confirmations, 10),
    };
  }
  
  /**
   * Get pending transactions for an address
   * @param {string} network - Network identifier
   * @param {string} address - Address to check
   * @returns {Promise<Array>} Pending transactions
   */
  async getPendingTransactions(network: string, address: string): Promise<any[]> {
    try {
      const networkUpper = network.toUpperCase();
      const provider = this.providers[networkUpper];
      
      if (!provider) {
        throw new Error(`No provider available for network ${networkUpper}`);
      }
      
      // Normalize address
      const normalizedAddress = address.toLowerCase();
      
      // For EVM chains
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        // In a real implementation, we would track pending transactions
        // from our own transaction submission and also query mempool if possible
        
        // This is a mocked implementation
        return [];
      }
      
      // For Solana
      if (networkUpper === 'SOL') {
        // Would use Solana connection to get pending transactions
        return [];
      }
      
      return [];
    } catch (error) {
      console.error(`Error getting pending transactions for ${address} on ${network}:`, error);
      return [];
    }
  }
  
  /**
   * Get transaction details
   * @param {string} network - Network identifier
   * @param {string} txHash - Transaction hash
   * @returns {Promise<Object>} Transaction details
   */
  async getTransactionDetails(network: string, txHash: string): Promise<any> {
    try {
      const networkUpper = network.toUpperCase();
      const provider = this.providers[networkUpper];
      
      if (!provider) {
        throw new Error(`No provider available for network ${networkUpper}`);
      }
      
      // For EVM chains
      if (['ETH', 'BNB', 'MATIC'].includes(networkUpper)) {
        const tx = await provider.getTransaction(txHash);
        if (!tx) {
          throw new Error(`Transaction ${txHash} not found on ${networkUpper}`);
        }
        
        const receipt = await provider.getTransactionReceipt(txHash);
        
        return this._formatEVMTransaction(tx, receipt, networkUpper);
      }
      
      // For Solana
      if (networkUpper === 'SOL') {
        // Would use Solana connection to get transaction details
        return null;
      }
      
      return null;
    } catch (error) {
      console.error(`Error getting transaction details for ${txHash} on ${network}:`, error);
      return null;
    }
  }
  
  /**
   * Format EVM transaction data
   * @private
   */
  private _formatEVMTransaction(tx: any, receipt: any, network: string): any {
    if (!tx) return null;
    
    // Get basic transaction data
    const result: any = {
      hash: tx.hash,
      network,
      blockNumber: tx.blockNumber || null,
      blockHash: tx.blockHash || null,
      from: tx.from,
      to: tx.to,
      value: tx.value.toString(),
      valueFormatted: ethers.utils.formatEther(tx.value),
      nonce: tx.nonce,
      data: tx.data,
      timestamp: null, // Would be filled from block timestamp
      gasPrice: null,
      gasPriceFormatted: null,
      maxFeePerGas: null,
      maxFeePerGasFormatted: null,
      maxPriorityFeePerGas: null,
      maxPriorityFeePerGasFormatted: null,
      status: null,
      gasUsed: null,
      effectiveGasPrice: null,
      logs: [],
      confirmations: 0
    };
    
    // Add gas information
    if (tx.gasPrice) {
      result.gasPrice = tx.gasPrice.toString();
      result.gasPriceFormatted = ethers.utils.formatUnits(tx.gasPrice, 'gwei');
    }
    
    if (tx.maxFeePerGas) {
      result.maxFeePerGas = tx.maxFeePerGas.toString();
      result.maxFeePerGasFormatted = ethers.utils.formatUnits(tx.maxFeePerGas, 'gwei');
    }
    
    if (tx.maxPriorityFeePerGas) {
      result.maxPriorityFeePerGas = tx.maxPriorityFeePerGas.toString();
      result.maxPriorityFeePerGasFormatted = ethers.utils.formatUnits(tx.maxPriorityFeePerGas, 'gwei');
    }
    
    // Add receipt information if available
    if (receipt) {
      result.status = receipt.status === 1 ? 'success' : 'failed';
      result.gasUsed = receipt.gasUsed.toString();
      result.effectiveGasPrice = receipt.effectiveGasPrice?.toString();
      result.logs = receipt.logs;
      result.confirmations = receipt.confirmations;
    } else {
      result.status = 'pending';
    }
    
    return result;
  }
  
  /**
   * Clear transaction cache
   */
  clearCache(): void {
    this.transactionCache = {};
  }
}

export default TransactionHistoryService;

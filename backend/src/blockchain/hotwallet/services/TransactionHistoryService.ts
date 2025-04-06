import { ethers } from 'ethers';
import { Logger } from '@nestjs/common';
import { ApiConfig } from '../types/api-config';

interface HistoryOptions {
  limit?: number;
  offset?: number;
  fromBlock?: number;
  toBlock?: number | 'latest';
  category?: 'sent' | 'received' | 'all';
  includeTokenTransfers?: boolean;
}

interface PaginationResult<T> {
  data: T[];
  pagination: {
    total: number;
    offset: number;
    limit: number;
    hasMore: boolean;
  };
}

interface TransactionData {
  hash: string;
  from: string;
  to: string;
  value: string;
  gasPrice: string;
  gasUsed: string;
  blockNumber: number;
  timestamp: number;
  status: number;
  isError?: boolean;
  nonce?: number;
  input?: string;
  tokenTransfers?: TokenTransfer[];
  fee?: string;
  networkFee?: string;
}

interface TokenTransfer {
  tokenAddress: string;
  from: string;
  to: string;
  value: string;
  tokenSymbol?: string;
  tokenName?: string;
  tokenDecimal?: number;
  transactionHash: string;
}

/**
 * Service for retrieving and processing transaction history
 * Supports different blockchain explorers and APIs
 */
export class TransactionHistoryService {
  private readonly logger = new Logger(TransactionHistoryService.name);
  private readonly defaultPageSize = 20;
  private readonly apiConfig: ApiConfig;
  
  constructor(config: ApiConfig) {
    this.apiConfig = config;
  }
  
  /**
   * Get transaction history for an address
   * @param address Wallet address
   * @param chainId Blockchain network ID
   * @param options History retrieval options
   * @returns List of transactions with pagination info
   */
  public async getTransactionHistory(
    network: number,
    address: string,
    options?: any
  ): Promise<any[]> {
    // Convert PaginationResult to array format
    const result = await this._fetchTransactionHistory(network, address, options);
    return Array.isArray(result.data) ? result.data : [];
  }

  public async getPendingTransactions(network: string, address: string): Promise<any[]> {
    // Implement pending transactions fetch
    return [];
  }

  private async _fetchTransactionHistory(network: number, address: string, options?: any): Promise<any> {
    // Implementation details...
    return { data: [] };
  }
  
  /**
   * Get transaction details by hash
   * @param txHash Transaction hash
   * @param chainId Blockchain network ID
   * @returns Transaction details
   */
  public async getTransactionByHash(txHash: string, chainId: number): Promise<TransactionData> {
    try {
      if (this._isEthereumMainnetOrTestnet(chainId)) {
        return await this._getEtherscanTransactionByHash(txHash, chainId);
      } else if (this._isPolygonNetwork(chainId)) {
        return await this._getPolygonTransactionByHash(txHash, chainId);
      } else if (this._isBinanceSmartChain(chainId)) {
        return await this._getBscTransactionByHash(txHash, chainId);
      } else {
        return await this._getCovalentTransactionByHash(txHash, chainId);
      }
    } catch (error) {
      this.logger.error(`Error fetching transaction ${txHash} on chain ${chainId}`, error);
      throw new Error(`Failed to fetch transaction: ${error.message}`);
    }
  }
  
  /**
   * Get token transfer history for an address
   * @param address Wallet address
   * @param chainId Blockchain network ID
   * @param options History retrieval options
   * @returns List of token transfers with pagination info
   */
  public async getTokenTransfers(
    address: string,
    chainId: number,
    options: HistoryOptions = {}
  ): Promise<PaginationResult<TokenTransfer>> {
    const normalizedOptions: Required<HistoryOptions> = {
      limit: options.limit || this.defaultPageSize,
      offset: options.offset || 0,
      fromBlock: options.fromBlock || 0,
      toBlock: options.toBlock || 'latest',
      category: 'all' as const,
      includeTokenTransfers: true
    };
    
    try {
      if (this._isEthereumMainnetOrTestnet(chainId)) {
        return await this._getEtherscanTokenTransfers(address, chainId, normalizedOptions);
      } else if (this._isPolygonNetwork(chainId)) {
        return await this._getPolygonTokenTransfers(address, chainId, normalizedOptions);
      } else if (this._isBinanceSmartChain(chainId)) {
        return await this._getBscTokenTransfers(address, chainId, normalizedOptions);
      } else {
        return await this._getCovalentTokenTransfers(address, chainId, normalizedOptions);
      }
    } catch (error) {
      this.logger.error(`Error fetching token transfers for ${address} on chain ${chainId}`, error);
      throw new Error(`Failed to fetch token transfers: ${error.message}`);
    }
  }
  
  // Helper methods for checking chain types
  private _isEthereumMainnetOrTestnet(chainId: number): boolean {
    // Ethereum and testnets
    return [1, 3, 4, 5, 42].includes(chainId);
  }
  
  private _isPolygonNetwork(chainId: number): boolean {
    // Polygon (Matic) and Mumbai testnet
    return [137, 80001].includes(chainId);
  }
  
  private _isBinanceSmartChain(chainId: number): boolean {
    // BSC mainnet and testnet
    return [56, 97].includes(chainId);
  }
  
  private _isAvalancheNetwork(chainId: number): boolean {
    // Avalanche C-Chain and Fuji testnet
    return [43114, 43113].includes(chainId);
  }
  
  // API integration methods for different providers
  private async _getEtherscanTransactions(
    address: string,
    chainId: number,
    options: Required<HistoryOptions>
  ): Promise<PaginationResult<TransactionData>> {
    const apiKey = this._getEtherscanApiKey(chainId);
    const baseUrl = this._getExplorerApiUrl(chainId, 'etherscan');
    
    // Build API URL with parameters
    const apiUrl = new URL(`${baseUrl}/api`);
    apiUrl.searchParams.append('module', 'account');
    apiUrl.searchParams.append('action', 'txlist');
    apiUrl.searchParams.append('address', address);
    apiUrl.searchParams.append('startblock', options.fromBlock.toString());
    
    if (options.toBlock !== 'latest') {
      apiUrl.searchParams.append('endblock', options.toBlock.toString());
    }
    
    apiUrl.searchParams.append('page', Math.floor(options.offset / options.limit + 1).toString());
    apiUrl.searchParams.append('offset', options.limit.toString());
    apiUrl.searchParams.append('sort', 'desc');
    apiUrl.searchParams.append('apikey', apiKey);
    
    // Apply transaction type filter if specified
    if (options.category === 'sent') {
      apiUrl.searchParams.append('sort', 'desc');
    }
    
    // Fetch data from API
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== '1') {
      // Check if it's just no transactions (which isn't an error)
      if (data.message === 'No transactions found') {
        return {
          data: [],
          pagination: {
            total: 0,
            offset: options.offset,
            limit: options.limit,
            hasMore: false,
          },
        };
      }
      throw new Error(`Etherscan API error: ${data.message}`);
    }
    
    // Transform response to our standard format
    const transactions = data.result.map(tx => this._normalizeEtherscanTransaction(tx));
    
    // Apply client-side filtering if needed
    let filteredTransactions = transactions;
    if (options.category === 'sent') {
      filteredTransactions = transactions.filter(tx => 
        tx.from.toLowerCase() === address.toLowerCase()
      );
    } else if (options.category === 'received') {
      filteredTransactions = transactions.filter(tx => 
        tx.to && tx.to.toLowerCase() === address.toLowerCase()
      );
    }
    
    // Fetch token transfers if requested
    if (options.includeTokenTransfers) {
      await this._enrichWithTokenTransfers(filteredTransactions, address, chainId);
    }
    
    return {
      data: filteredTransactions,
      pagination: {
        total: parseInt(data.result.length.toString(), 10),
        offset: options.offset,
        limit: options.limit,
        hasMore: filteredTransactions.length >= options.limit,
      },
    };
  }
  
  private async _getPolygonTransactions(
    address: string,
    chainId: number,
    options: Required<HistoryOptions>
  ): Promise<PaginationResult<TransactionData>> {
    // For Polygon we'll use the same format as Etherscan
    return this._getEtherscanTransactions(address, chainId, options);
  }
  
  private async _getBscTransactions(
    address: string,
    chainId: number,
    options: Required<HistoryOptions>
  ): Promise<PaginationResult<TransactionData>> {
    // For BSC we'll use the same format as Etherscan
    return this._getEtherscanTransactions(address, chainId, options);
  }
  
  private async _getCovalentTransactions(
    address: string,
    chainId: number,
    options: Required<HistoryOptions>
  ): Promise<PaginationResult<TransactionData>> {
    const apiKey = this.apiConfig.covalent?.apiKey;
    
    if (!apiKey) {
      throw new Error('Covalent API key not configured');
    }
    
    const covalentChainId = this._getCovalentChainId(chainId);
    const baseUrl = this.apiConfig.covalent?.baseUrl || 'https://api.covalenthq.com/v1';
    
    // Build API URL
    const apiUrl = new URL(`${baseUrl}/${covalentChainId}/address/${address}/transactions_v2/`);
    apiUrl.searchParams.append('key', apiKey);
    apiUrl.searchParams.append('page-number', Math.floor(options.offset / options.limit + 1).toString());
    apiUrl.searchParams.append('page-size', options.limit.toString());
    apiUrl.searchParams.append('no-logs', options.includeTokenTransfers ? 'false' : 'true');
    
    if (options.fromBlock > 0) {
      apiUrl.searchParams.append('starting-block', options.fromBlock.toString());
    }
    
    if (options.toBlock !== 'latest') {
      apiUrl.searchParams.append('ending-block', options.toBlock.toString());
    }
    
    // Fetch data from API
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Covalent API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data) {
      throw new Error('Invalid response from Covalent API');
    }
    
    // Transform response to our standard format
    const transactions = data.data.items.map(item => this._normalizeCovalentTransaction(item, address));
    
    // Apply client-side filtering if needed
    let filteredTransactions = transactions;
    if (options.category === 'sent') {
      filteredTransactions = transactions.filter(tx => 
        tx.from.toLowerCase() === address.toLowerCase()
      );
    } else if (options.category === 'received') {
      filteredTransactions = transactions.filter(tx => 
        tx.to && tx.to.toLowerCase() === address.toLowerCase()
      );
    }
    
    return {
      data: filteredTransactions,
      pagination: {
        total: data.data.pagination.total_count,
        offset: options.offset,
        limit: options.limit,
        hasMore: data.data.pagination.has_more,
      },
    };
  }
  
  // Transaction detail methods
  private async _getEtherscanTransactionByHash(
    txHash: string,
    chainId: number
  ): Promise<TransactionData> {
    const apiKey = this._getEtherscanApiKey(chainId);
    const baseUrl = this._getExplorerApiUrl(chainId, 'etherscan');
    
    // Build API URL
    const apiUrl = new URL(`${baseUrl}/api`);
    apiUrl.searchParams.append('module', 'proxy');
    apiUrl.searchParams.append('action', 'eth_getTransactionByHash');
    apiUrl.searchParams.append('txhash', txHash);
    apiUrl.searchParams.append('apikey', apiKey);
    
    // Get transaction data
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`API error: ${response.status} ${response.statusText}`);
    }
    
    const txData = await response.json();
    
    if (!txData.result) {
      throw new Error(`Transaction ${txHash} not found`);
    }
    
    // Get receipt for additional info
    const receiptUrl = new URL(`${baseUrl}/api`);
    receiptUrl.searchParams.append('module', 'proxy');
    receiptUrl.searchParams.append('action', 'eth_getTransactionReceipt');
    receiptUrl.searchParams.append('txhash', txHash);
    receiptUrl.searchParams.append('apikey', apiKey);
    
    const receiptResponse = await fetch(receiptUrl.toString());
    const receiptData = await receiptResponse.json();
    
    // Get block info for timestamp
    const blockUrl = new URL(`${baseUrl}/api`);
    blockUrl.searchParams.append('module', 'proxy');
    blockUrl.searchParams.append('action', 'eth_getBlockByNumber');
    blockUrl.searchParams.append('tag', txData.result.blockNumber);
    blockUrl.searchParams.append('boolean', 'false');
    blockUrl.searchParams.append('apikey', apiKey);
    
    const blockResponse = await fetch(blockUrl.toString());
    const blockData = await blockResponse.json();
    
    // Combine all data
    const result = {
      hash: txData.result.hash,
      from: txData.result.from,
      to: txData.result.to,
      value: txData.result.value,
      gasPrice: txData.result.gasPrice,
      gasUsed: receiptData.result?.gasUsed || '0x0',
      blockNumber: parseInt(txData.result.blockNumber, 16),
      timestamp: parseInt(blockData.result?.timestamp || '0x0', 16),
      status: receiptData.result?.status ? parseInt(receiptData.result.status, 16) : 0,
      nonce: parseInt(txData.result.nonce, 16),
      input: txData.result.input,
      tokenTransfers: [],
      fee: ethers.utils.formatEther(
        ethers.BigNumber.from(txData.result.gasPrice).mul(
          ethers.BigNumber.from(receiptData.result?.gasUsed || '0x0')
        )
      ),
    };
    
    return result;
  }
  
  private async _getPolygonTransactionByHash(
    txHash: string,
    chainId: number
  ): Promise<TransactionData> {
    // Use the same etherscan-compatible API
    return this._getEtherscanTransactionByHash(txHash, chainId);
  }
  
  private async _getBscTransactionByHash(
    txHash: string,
    chainId: number
  ): Promise<TransactionData> {
    // Use the same etherscan-compatible API
    return this._getEtherscanTransactionByHash(txHash, chainId);
  }
  
  private async _getCovalentTransactionByHash(
    txHash: string,
    chainId: number
  ): Promise<TransactionData> {
    const apiKey = this.apiConfig.covalent?.apiKey;
    
    if (!apiKey) {
      throw new Error('Covalent API key not configured');
    }
    
    const covalentChainId = this._getCovalentChainId(chainId);
    const baseUrl = this.apiConfig.covalent?.baseUrl || 'https://api.covalenthq.com/v1';
    
    // Build API URL
    const apiUrl = new URL(`${baseUrl}/${covalentChainId}/transaction_v2/${txHash}/`);
    apiUrl.searchParams.append('key', apiKey);
    
    // Fetch data from API
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Covalent API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data || !data.data.items || data.data.items.length === 0) {
      throw new Error(`Transaction ${txHash} not found`);
    }
    
    const tx = data.data.items[0];
    
    // Transform to our standard format
    return {
      hash: tx.tx_hash,
      from: tx.from_address,
      to: tx.to_address,
      value: tx.value,
      gasPrice: tx.gas_price.toString(),
      gasUsed: tx.gas_spent.toString(),
      blockNumber: tx.block_height,
      timestamp: Math.floor(new Date(tx.block_signed_at).getTime() / 1000),
      status: tx.successful ? 1 : 0,
      isError: !tx.successful,
      nonce: tx.nonce,
      input: tx.input,
      tokenTransfers: (tx.log_events || [])
        .filter(log => this._isERC20Transfer(log) || this._isERC721Transfer(log))
        .map(log => this._parseTokenTransferFromLog(log, tx.tx_hash)),
      fee: tx.fees_paid,
    };
  }
  
  // Token transfers methods
  private async _getEtherscanTokenTransfers(
    address: string,
    chainId: number,
    options: Required<HistoryOptions>
  ): Promise<PaginationResult<TokenTransfer>> {
    const apiKey = this._getEtherscanApiKey(chainId);
    const baseUrl = this._getExplorerApiUrl(chainId, 'etherscan');
    
    // Build API URL
    const apiUrl = new URL(`${baseUrl}/api`);
    apiUrl.searchParams.append('module', 'account');
    apiUrl.searchParams.append('action', 'tokentx');
    apiUrl.searchParams.append('address', address);
    apiUrl.searchParams.append('startblock', options.fromBlock.toString());
    
    if (options.toBlock !== 'latest') {
      apiUrl.searchParams.append('endblock', options.toBlock.toString());
    }
    
    apiUrl.searchParams.append('page', Math.floor(options.offset / options.limit + 1).toString());
    apiUrl.searchParams.append('offset', options.limit.toString());
    apiUrl.searchParams.append('sort', 'desc');
    apiUrl.searchParams.append('apikey', apiKey);
    
    // Fetch data from API
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Etherscan API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (data.status !== '1' && data.message !== 'No transactions found') {
      throw new Error(`Etherscan API error: ${data.message}`);
    }
    
    // If no transactions found, return empty result
    if (data.message === 'No transactions found') {
      return {
        data: [],
        pagination: {
          total: 0,
          offset: options.offset,
          limit: options.limit,
          hasMore: false,
        },
      };
    }
    
    // Transform response to our standard format
    const tokenTransfers = data.result.map(tx => ({
      tokenAddress: tx.contractAddress,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      tokenSymbol: tx.tokenSymbol,
      tokenName: tx.tokenName,
      tokenDecimal: parseInt(tx.tokenDecimal, 10),
      transactionHash: tx.hash,
    }));
    
    return {
      data: tokenTransfers,
      pagination: {
        total: tokenTransfers.length,
        offset: options.offset,
        limit: options.limit,
        hasMore: tokenTransfers.length >= options.limit,
      },
    };
  }
  
  private async _getPolygonTokenTransfers(
    address: string,
    chainId: number,
    options: Required<HistoryOptions>
  ): Promise<PaginationResult<TokenTransfer>> {
    // Use the same etherscan-compatible API
    return this._getEtherscanTokenTransfers(address, chainId, options);
  }
  
  private async _getBscTokenTransfers(
    address: string,
    chainId: number,
    options: Required<HistoryOptions>
  ): Promise<PaginationResult<TokenTransfer>> {
    // Use the same etherscan-compatible API
    return this._getEtherscanTokenTransfers(address, chainId, options);
  }
  
  private async _getCovalentTokenTransfers(
    address: string,
    chainId: number,
    options: Required<HistoryOptions>
  ): Promise<PaginationResult<TokenTransfer>> {
    const apiKey = this.apiConfig.covalent?.apiKey;
    
    if (!apiKey) {
      throw new Error('Covalent API key not configured');
    }
    
    const covalentChainId = this._getCovalentChainId(chainId);
    const baseUrl = this.apiConfig.covalent?.baseUrl || 'https://api.covalenthq.com/v1';
    
    // Build API URL
    const apiUrl = new URL(`${baseUrl}/${covalentChainId}/address/${address}/transfers_v2/`);
    apiUrl.searchParams.append('key', apiKey);
    apiUrl.searchParams.append('page-number', Math.floor(options.offset / options.limit + 1).toString());
    apiUrl.searchParams.append('page-size', options.limit.toString());
    
    if (options.fromBlock > 0) {
      apiUrl.searchParams.append('starting-block', options.fromBlock.toString());
    }
    
    if (options.toBlock !== 'latest') {
      apiUrl.searchParams.append('ending-block', options.toBlock.toString());
    }
    
    // Fetch data from API
    const response = await fetch(apiUrl.toString());
    
    if (!response.ok) {
      throw new Error(`Covalent API error: ${response.status} ${response.statusText}`);
    }
    
    const data = await response.json();
    
    if (!data.data) {
      throw new Error('Invalid response from Covalent API');
    }
    
    // Transform response to our standard format
    const tokenTransfers = data.data.items
      .filter(item => item.transfers && item.transfers.length > 0)
      .flatMap(item => 
        item.transfers.map(transfer => ({
          tokenAddress: transfer.contract_address,
          from: transfer.from_address,
          to: transfer.to_address,
          value: transfer.delta,
          tokenSymbol: transfer.contract_ticker_symbol,
          tokenName: transfer.contract_name,
          tokenDecimal: transfer.contract_decimals,
          transactionHash: item.tx_hash,
        }))
      );
    
    return {
      data: tokenTransfers,
      pagination: {
        total: data.data.pagination.total_count,
        offset: options.offset,
        limit: options.limit,
        hasMore: data.data.pagination.has_more,
      },
    };
  }
  
  // Helper methods
  private _getExplorerApiUrl(chainId: number, explorer: 'etherscan' | 'blockscout'): string {
    switch (chainId) {
      // Ethereum
      case 1:
        return 'https://api.etherscan.io';
      case 3: // Ropsten
        return 'https://api-ropsten.etherscan.io';
      case 4: // Rinkeby
        return 'https://api-rinkeby.etherscan.io';
      case 5: // Goerli
        return 'https://api-goerli.etherscan.io';
      case 42: // Kovan
        return 'https://api-kovan.etherscan.io';
        
      // Polygon
      case 137:
        return 'https://api.polygonscan.com';
      case 80001: // Mumbai
        return 'https://api-testnet.polygonscan.com';
        
      // BSC
      case 56:
        return 'https://api.bscscan.com';
      case 97: // BSC Testnet
        return 'https://api-testnet.bscscan.com';
        
      // Avalanche
      case 43114:
        return 'https://api.snowtrace.io';
      case 43113: // Fuji Testnet
        return 'https://api-testnet.snowtrace.io';
        
      // Optimism
      case 10:
        return 'https://api-optimistic.etherscan.io';
      case 69: // Optimism Kovan
        return 'https://api-kovan-optimistic.etherscan.io';
        
      // Arbitrum
      case 42161:
        return 'https://api.arbiscan.io';
      case 421611: // Arbitrum Rinkeby
        return 'https://api-testnet.arbiscan.io';
        
      default:
        throw new Error(`Unsupported chain ID: ${chainId} for ${explorer} API`);
    }
  }
  
  private _getEtherscanApiKey(chainId: number): string {
    // Use configured API key or empty string (rate limited)
    return this.apiConfig.etherscan?.apiKey || '';
  }
  
  private _getCovalentChainId(chainId: number): string {
    // Map EVM chain IDs to Covalent chain IDs
    switch (chainId) {
      case 1: return '1'; // Ethereum
      case 137: return '137'; // Polygon
      case 56: return '56'; // BSC
      case 43114: return '43114'; // Avalanche
      case 10: return '10'; // Optimism
      case 42161: return '42161'; // Arbitrum
      case 250: return '250'; // Fantom
      case 100: return '100'; // xDAI/Gnosis
      case 80001: return '80001'; // Polygon Mumbai
      case 97: return '97'; // BSC Testnet
      case 43113: return '43113'; // Avalanche Fuji
      case 5: return '5'; // Goerli
      case 4: return '4'; // Rinkeby
      case 3: return '3'; // Ropsten
      case 42: return '42'; // Kovan
      default:
        throw new Error(`Unsupported chain ID for Covalent: ${chainId}`);
    }
  }
  
  private _normalizeEtherscanTransaction(tx: any): TransactionData {
    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      gasPrice: tx.gasPrice,
      gasUsed: tx.gasUsed,
      blockNumber: parseInt(tx.blockNumber, 10),
      timestamp: parseInt(tx.timeStamp, 10),
      status: tx.isError === '0' ? 1 : 0,
      isError: tx.isError !== '0',
      nonce: parseInt(tx.nonce, 10),
      input: tx.input,
      tokenTransfers: [],
      fee: ethers.utils.formatEther(
        ethers.BigNumber.from(tx.gasPrice).mul(ethers.BigNumber.from(tx.gasUsed))
      ),
    };
  }
  
  private _normalizeCovalentTransaction(tx: any, userAddress: string): TransactionData {
    // Extract token transfers from log events
    const tokenTransfers = tx.log_events
      ? tx.log_events
          .filter(log => this._isERC20Transfer(log) || this._isERC721Transfer(log))
          .map(log => this._parseTokenTransferFromLog(log, tx.tx_hash))
      : [];
    
    return {
      hash: tx.tx_hash,
      from: tx.from_address,
      to: tx.to_address,
      value: tx.value,
      gasPrice: tx.gas_price.toString(),
      gasUsed: tx.gas_spent.toString(),
      blockNumber: tx.block_height,
      timestamp: Math.floor(new Date(tx.block_signed_at).getTime() / 1000),
      status: tx.successful ? 1 : 0,
      isError: !tx.successful,
      nonce: tx.nonce,
      input: tx.input,
      tokenTransfers,
      fee: tx.fees_paid,
    };
  }
  
  private async _enrichWithTokenTransfers(
    transactions: TransactionData[],
    address: string,
    chainId: number
  ): Promise<void> {
    try {
      // Get all token transfers for this address
      const tokenTransfersResult = await this.getTokenTransfers(address, chainId, {
        limit: 1000, // Get a large batch of token transfers
      });
      
      const tokenTransfersMap = new Map<string, TokenTransfer[]>();
      
      // Group token transfers by transaction hash
      for (const transfer of tokenTransfersResult.data) {
        if (!tokenTransfersMap.has(transfer.transactionHash)) {
          tokenTransfersMap.set(transfer.transactionHash, []);
        }
        tokenTransfersMap.get(transfer.transactionHash).push(transfer);
      }
      
      // Add token transfers to transactions
      for (const tx of transactions) {
        if (tokenTransfersMap.has(tx.hash)) {
          tx.tokenTransfers = tokenTransfersMap.get(tx.hash);
        }
      }
    } catch (error) {
      this.logger.warn(`Failed to enrich transactions with token transfers: ${error.message}`);
      // Continue without token transfers
    }
  }
  
  private _isERC20Transfer(log: any): boolean {
    // Check if log event is an ERC20 Transfer event
    return (
      log.decoded?.name === 'Transfer' &&
      log.decoded?.params?.length === 3 &&
      log.decoded?.params?.[0]?.name === 'from' &&
      log.decoded?.params?.[1]?.name === 'to' &&
      log.decoded?.params?.[2]?.name === 'value'
    );
  }
  
  private _isERC721Transfer(log: any): boolean {
    // Check if log event is an ERC721 Transfer event
    return (
      log.decoded?.name === 'Transfer' &&
      log.decoded?.params?.length === 3 &&
      log.decoded?.params?.[0]?.name === 'from' &&
      log.decoded?.params?.[1]?.name === 'to' &&
      log.decoded?.params?.[2]?.name === 'tokenId'
    );
  }
  
  private _parseTokenTransferFromLog(log: any, txHash: string): TokenTransfer {
    const params = log.decoded?.params || [];
    const fromParam = params.find(p => p.name === 'from');
    const toParam = params.find(p => p.name === 'to');
    const valueParam = params.find(p => p.name === 'value') || params.find(p => p.name === 'tokenId');
    
    return {
      tokenAddress: log.sender_address,
      from: fromParam?.value || '',
      to: toParam?.value || '',
      value: valueParam?.value || '0',
      tokenSymbol: log.sender_contract_ticker_symbol,
      tokenName: log.sender_name,
      tokenDecimal: log.sender_contract_decimals,
      transactionHash: txHash,
    };
  }
}

/**
 * Base class for HotWallet errors
 */
export class HotWalletError extends Error {
  public code: string;

  constructor(message: string, code: string) {
    super(message);
    this.code = code;
    this.name = this.constructor.name;
    // Capturing stack trace, excluding constructor call from it
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Error related to NFT operations
 */
export class NFTError extends HotWalletError {
  public network: string;
  public method: string;
  public contractAddress?: string;

  constructor(
    message: string,
    network: string,
    method: string,
    contractAddress?: string
  ) {
    super(`NFT Error [${network}] [${method}]: ${message}`, 'NFT_ERROR');
    this.network = network;
    this.method = method;
    this.contractAddress = contractAddress;
  }
}

/**
 * Error related to transactions
 */
export class TransactionError extends HotWalletError {
  public network?: string;
  public transaction?: any;
  public details?: any;

  constructor(
    message: string,
    network?: string,
    transaction?: any,
    details?: any
  ) {
    super(`Transaction Error${network ? ` [${network}]` : ''}: ${message}`, 'TRANSACTION_ERROR');
    this.network = network;
    this.transaction = transaction;
    this.details = details;
  }
}

/**
 * Error for insufficient balance
 */
export class InsufficientBalanceError extends TransactionError {
  public address: string;
  public required: string;
  public available: string;
  public type: 'gas' | 'token' | 'native';

  constructor(
    network: string,
    address: string,
    required: string,
    available: string,
    type: 'gas' | 'token' | 'native' = 'native'
  ) {
    super(
      `Insufficient ${type} balance for address ${address}: required ${required}, available ${available}`,
      network
    );
    this.address = address;
    this.required = required;
    this.available = available;
    this.type = type;
    this.code = 'INSUFFICIENT_BALANCE';
  }
}

/**
 * Error for transaction simulation failures
 */
export class SimulationError extends TransactionError {
  constructor(
    message: string,
    network: string,
    simulationResult: any,
    transaction?: any
  ) {
    super(message, network, transaction, simulationResult);
    this.code = 'SIMULATION_ERROR';
  }
}

/**
 * Error for rate limiting issues
 */
export class RateLimitError extends HotWalletError {
  public service: string;
  public retryAfter?: number;

  constructor(service: string, retryAfter?: number) {
    super(`Rate limit exceeded for ${service}`, 'RATE_LIMIT');
    this.service = service;
    this.retryAfter = retryAfter;
  }
}

/**
 * Error for encryption/decryption issues
 */
export class EncryptionError extends HotWalletError {
  constructor(message: string) {
    super(message, 'ENCRYPTION_ERROR');
  }
}

/**
 * Error for wallet operations
 */
export class WalletError extends HotWalletError {
  constructor(message: string) {
    super(message, 'WALLET_ERROR');
  }
}

/**
 * Error for network connectivity issues
 */
export class NetworkError extends HotWalletError {
  public url?: string;
  public network?: string;
  public statusCode?: number;

  constructor(message: string, network?: string, url?: string, statusCode?: number) {
    super(message, 'NETWORK_ERROR');
    this.network = network;
    this.url = url;
    this.statusCode = statusCode;
  }
}

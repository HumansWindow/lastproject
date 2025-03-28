# Hot Wallet Documentation

## Overview
The HotWallet module provides a comprehensive solution for blockchain wallet management, with support for multiple chains including Ethereum, Binance Smart Chain, Polygon, and Solana.

## Features
- Multi-chain support (ETH, BNB, MATIC, SOL, BTC)
- Wallet creation and import from mnemonics
- Balance checking for native currencies and tokens
- Transaction sending with optimized gas fees
- Transaction simulation before sending
- NFT support (transfers and queries)
- Transaction history tracking
- Balance change monitoring
- Comprehensive error handling

## File Structure

```
hotwallet/
├── index.ts                  # Main entry point with HotWallet class
├── WalletManager.ts          # Handles wallet creation, import, and storage
├── handlers/
│   └── ChainHandlers.ts      # Blockchain-specific implementations
├── services/
│   ├── BalanceService.ts     # Balance checking for native tokens and ERC20
│   ├── GasService.ts         # Gas price optimization and estimation
│   ├── HistoryService.ts     # Transaction history and pending tx tracking
│   ├── MonitoringService.ts  # Real-time balance and events monitoring
│   └── NFTService.ts         # NFT operations (metadata, transfers)
├── utils/
│   ├── circuitBreaker.ts     # Prevents cascading failures with providers
│   ├── encryption.ts         # Private key encryption/decryption
│   ├── errors.ts             # Custom error types for better error handling
│   └── rateLimiter.ts        # Controls API call rates to prevent rate limiting
├── middleware/
│   └── auth.middleware.ts    # Authentication for wallet operations
└── tests/
    └── hotwallet.spec.ts     # Comprehensive test suite
```

## Key Components

### index.ts
The main HotWallet class that orchestrates all functionality and provides a unified API for all blockchain operations.

### WalletManager.ts
Manages wallet lifecycle including:
- Generating new wallets with mnemonics
- Importing wallets from seed phrases
- Securely storing private keys with encryption
- Managing derivation paths for different chains

### ChainHandlers.ts
Implements blockchain-specific logic for:
- ETH, BNB, MATIC (EVM chains)
- SOL (Solana)
- BTC (Bitcoin)
Each handler provides methods for wallet creation, balance checking, transaction simulation, and more.

### Services

#### BalanceService
- Retrieves native token balances
- Gets ERC20/BEP20 token balances
- Supports Solana SPL token balances

#### GasService
- Optimizes gas prices on EVM chains
- Supports EIP-1559 dynamic fee transactions
- Offers priority levels (slow, average, fast)

#### HistoryService
- Retrieves transaction history
- Tracks pending transactions
- Supports filtering by transaction type

#### MonitoringService
- Monitors balance changes in real-time
- Detects new transactions
- Watches NFT transfers
- Provides webhooks for events

#### NFTService
- Fetches NFT metadata
- Checks NFT ownership
- Transfers NFTs (ERC721 & ERC1155)
- Supports batch transfers

### Utilities

#### encryption.ts
Provides secure encryption for private keys with:
- AES-256-CBC encryption
- Secure memory wiping
- Key rotation capabilities

#### errors.ts
Custom error types for better error handling:
- `InsufficientBalanceError` - When wallet lacks funds
- `SimulationError` - When transaction simulation fails
- `TransactionError` - For general transaction failures

#### circuitBreaker.ts
Prevents cascading failures when RPC providers have issues:
- Detects failing endpoints
- Automatically switches to healthy endpoints
- Implements exponential backoff

#### rateLimiter.ts
Controls API call rates:
- Prevents rate limiting by blockchain providers
- Queues requests when limits are reached
- Prioritizes critical operations

## Installation
The HotWallet module is integrated with NestJS. To use it, import the HotWalletModule into your application module:

```typescript
import { Module } from '@nestjs/common';
import { HotWalletModule } from './blockchain/hot-wallet.module';

@Module({
  imports: [HotWalletModule],
})
export class AppModule {}
```

## Configuration
The HotWallet requires the following environment variables:
- ETH_RPC_URL: Ethereum RPC URL
- BNB_RPC_URL: Binance Smart Chain RPC URL
- SOL_RPC_URL: Solana RPC URL
- MATIC_RPC_URL: Polygon RPC URL
- WALLET_ENCRYPTION_KEY: Key used for encrypting private keys

## Usage Examples

### Importing a Wallet
```typescript
import { Injectable } from '@nestjs/common';
import { HotWallet } from './blockchain/hotwallet';

@Injectable()
export class WalletService {
  constructor(@Inject(HOTWALLET_TOKEN) private hotWallet: HotWallet) {}

  async importWallet(mnemonic: string, network: string) {
    return this.hotWallet.importWallet(mnemonic, network);
  }
}
```

### Sending a Transaction
```typescript
async sendTransaction(from: string, to: string, amount: string, network: string) {
  // First simulate the transaction
  const simulation = await this.hotWallet.simulateTransaction({
    network,
    from,
    to,
    amount
  });

  if (!simulation.success) {
    throw new Error(`Transaction simulation failed: ${simulation.errors?.message}`);
  }

  // Send the actual transaction
  return this.hotWallet.sendTransaction({
    network,
    from,
    to,
    amount
  });
}
```

### Monitoring Balance Changes
```typescript
monitorWallet(address: string, network: string) {
  this.hotWallet.monitorAddress(network, address, {
    trackBalance: true,
    tokens: ['ETH_USDT', 'MATIC_USDC']
  });

  this.hotWallet.on('balanceChange', (data) => {
    console.log(`Balance changed for ${data.address} on ${data.network}`);
    console.log(`Previous: ${data.previousBalance}, New: ${data.newBalance}`);
  });
}
```

### Transferring NFTs
```typescript
async transferNFT(params: {
  network: string;
  contractAddress: string;
  tokenId: string;
  from: string;
  to: string;
}) {
  return this.hotWallet.transferNFT(params);
}
```

### Getting Transaction History
```typescript
async getTransactionHistory(address: string, network: string) {
  return this.hotWallet.getTransactionHistory(network, address, {
    includeTokenTransfers: true,
    includeNFTTransfers: true
  });
}
```

## Security Considerations

### Mnemonic Handling
- Mnemonics should only be used once for importing wallets
- Never store mnemonics in plain text in databases
- Use encryption for any temporary mnemonic storage

### Private Key Security
- All private keys are encrypted at rest
- Memory is securely wiped after operations involving keys
- Consider using a HSM for production environments with significant funds

### Recommended Practices
1. Use a separate hot wallet with limited funds for daily operations
2. Keep most funds in cold storage
3. Implement multi-factor authentication for sensitive operations
4. Regularly rotate encryption keys
5. Enable transaction simulation before sending to catch potential issues

## Error Handling
The HotWallet module provides comprehensive error types for better error handling:

```typescript
try {
  await hotWallet.sendTransaction(/* ... */);
} catch (error) {
  if (error instanceof InsufficientBalanceError) {
    console.log(`Insufficient balance: required ${error.required}, available ${error.available}`);
  } else if (error instanceof SimulationError) {
    console.log(`Simulation failed: ${error.message}`);
  } else if (error instanceof TransactionError) {
    console.log(`Transaction failed: ${error.message}`);
  }
}
```
# Security Analysis of the Hot Wallet Implementation

Your hot wallet implementation is well-structured but could benefit from additional security measures. Here's an analysis of the current security state and recommendations for improvement without changing any files.

## Current Security Implementation

### Strengths:
1. **Encryption at Rest**: Private keys are encrypted before being stored in memory
2. **Memory Wiping**: Sensitive data is securely wiped from memory after use
3. **Circuit Breaker Pattern**: Prevents cascading failures and handles provider errors
4. **Transaction Simulation**: Transactions are simulated before sending to catch issues
5. **Test Environment Protection**: Special handling in test environments to prevent real blockchain interactions

### Areas for Enhancement:

#### Seed Phrase (Mnemonic) Handling
- Currently, mnemonics are stored in plaintext in some cases
- The 12-word seed phrase standard (BIP39) is industry standard but additional precautions are needed

## Alternative Key Management Approaches

### 1. Hardware Security Module (HSM) Integration
- Integrate with cloud HSMs like AWS KMS, Google Cloud KMS, or Azure Key Vault
- Physical HSMs like YubiKey or Ledger for organizational wallets
- This keeps private keys completely off your servers

### 2. Multi-factor Authentication (MFA)
- Require MFA for all sensitive wallet operations
- Implement time-based one-time passwords (TOTP)
- SMS verification as a second factor (though less secure than other methods)

### 3. Multi-signature Wallets
- Implement m-of-n signature requirements for high-value transactions
- Example: 2-of-3 signatures where different team members hold keys

### 4. Shamir's Secret Sharing
- Split private keys or seed phrases into multiple "shards"
- Require a threshold number of shards to reconstitute the key
- Distribute shards across different secure locations/individuals

### 5. Hierarchical Deterministic (HD) Wallets with Enhanced Security
- Use deeper derivation paths beyond standard paths
- Implement BIP38 password encryption for private keys
- Consider BIP44 multi-account hierarchy with separate accounts for different risk profiles

## Recommended Security Improvements

### 1. Secure Mnemonic Handling
- Never persist mnemonics to disk or databases
- Use mnemonic only transiently during wallet import
- Implement a time-limited session for mnemonic usage
- Consider encrypting the mnemonic itself with a user-provided password

### 2. Network Security
- Implement API rate limiting
- Use SSL pinning for mobile applications
- Add IP whitelisting for admin operations
- Implement DDoS protection

### 3. Process Isolation
- Run key operations in separate processes
- Use secure enclaves if available on your infrastructure
- Consider Docker containers with restricted permissions

### 4. Auditing and Monitoring
- Implement comprehensive logging for all wallet operations
- Set up anomaly detection for unusual transaction patterns
- Use blockchain analytics services to monitor transaction flows

### 5. Operational Security
- Implement key rotation policies
- Add spending limits per time period
- Create tiered wallet architecture (hot/warm/cold)
- Develop clear key recovery procedures

## Production Best Practices

1. **Minimize Hot Wallet Funds**: Keep only the minimum required amount in hot wallets
2. **Regular Security Audits**: Have your system professionally audited
3. **Backup Strategy**: Implement secure, encrypted backups stored in multiple locations
4. **Incident Response Plan**: Create a plan for security breaches
5. **Training**: Ensure all team members understand security protocols

By implementing these additional security measures, you can significantly enhance the security posture of your hot wallet system without completely redesigning the current architecture.
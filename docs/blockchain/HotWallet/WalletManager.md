# Wallet Manager Technical Documentation

## Overview

The `WalletManager` is the core component of our HotWallet system responsible for securely managing cryptographic keys, signing transactions, and handling wallet operations. It provides a secure interface for the application to interact with blockchain networks.

## Architecture

The `WalletManager` follows a singleton pattern and acts as a centralized service for all wallet-related operations. It integrates with several other services and utilities to provide comprehensive wallet functionality:

```
┌─────────────────────────┐
│      WalletManager      │
└───────────┬─────────────┘
            │
  ┌─────────┼─────────────────────┐
  │         │                     │
┌─┴───────────┐  ┌───────────┐  ┌─┴────────────┐
│ Encryption  │  │  Services │  │Circuit Breaker│
└─────────────┘  └─────┬─────┘  └──────────────┘
                       │
          ┌────────────┴───────────────┐
          │            │               │
┌─────────┴────┐ ┌─────┴────┐  ┌──────┴────────┐
│Transaction   │ │   NFT    │  │      Gas      │
│  Service     │ │ Service  │  │    Service    │
└──────────────┘ └──────────┘  └───────────────┘
```

## Key Features

### Wallet Creation and Management

- Creates and manages HD wallets (Hierarchical Deterministic)
- Supports multiple accounts within a single wallet
- Implements BIP-39 mnemonic phrases for recovery
- Securely stores encrypted keystore files

### Transaction Signing

- Signs transactions for multiple blockchain networks
- Supports EIP-1559 gas price estimation
- Implements transaction retry logic
- Maintains nonce management across sessions

### Security Mechanisms

- Encryption of private keys at rest
- Memory protection for sensitive data
- Rate limiting of authentication attempts
- Circuit breaker pattern to detect suspicious activities
- Access control through middleware

## Implementation Details

### Wallet Creation Process

1. Generate secure entropy source
2. Create HD wallet using BIP-39 specifications
3. Encrypt private keys with AES-256
4. Store encrypted keystore in secure storage
5. Associate wallet with user account

### Transaction Signing Process

1. Request transaction parameters from client
2. Validate parameters against allowed operations
3. Fetch current gas prices from `GasService`
4. Retrieve and decrypt private key
5. Sign transaction data
6. Submit to blockchain network
7. Monitor for confirmation
8. Record in transaction history

### Key Security

The `WalletManager` implements multiple layers of security:

1. **Keys at Rest**: All private keys are encrypted using AES-256 before being stored
2. **Keys in Use**: Private keys are only decrypted in memory when needed and promptly cleared
3. **Authentication**: Access requires proper authentication and authorization
4. **Circuit Breakers**: Unusual patterns trigger automatic shutdown of operations
5. **Rate Limiting**: Failed attempts are rate-limited to prevent brute force attacks

## Integration Points

### External Service Integration

- **Gas Price Oracles**: Integration with multiple gas price providers
- **RPC Providers**: Load-balanced connections to blockchain nodes
- **Transaction Monitoring**: Webhook notifications for transaction states

### Internal Service Integration

- **User Authentication**: Integration with main app authentication system
- **NFT Services**: Methods for NFT minting and transfers
- **SHAHI Token Operations**: Custom methods for token transfers and staking

## Error Handling

The `WalletManager` implements comprehensive error handling:

1. **Network Errors**: Retry logic with exponential backoff
2. **Security Violations**: Immediate termination and logging
3. **Transaction Failures**: Detailed error reporting with recovery options
4. **Nonce Management**: Automatic nonce correction on transaction conflicts

## Configuration Options

Key configuration options in the `WalletManager`:

| Option | Description | Default |
|--------|-------------|---------|
| `keyStorage` | Storage mechanism for encrypted keys | `filesystem` |
| `networkTimeout` | Timeout for network operations (ms) | `30000` |
| `maxRetries` | Maximum transaction retries | `3` |
| `gasBufferPercent` | Additional gas buffer percentage | `10` |
| `securityLevel` | Security policy strictness | `medium` |

## Usage Examples

### Creating a New Wallet

```typescript
// Example code for wallet creation
const walletManager = WalletManager.getInstance();
const newWallet = await walletManager.createWallet(userId, securityLevel);
// Returns wallet address but stores encrypted private key internally
```

### Signing a Transaction

```typescript
// Example code for transaction signing
const transaction = {
  to: recipientAddress,
  value: ethers.utils.parseEther("1.0"),
  data: "0x",
};
const signedTx = await walletManager.signTransaction(
  userId, 
  walletAddress,
  transaction
);
```

## Monitoring and Logging

The `WalletManager` includes comprehensive logging and monitoring:

- **Performance Metrics**: Tracking of operation timing
- **Security Events**: Logging of potential security issues
- **Transaction Logs**: Complete history of transactions
- **Error Tracking**: Detailed error logs with context

## Best Practices

When working with the `WalletManager`:

1. Always validate input parameters before passing to wallet methods
2. Implement proper error handling for all wallet operations
3. Use the circuit breaker pattern to detect abnormal behavior
4. Never store unencrypted private keys
5. Implement proper access control for all wallet operations
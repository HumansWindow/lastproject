# HotWallet System Documentation

## Overview

The HotWallet system is a critical component of our blockchain infrastructure that manages secure cryptographic operations for the application. It handles wallet creation, transaction signing, and secure key management while implementing multiple layers of security to protect user assets.

## Directory Structure

```
/blockchain/hotwallet/
├── cli-tools.mjs             # Command line tools for wallet management
├── config.js                 # Configuration settings for the wallet system
├── config/
│   └── marketplaceConfig.ts  # NFT marketplace specific configurations
├── handlers/
│   └── ChainHandlers.ts      # Handlers for different blockchain networks
├── index.ts                  # Main entry point for the HotWallet system
├── middleware/
│   └── auth.middleware.ts    # Authentication middleware for wallet operations
├── package.json              # Dependencies and scripts
├── services/
│   ├── GasService.ts             # Gas price estimation and management
│   ├── MarketplaceWebhookService.ts  # Webhook handlers for marketplace events
│   ├── NFTService.ts              # NFT-related operations
│   ├── RPCLoadBalancer.ts         # Load balancing for RPC connections
│   ├── TransactionHistoryService.ts  # Transaction history tracking
│   └── TransactionService.ts      # Core transaction processing service
├── setup.sh                  # Setup script for initializing the wallet system
├── types/
│   └── api-config.ts         # TypeScript types for API configuration
├── utils/
│   ├── circuitBreaker.ts     # Circuit breaker pattern implementation
│   ├── encryption.ts         # Encryption utilities for key management
│   ├── errors.ts             # Custom error definitions
│   └── rateLimiter.ts        # Rate limiting for API requests
└── WalletManager.ts          # Core wallet management functionality
```

## Key Components

### WalletManager

The `WalletManager.ts` is the core component that handles wallet operations including:

- Wallet creation and management
- Transaction signing
- Key encryption and decryption
- Security policy enforcement
- Connection to blockchain networks

### Security Features

The HotWallet implements multiple layers of security:

1. **Encryption** (`utils/encryption.ts`): Handles the encryption and decryption of private keys
2. **Rate Limiting** (`utils/rateLimiter.ts`): Prevents brute-force attacks
3. **Circuit Breaker** (`utils/circuitBreaker.ts`): Automatically stops operations if suspicious activity is detected
4. **Authentication Middleware** (`middleware/auth.middleware.ts`): Validates access to wallet functions

### Services

1. **TransactionService**: Core service for creating, signing, and sending blockchain transactions
2. **NFTService**: Handles NFT-specific operations like minting, transfers, and metadata
3. **GasService**: Optimizes gas costs for transactions
4. **RPCLoadBalancer**: Distributes RPC calls across multiple providers for reliability
5. **TransactionHistoryService**: Tracks and stores transaction history
6. **MarketplaceWebhookService**: Integrates with NFT marketplace events

## Configuration

The wallet system is configured through:

- `config.js`: Main configuration file
- `config/marketplaceConfig.ts`: Settings specific to the NFT marketplace
- Environment variables (defined in deployment environments)

## Usage

### Initializing the HotWallet

The HotWallet system is initialized during application startup through the main `index.ts` file. It:

1. Loads configurations
2. Establishes connections to blockchain networks
3. Initializes security measures
4. Performs sanity checks on the system

### Common Operations

- Creating a new wallet
- Signing transactions
- Sending SHAHI tokens
- Interacting with NFT contracts
- Recording transaction history

## Security Considerations

The HotWallet system is designed with security as a top priority:

- No private keys are stored in plaintext
- Access is strictly controlled through authentication
- Circuit breakers detect and prevent abnormal behavior
- Rate limiting prevents brute-force attacks
- Strict validation of all inputs and parameters

## Integration Points

The HotWallet system integrates with:

- The main application backend
- Blockchain networks
- NFT Marketplace contract
- SHAHI token contract

## Deployment Notes

The HotWallet component requires special security considerations during deployment:

- Secure environment variables
- Network isolation
- Regular security audits
- Key rotation policies
- Monitoring and alerting systems
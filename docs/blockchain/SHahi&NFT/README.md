# Smart Contracts Documentation

## Overview

This section documents the smart contracts that power the SHAHI ecosystem, including the SHAHI token (ERC-20) and NFT contracts (ERC-721). These contracts form the foundation of our blockchain infrastructure and provide the core functionality for digital asset management within the platform.

## Contract Architecture

```
┌───────────────────┐
│    SHAHICoinV1    │
│     (ERC-20)      │
└─────────┬─────────┘
          │
          │ inherits
          ▼
┌───────────────────┐         ┌───────────────────┐
│   SHAHIStorage    │         │       NFT         │
│  (State Storage)  │         │     (ERC-721)     │
└───────────────────┘         └─────────┬─────────┘
                                        │
                                        │ interacts with
                                        ▼
                              ┌───────────────────┐
                              │    Marketplace    │
                              │    (Exchange)     │
                              └───────────────────┘
```

## Directory Structure

```
/blockchain/contracts/
├── SHAHICoin.sol           # Main SHAHI token implementation (ERC-20)
├── SHAHIStorage.sol        # Storage contract for SHAHI token state
├── NFT.sol                 # NFT implementation (ERC-721)
├── Marketplace.sol         # NFT marketplace for trading assets
├── deploy-recompile.sh     # Deployment script with recompilation
├── hardhat.config.js       # Hardhat configuration
├── package.json            # Dependencies and scripts
├── shahi-token.abi.json    # ABI for SHAHI token contract
├── abis/                   # Generated contract ABIs
│   └── SHAHICoin.ts        # TypeScript bindings for SHAHI contract
├── deploy/                 # Deployment scripts and configurations
│   ├── contract-addresses.json  # Deployed contract addresses
│   ├── verify-contracts.js      # Script to verify contracts on block explorers
│   └── bridge-config.js         # Configuration for cross-chain bridges
└── scripts/                # Utility scripts
    └── deploy.js           # Main deployment script
```

## Key Smart Contracts

### 1. SHAHICoin (ERC-20)

The `SHAHICoin.sol` contract implements our ERC-20 token with advanced features:

- Upgradeable using UUPS proxy pattern
- Website-based minting mechanism
- Staking system with tiered rewards
- Token burning mechanism
- Time-locked tokens
- Access control system

### 2. SHAHIStorage

The `SHAHIStorage.sol` contract:

- Implements the storage pattern for state separation
- Enhances upgradability of the main contract
- Manages state variables for the SHAHI token

### 3. NFT (ERC-721)

The `NFT.sol` contract implements our NFT functionality:

- Standard ERC-721 methods with metadata extensions
- Minting mechanisms with access control
- Royalty support for creators
- Metadata URI management
- Series and collection support

### 4. Marketplace

The `Marketplace.sol` contract implements:

- NFT trading functionality
- Auction mechanisms
- Direct sales
- Fee collection system
- Integration with SHAHI token for payments

## Deployment Information

The smart contracts are deployed to multiple networks:

- Ethereum Mainnet
- Polygon (for lower fees and faster transactions)
- Binance Smart Chain (for wider accessibility)
- Testnet environments for development

Contract addresses and deployment details are maintained in the `deploy/contract-addresses.json` file.

## Interact with Smart Contracts

The contracts can be interacted with through:

1. Our application interface
2. Direct blockchain transactions
3. Block explorers
4. The HotWallet system

## Contract Upgrades

The SHAHI ecosystem uses the UUPS (Universal Upgradeable Proxy Standard) pattern for upgrades:

1. The proxy contract holds the state and delegates calls
2. Implementation contracts contain the logic
3. Upgrades replace implementation while preserving state

## Security Considerations

Our smart contracts implement multiple security measures:

- Reentrancy guards
- Access control
- Pausability for emergencies
- Circuit breakers
- Rate limiting for sensitive operations
- Formal verification and auditing
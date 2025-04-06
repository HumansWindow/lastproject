# SHAHI Coin Multi-Blockchain Deployment Guide

This repository contains the implementation and deployment scripts for SHAHI Coin across multiple EVM-compatible blockchains, including Polygon, Ethereum, BNB Chain, and Bitcoin (via RSK).

## Current Deployment Status

**Ready for immediate deployment:**
- ✅ Polygon (Mumbai testnet & Mainnet)
- ✅ Ethereum (Goerli testnet & Mainnet)
- ✅ BNB Chain (Testnet & Mainnet)

**Requires additional implementation:**
- ⏳ Bitcoin (via RSK) - Implementation guides provided in `bitcoin-integration.md`
- ⏳ Solana - Future implementation planned (see `phase2-networks.md`)
- ⏳ TON - Future implementation planned (see `phase2-networks.md`)

## Overview

SHAHI Coin is designed as a multi-chain token with primary minting on Polygon and cross-chain availability on Ethereum, BNB Chain, and Bitcoin. This architecture allows for:

- **Lower transaction costs** - Primary minting on Polygon for reduced gas fees
- **Wider accessibility** - Available on multiple blockchain ecosystems
- **Enhanced liquidity** - Liquidity pools across different DEXs and chains
- **Greater user choice** - Users can use their preferred blockchain

## Architecture

```
                    ┌─────────────────┐
                    │                 │
                    │    Polygon      │ ◄── Primary Minting Network
                    │  SHAHI Token    │
                    │                 │
                    └─────┬─────┬─────┘
                          │     │
                ┌─────────┘     └────────┐
                │                        │
                ▼                        ▼
     ┌─────────────────┐      ┌─────────────────┐
     │                 │      │                 │
     │    Ethereum     │      │    BNB Chain    │
     │  SHAHI Token    │      │  SHAHI Token    │
     │                 │      │                 │
     └────────┬────────┘      └────────┬────────┘
              │                        │
              └────────┐   ┌───────────┘
                       ▼   ▼
                ┌─────────────────┐
                │                 │
                │  Bitcoin (RSK)  │
                │  SHAHI Token    │
                │                 │
                └─────────────────┘
```

## Implementation

All SHAHI Coin implementations across different blockchains share:

- Same total supply
- Same token name and symbol 
- Same core functionality
- Unique contract addresses for each network
- Network-specific optimizations

## Prerequisites

1. Node.js (v14+ recommended)
2. NPM or Yarn
3. A wallet with:
   - ETH (for Ethereum deployments)
   - MATIC (for Polygon deployments)
   - BNB (for BNB Chain deployments)
   - RBTC (for RSK/Bitcoin deployments)
4. RPC endpoints for each network (via Infura, Alchemy, or direct nodes)
5. Block explorer API keys for contract verification:
   - Etherscan API key
   - Polygonscan API key
   - BscScan API key

## Setup

1. Clone the repository (if not already done)
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env` file from the template:
   ```
   cp .env.example .env
   ```
4. Fill in your `.env` file with:
   - Private key
   - RPC URLs
   - Block explorer API keys
   - Admin wallet address
   - Initial token supply

## Deployment Process

### Option 1: Deploy to a single network

Use the following commands to deploy to a specific network:

```bash
# Testnet deployments
npm run deploy:polygon:testnet
npm run deploy:ethereum:testnet
npm run deploy:bsc:testnet
npm run deploy:bitcoin:testnet  # Requires completing Bitcoin integration first

# Mainnet deployments
npm run deploy:polygon:mainnet
npm run deploy:ethereum:mainnet
npm run deploy:bsc:mainnet
npm run deploy:bitcoin:mainnet  # Requires completing Bitcoin integration first
```

### Option 2: Deploy to all networks at once

```bash
# Deploy to all testnets
npm run deploy:all:testnet

# Deploy to all mainnets
npm run deploy:all:mainnet
```

## Post-Deployment

After deploying the contracts, you'll need to:

1. **Update contract-addresses.json** - This should happen automatically during deployment
2. **Bridge tokens between networks** - Follow the guide in `bridge-config.js`
3. **Verify contracts** - Should happen automatically if API keys are provided
4. **Set up liquidity pools** - Add liquidity on various DEXs

## Contract Addresses

Contract addresses are stored in `deploy/contract-addresses.json` and are updated automatically after each successful deployment.

## Bridge Configuration

For detailed information on how to bridge tokens between different blockchains, refer to `deploy/bridge-config.js` which contains configurations for:

- Polygon PoS Bridge (Ethereum ↔ Polygon)
- Binance Bridge (Ethereum ↔ BNB Chain)
- Multichain Bridge (Polygon ↔ BNB Chain)
- RSK Token Bridge (Bitcoin/RSK ↔ Ethereum)
- Chainlink CCIP Bridge (Bitcoin/RSK ↔ Polygon)
- AllBridge (Bitcoin/RSK ↔ BNB Chain)

## Bitcoin Integration

Currently, Bitcoin integration via RSK is provided as a detailed implementation guide in `bitcoin-integration.md`, but requires additional implementation steps before deployment. You should complete the steps in this file before attempting to deploy to Bitcoin/RSK networks.

### How Bitcoin Integration Works

1. **RSK Sidechain**: RSK is a Bitcoin sidechain with EVM compatibility
2. **Two-Way Peg**: Uses a federated peg mechanism to secure assets between Bitcoin and RSK
3. **Merged Mining**: Secured by Bitcoin miners through merged mining
4. **RBTC**: Native token for gas payments (pegged 1:1 with BTC)

### Using SHAHI on Bitcoin

To use SHAHI on Bitcoin/RSK:

1. **RSK-compatible Wallet**: Use MetaMask or other wallets with RSK network support
2. **Network Configuration**:
   - Network Name: RSK Mainnet
   - RPC URL: https://public-node.rsk.co
   - Chain ID: 30
   - Symbol: RBTC
   - Block Explorer: https://explorer.rsk.co

### Bridging to Bitcoin

To bridge SHAHI tokens between Bitcoin (RSK) and other networks:

1. **Ethereum ↔ RSK**: Use RSK Token Bridge
2. **Polygon ↔ RSK**: Use Chainlink CCIP or other cross-chain bridges
3. **BNB Chain ↔ RSK**: Use AllBridge or similar cross-chain bridges

For detailed instructions on Bitcoin bridging, see the dedicated guide in `deploy/bitcoin-integration.md`.

## Development Environment

For development and testing purposes:

1. Use the testnets first:
   - Polygon Mumbai
   - Ethereum Goerli
   - BNB Chain Testnet
   - RSK Testnet
2. Test all features including minting and cross-chain transfers
3. Verify that bridges work correctly with test tokens

## Production Environment

For production deployment:

1. Use higher gas prices for faster confirmations
2. Deploy contracts in this order:
   1. Polygon Mainnet (primary minting network)
   2. Ethereum Mainnet
   3. BNB Chain Mainnet
   4. RSK Mainnet
3. Setup bridges and liquidity pools after all deployments

## Future Extensions

The architecture is designed to be extensible to other blockchains in the future:

- Phase 1: Polygon, Ethereum, BNB Chain (current implementation, ready to deploy)
- Phase 2: Bitcoin/RSK, Solana, TON (see `phase2-networks.md` for implementation details)

## Security Considerations

1. **Admin keys**: Store securely, consider multi-sig wallets for production
2. **Bridge security**: Carefully review bridge protocols before use
3. **Contract verification**: Always verify contracts on block explorers
4. **Testing**: Thoroughly test on testnets before mainnet deployment
5. **Bitcoin-specific**: Understand RSK federated peg security model

## Troubleshooting

- **Failed deployments**: Check gas price, network congestion, and account balance
- **Verification errors**: Ensure correct compiler versions and optimization settings
- **Bridge issues**: Review bridge documentation for specific requirements
- **RSK/Bitcoin issues**: Ensure you have sufficient RBTC for gas

## Reference

For more detailed information, refer to the following files:

- `deploy/DEPLOYMENT_GUIDE.md`: Step-by-step deployment instructions
- `deploy/bridge-config.js`: Cross-chain bridge configurations
- `deploy/bitcoin-integration.md`: Detailed Bitcoin integration guide (implementation required)
- `deploy/phase2-networks.md`: Future blockchain integration plans (implementation required)
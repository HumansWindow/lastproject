# SHAHI Coin Multi-Chain Deployment Guide

This guide explains how to deploy the SHAHI Coin token to multiple EVM-compatible blockchains: Polygon, Ethereum, and BNB Chain.

## Prerequisites

1. Node.js (v14+ recommended)
2. NPM or Yarn
3. Private key with sufficient funds for each network
4. RPC endpoints for each network (Infura, Alchemy, or your own nodes)
5. Block explorer API keys for contract verification

## Setup

1. **Create a .env file**

   Copy the `.env.example` file to `.env` and fill in your values:

   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

## Deployment Process

### Step 1: Deploy to Polygon (Primary Network)

Since we plan to mint on Polygon as our primary network, we'll deploy there first:

```bash
# Deploy to Polygon Mumbai (testnet)
npx hardhat run deploy/deploy-polygon.js --network mumbai

# Deploy to Polygon Mainnet (when ready)
npx hardhat run deploy/deploy-polygon.js --network polygon
```

After successful deployment, note down the contract address for future reference.

### Step 2: Deploy to Ethereum

```bash
# Deploy to Goerli (testnet)
npx hardhat run deploy/deploy-ethereum.js --network goerli

# Deploy to Ethereum Mainnet (when ready)
npx hardhat run deploy/deploy-ethereum.js --network mainnet
```

### Step 3: Deploy to BNB Chain

```bash
# Deploy to BNB Chain Testnet
npx hardhat run deploy/deploy-bsc.js --network bscTestnet

# Deploy to BNB Chain Mainnet (when ready)
npx hardhat run deploy/deploy-bsc.js --network bsc
```

## Post-Deployment

After deploying to all networks, you should:

1. **Record contract addresses** - Create a JSON file with all addresses for your frontend/backend integration
2. **Verify contract ownership** - Ensure each contract is owned by your admin wallet
3. **Set up admin roles** - Configure authorized minters, app contracts, etc. on each network
4. **Test minting and transfers** - Validate all functionality on each network

## Bridge Setup for Cross-Chain Functionality

To enable users to move SHAHI tokens between chains, you'll need to:

1. **Add liquidity to bridges** - Deposit SHAHI tokens to bridge contracts
2. **Update frontend** - Add UI components for cross-chain transfers
3. **Document the process** - Create user guides for bridging tokens

### Recommended Bridges

- **Ethereum ↔ Polygon**: Use the Polygon PoS Bridge
- **Ethereum ↔ BNB Chain**: Use Binance Bridge
- **Polygon ↔ BNB Chain**: Use Multichain Bridge

## Security Considerations

1. **Use multi-sig wallets** for contract ownership where possible
2. **Implement gradual token distribution** across bridges
3. **Monitor bridge liquidity** to ensure smooth cross-chain transfers
4. **Set up alerts** for large transactions and security events

## Future Networks (Phase 2)

For future deployment to networks like Solana and TON:

1. **Solana**: Will require a wrapped version of the token using SPL standard
2. **TON**: Will require separate implementation using TON-specific standards

## Technical Support

If you encounter issues during deployment:

1. Check hardhat logs for detailed error messages
2. Verify network RPC endpoints are functioning
3. Ensure your account has sufficient funds for deployment
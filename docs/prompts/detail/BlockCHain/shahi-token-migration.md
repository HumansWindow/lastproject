# SHAHI Token Migration Guide

This document provides a comprehensive guide for migrating the SHAHI token infrastructure and blockchain components to a new project.

## Overview

The SHAHI token ecosystem consists of several key components:

1. **Smart Contract (SHAHICoin.sol)**: The core ERC-20 token with additional functionality
2. **Hot Wallet Management**: Secure wallet infrastructure for managing token operations
3. **Minting Service**: Handles token distribution through multiple mechanisms
4. **Blockchain Service**: Manages interactions with different blockchain networks
5. **RPC Provider Service**: Ensures reliable connections to blockchain nodes

## Migration Checklist

### 1. Project Structure Setup

Create the following directory structure in your new project:

```
/src
  /blockchain
    /contracts        # Smart contract files
    /entities         # TypeORM entities for blockchain data
    /interfaces       # Type definitions
    /services         # Core blockchain services
      /hot-wallet     # Hot wallet management services
    /dto              # Data transfer objects
    /utils            # Blockchain utilities
```

### 2. Smart Contract Migration

#### SHAHICoin.sol Contract

1. Copy the SHAHICoin.sol file from:
   ```
   /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/contracts/SHAHICoin.sol
   ```
   to your new project's contracts directory.

2. Ensure all dependencies are properly referenced:
   ```
   npm install --save @openzeppelin/contracts-upgradeable @openzeppelin/contracts
   ```

3. If using Hardhat for deployment, set up the deployment scripts:
   ```
   npm install --save-dev hardhat @nomiclabs/hardhat-ethers @nomiclabs/hardhat-waffle
   ```

4. Update the contract address configuration in your environment files for each network:
   ```
   POLYGON_SHAHI_CONTRACT_ADDRESS=0x...
   ```

#### Compilation and Deployment

1. Set up contract compilation scripts:
   ```bash
   # Add to package.json
   "scripts": {
     "compile:contracts": "hardhat compile",
     "deploy:contracts:mumbai": "hardhat run scripts/deploy.js --network mumbai",
     "deploy:contracts:polygon": "hardhat run scripts/deploy.js --network polygon"
   }
   ```

2. Create a basic Hardhat configuration (hardhat.config.js):
   ```javascript
   require("@nomiclabs/hardhat-waffle");
   require('dotenv').config();

   module.exports = {
     solidity: {
       version: "0.8.17",
       settings: {
         optimizer: {
           enabled: true,
           runs: 200
         }
       }
     },
     networks: {
       mumbai: {
         url: process.env.MUMBAI_RPC_URL,
         accounts: [process.env.DEPLOYER_PRIVATE_KEY]
       },
       polygon: {
         url: process.env.POLYGON_RPC_URL,
         accounts: [process.env.DEPLOYER_PRIVATE_KEY]
       }
     }
   };
   ```

### 3. Hot Wallet Migration

The hot wallet module manages secure key storage and transaction signing.

1. Copy the entire hot wallet directory:
   ```bash
   cp -r /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/services/hot-wallet/* /path/to/new-project/src/blockchain/services/hot-wallet/
   ```

2. Key files to include:
   - `hot-wallet.service.ts`: Core service for wallet operations
   - `key-management.service.ts`: Secure key storage and encryption
   - `transaction.service.ts`: Transaction building and signing
   - Associated interfaces and types

3. Update environment configuration for wallet security:
   ```
   HOT_WALLET_ENCRYPTION_KEY=your_secure_encryption_key
   HOT_WALLET_ADDRESS=0x...
   ```

4. Ensure secure key storage:
   - Use environment variables for production
   - For development, store keys in a `.env` file (not committed to version control)
   - Consider using a secure vault service like HashiCorp Vault for production

### 4. Blockchain Services Migration

#### Core Services

1. Migrate the primary blockchain service:
   ```bash
   cp /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/blockchain.service.ts /path/to/new-project/src/blockchain/
   ```

2. Migrate the RPC provider service:
   ```bash
   cp /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/services/rpc-provider.service.ts /path/to/new-project/src/blockchain/services/
   ```

3. Migrate the minting service:
   ```bash
   cp /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/services/minting.service.ts /path/to/new-project/src/blockchain/services/
   ```

4. Migrate the SHAHI token service:
   ```bash
   cp /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/services/shahi-token.service.ts /path/to/new-project/src/blockchain/services/
   ```

5. Migrate the Merkle service:
   ```bash
   cp /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/services/merkle.service.ts /path/to/new-project/src/blockchain/services/
   ```

6. Migrate the queue service:
   ```bash
   cp /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/services/user-minting-queue.service.ts /path/to/new-project/src/blockchain/services/
   ```

#### Database Entities

Migrate the TypeORM entities:

```bash
cp /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/entities/minting-record.entity.ts /path/to/new-project/src/blockchain/entities/
cp /home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/entities/minting-queue.entity.ts /path/to/new-project/src/blockchain/entities/
```

### 5. Configuration Updates

Update your environment configuration in the new project:

```
# Blockchain Connection
ETHEREUM_RPC_URL=https://mainnet.infura.io/v3/your_infura_key
POLYGON_RPC_URL=https://polygon-rpc.com
POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com

# Fallback RPC Endpoints
POLYGON_FALLBACK_RPC_URLS=https://polygon-rpc.com,https://rpc-mainnet.matic.network,https://matic-mainnet.chainstacklabs.com
POLYGON_MUMBAI_FALLBACK_RPC_URLS=https://rpc-mumbai.maticvigil.com,https://matic-mumbai.chainstacklabs.com

# Contract Addresses
SHAHI_TOKEN_CONTRACT_ADDRESS=0x...
SHAHI_TOKEN_CONTRACT_ADDRESS_MUMBAI=0x...

# Hot Wallet
HOT_WALLET_ADDRESS=0x...
HOT_WALLET_ENCRYPTION_KEY=your_secure_encryption_key

# Minting Configuration
BATCH_MINTING_ENABLED=true
BATCH_MINTING_MAX_SIZE=10
BATCH_MINTING_INTERVAL_MS=300000
```

### 6. Module Configuration

Create a `blockchain.module.ts` file to organize all services:

```typescript
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';

// Services
import { BlockchainService } from './blockchain.service';
import { RpcProviderService } from './services/rpc-provider.service';
import { MintingService } from './services/minting.service';
import { ShahiTokenService } from './services/shahi-token.service';
import { MerkleService } from './services/merkle.service';
import { UserMintingQueueService } from './services/user-minting-queue.service';
import { HotWalletService } from './services/hot-wallet/hot-wallet.service';
import { KeyManagementService } from './services/hot-wallet/key-management.service';
import { TransactionService } from './services/hot-wallet/transaction.service';

// Entities
import { MintingRecord } from './entities/minting-record.entity';
import { MintingQueue } from './entities/minting-queue.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([MintingRecord, MintingQueue]),
    ConfigModule,
  ],
  providers: [
    {
      provide: 'BLOCKCHAIN_CONFIG',
      useFactory: (configService: ConfigService) => ({
        rpcUrls: {
          ethereum: configService.get<string>('ETHEREUM_RPC_URL'),
          polygon: configService.get<string>('POLYGON_RPC_URL'),
          mumbai: configService.get<string>('POLYGON_MUMBAI_RPC_URL'),
        },
        contractAddresses: {
          shahiToken: configService.get<string>('SHAHI_TOKEN_CONTRACT_ADDRESS'),
          shahiTokenMumbai: configService.get<string>('SHAHI_TOKEN_CONTRACT_ADDRESS_MUMBAI'),
        },
        hotWallet: {
          address: configService.get<string>('HOT_WALLET_ADDRESS'),
          encryptionKey: configService.get<string>('HOT_WALLET_ENCRYPTION_KEY'),
        },
      }),
      inject: [ConfigService],
    },
    BlockchainService,
    RpcProviderService,
    MintingService,
    ShahiTokenService,
    MerkleService,
    UserMintingQueueService,
    HotWalletService,
    KeyManagementService,
    TransactionService,
  ],
  exports: [
    BlockchainService,
    MintingService,
    ShahiTokenService,
    HotWalletService,
  ],
})
export class BlockchainModule {}
```

## Polygon Integration (Focusing on Polygon)

### Configuring Polygon as the Primary Network

1. In the `RpcProviderService`, prioritize Polygon RPC connections:

```typescript
// Update the getProvider method in RpcProviderService
async getProvider(network: 'ethereum' | 'polygon' | 'bsc' | 'solana' = 'polygon'): Promise<providers.JsonRpcProvider> {
  // Changed default from 'ethereum' to 'polygon'
  // ...rest of the method
}
```

2. Update the contract interaction methods to use Polygon by default:

```typescript
// Update in ShahiTokenService
async getMerkleRoot(): Promise<string> {
  return this.contractCall('polygon', async (contract) => {
    return contract.merkleRoot();
  });
}
```

### Polygon-Specific RPC Management

To optimize for Polygon:

1. Configure multiple Polygon RPC providers with health checks:

```typescript
// In RpcProviderService
private setupPolygonProviders() {
  const mainRpcUrl = this.configService.get<string>('POLYGON_RPC_URL');
  const fallbackUrls = this.configService.get<string>('POLYGON_FALLBACK_RPC_URLS').split(',');
  
  // Add main RPC
  this.providers.polygon.push({
    provider: new ethers.providers.JsonRpcProvider(mainRpcUrl),
    url: mainRpcUrl,
    isHealthy: true,
    lastResponseTime: 0
  });
  
  // Add fallbacks
  for (const url of fallbackUrls) {
    if (url && url !== mainRpcUrl) {
      this.providers.polygon.push({
        provider: new ethers.providers.JsonRpcProvider(url),
        url,
        isHealthy: true,
        lastResponseTime: 0
      });
    }
  }
  
  // Start health checks
  this.startHealthChecks();
}
```

2. Implement weighted routing based on performance:

```typescript
private getOptimalProvider(network: string): ethers.providers.JsonRpcProvider {
  if (!this.providers[network] || this.providers[network].length === 0) {
    throw new Error(`No providers configured for ${network}`);
  }
  
  // Sort by health and response time
  const sortedProviders = [...this.providers[network]]
    .filter(p => p.isHealthy)
    .sort((a, b) => a.lastResponseTime - b.lastResponseTime);
  
  if (sortedProviders.length === 0) {
    // If all are unhealthy, try the first one anyway
    return this.providers[network][0].provider;
  }
  
  return sortedProviders[0].provider;
}
```

### Gas Optimization for Polygon

Since Polygon has lower gas costs, optimize batch processing:

```typescript
// In MintingService - update batch size configuration
constructor(
  // ... other parameters
  private readonly configService: ConfigService,
) {
  // Larger batch size for Polygon
  this.batchMintMaxSize = this.configService.get('POLYGON_BATCH_MINT_MAX_SIZE') || 30;
  this.batchMintingIntervalMs = this.configService.get('POLYGON_BATCH_MINT_INTERVAL_MS') || 180000; // 3 minutes
}
```

### Polygon Contract Deployment

Instructions for deploying to Polygon Mumbai testnet and mainnet:

1. Create a deployment script (scripts/deploy.js):

```javascript
const { ethers, upgrades } = require("hardhat");

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log(`Deploying with account: ${deployer.address}`);

  // Deploy the implementation and proxy
  const SHAHICoin = await ethers.getContractFactory("SHAHICoinV1");
  const initialSupply = 10000000; // 10 million tokens
  const adminWallet = process.env.ADMIN_HOT_WALLET_ADDRESS;
  
  console.log("Deploying SHAHI token...");
  const shahiToken = await upgrades.deployProxy(SHAHICoin, [initialSupply, adminWallet], {
    initializer: "initialize",
  });
  
  await shahiToken.deployed();
  console.log(`SHAHI token deployed to: ${shahiToken.address}`);
  
  // Set up roles and initial configuration
  const merkleRoot = process.env.INITIAL_MERKLE_ROOT;
  if (merkleRoot) {
    await shahiToken.setMerkleRoot(merkleRoot);
    console.log(`Merkle root set to: ${merkleRoot}`);
  }
  
  // Add authorized minter (backend service)
  const backendServiceAddress = process.env.BACKEND_SERVICE_ADDRESS;
  if (backendServiceAddress) {
    await shahiToken.setAuthorizedMinterRole(backendServiceAddress, true);
    console.log(`Added authorized minter: ${backendServiceAddress}`);
  }
  
  console.log("Deployment complete!");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
```

2. Deploy to Mumbai testnet:

```bash
# Set environment variables
export MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com
export DEPLOYER_PRIVATE_KEY=your_private_key
export ADMIN_HOT_WALLET_ADDRESS=0x...
export BACKEND_SERVICE_ADDRESS=0x...

# Run deployment
npx hardhat run scripts/deploy.js --network mumbai
```

3. Deploy to Polygon mainnet:

```bash
# Set environment variables
export POLYGON_RPC_URL=https://polygon-rpc.com
export DEPLOYER_PRIVATE_KEY=your_private_key
export ADMIN_HOT_WALLET_ADDRESS=0x...
export BACKEND_SERVICE_ADDRESS=0x...

# Run deployment
npx hardhat run scripts/deploy.js --network polygon
```

### Development Environment Setup

For local development and testing:

1. Install required tools:
   ```bash
   npm install -g ganache-cli
   ```

2. Set up a local ganache instance that mimics Polygon:
   ```bash
   ganache-cli --chainId 137 --fork https://polygon-rpc.com
   ```

3. Configure environment for local development:
   ```
   POLYGON_RPC_URL=http://localhost:8545
   ```

## Testing and Verification

### Contract Verification

After deployment, verify the contract on Polygonscan:

```bash
# Install the verify plugin
npm install --save-dev @nomiclabs/hardhat-etherscan

# Add to hardhat.config.js
etherscan: {
  apiKey: {
    polygon: process.env.POLYGONSCAN_API_KEY,
    polygonMumbai: process.env.POLYGONSCAN_API_KEY
  }
}

# Verify the contract
npx hardhat verify --network polygon DEPLOYED_CONTRACT_ADDRESS
```

### Integration Testing

Set up integration tests for your Polygon deployment:

```typescript
// Create test-polygon-integration.ts
import { Test } from '@nestjs/testing';
import { MintingService } from './services/minting.service';
import { ShahiTokenService } from './services/shahi-token.service';
import { RpcProviderService } from './services/rpc-provider.service';

describe('Polygon Integration Tests', () => {
  let mintingService: MintingService;
  let shahiTokenService: ShahiTokenService;
  
  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [
        MintingService,
        ShahiTokenService,
        RpcProviderService,
        // Add mocks for dependencies
      ],
    }).compile();
    
    mintingService = moduleRef.get<MintingService>(MintingService);
    shahiTokenService = moduleRef.get<ShahiTokenService>(ShahiTokenService);
  });
  
  it('should connect to Polygon RPC', async () => {
    const blockNumber = await shahiTokenService.getBlockNumber();
    expect(blockNumber).toBeGreaterThan(0);
  });
  
  it('should verify contract methods', async () => {
    const merkleRoot = await shahiTokenService.getMerkleRoot();
    expect(merkleRoot).toBeDefined();
  });
  
  // Add more tests for minting, etc.
});
```

## Monitoring and Maintenance

### RPC Health Monitoring

Implement a health check endpoint to monitor RPC provider status:

```typescript
// In your controller
@Get('blockchain/health')
async getBlockchainHealth() {
  const status = await this.blockchainService.getRpcStatus();
  return {
    status: 'ok',
    providers: status
  };
}
```

### Transaction Monitoring

Set up monitoring for transaction status:

```typescript
// In ShahiTokenService
async monitorTransaction(txHash: string, maxRetries = 30): Promise<boolean> {
  let retries = 0;
  while (retries < maxRetries) {
    try {
      const receipt = await this.getProvider().getTransactionReceipt(txHash);
      if (receipt) {
        if (receipt.status === 1) {
          this.logger.log(`Transaction ${txHash} confirmed with ${receipt.confirmations} confirmations`);
          return true;
        } else {
          this.logger.error(`Transaction ${txHash} failed`);
          return false;
        }
      }
    } catch (error) {
      this.logger.warn(`Error checking transaction ${txHash}: ${error.message}`);
    }
    
    // Wait before retrying
    await new Promise(r => setTimeout(r, 5000));
    retries++;
  }
  
  this.logger.error(`Transaction ${txHash} not confirmed after ${maxRetries} retries`);
  return false;
}
```

## Migration Recommendations

1. **Use a Staged Approach**:
   - Deploy contract to testnet first
   - Test all functionality thoroughly
   - Deploy to mainnet only after successful testing

2. **Security Considerations**:
   - Store private keys securely (never in source code)
   - Use environment variables for sensitive information
   - Consider using a hardware wallet for contract deployment

3. **Performance Optimization**:
   - Use multiple RPC providers with fallback
   - Implement batching for gas efficiency
   - Monitor gas prices and adjust accordingly

4. **Documentation**:
   - Document all environment variables
   - Create a deployment runbook
   - Maintain API documentation for blockchain endpoints

## Troubleshooting Common Issues

### RPC Connection Failures

If you encounter RPC connection issues:

1. Verify your RPC URL is correct and accessible
2. Check if IP is whitelisted (for private RPC endpoints)
3. Implement exponential backoff for retries
4. Consider using a paid RPC service for better reliability

### Gas Estimation Errors

If you see "gas estimation failed" errors:

1. Verify your contract functions don't revert silently
2. Try manually setting gas limits
3. Check if your wallet has sufficient funds

### Nonce Management Issues

If you see nonce errors:

1. Implement proper nonce tracking in your hot wallet service
2. Add a nonce reset function for emergency situations
3. Handle transaction replacement with higher gas price

## References

- [Polygon Developer Documentation](https://polygon.technology/developers/)
- [OpenZeppelin Upgradeable Contracts](https://docs.openzeppelin.com/contracts/4.x/upgradeable)
- [ethers.js Documentation](https://docs.ethers.io/v5/)
- [NestJS Documentation](https://docs.nestjs.com/)
- [Hardhat Documentation](https://hardhat.org/getting-started/)
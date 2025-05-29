# SHAHI Coin Refactoring and Migration Plan

## Overview
This document outlines the plan for refactoring and migrating the SHAHI Coin smart contracts and associated files to a new project structure. The SHAHI Coin is an ERC-20 token with staking functionality implemented using the UUPS upgradeable pattern.

## Key Files to Migrate

### Core Contract Files
These are the essential Solidity contracts that define the token:

1. **SHAHICoin.sol**
   - Main token contract implementing ERC-20 functionality
   - Upgradeable design using UUPS pattern
   - Implements minting, staking, and token economics

2. **SHAHIStorage.sol**
   - Abstract contract that defines storage variables and structures
   - Used by SHAHICoin.sol through inheritance
   - Implements gas-optimized bitmap flag system for user roles

### Deployment Scripts
These files handle the deployment and verification of contracts:

1. **deploy/ directory**
   - `deploy-all.js` - Main entry point for deploying across multiple chains
   - `deploy-polygon-direct.js`, `deploy-bsc.js`, etc. - Chain-specific deployment scripts
   - `update-addresses.js` - Updates contract addresses after deployment
   - `verify-contracts.js` - Verifies contracts on block explorers

2. **Shell Scripts**
   - `deploy-recompile.sh` - Helper script for deployment
   - `direct-compile.sh` - Script to compile contracts without deployment

### Contract ABIs and Artifacts
Generated files needed for frontend interaction:

1. **abis/**
   - `SHAHICoin.ts` - TypeScript bindings for the contract ABI

2. **artifacts/**
   - Compiled contract artifacts (JSON files with ABIs, bytecode)
   - Contract deployment metadata

### Configuration Files
Files required for project setup and configuration:

1. **Project Configuration**
   - `hardhat.config.js` - Hardhat configuration for the project
   - `package.json` and `package-lock.json` - Node.js dependencies
   - `.env` and `.env.example` - Environment variables

## Refactoring Suggestions

### Contract Improvements

1. **Optimize Gas Usage**
   ```solidity
   // Current implementation
   function _transfer(address from, address to, uint256 amount) internal override {
       // Checks if the sender is blacklisted
       require(!isBlacklisted(from), "Sender is blacklisted");
       require(!isBlacklisted(to), "Recipient is blacklisted");
       
       // Multiple storage reads and boolean operations
       bool isStakingTransfer = _addressEquals(from, address(this)) || _addressEquals(to, address(this));
       // ...
   }
   
   // Optimized implementation
   function _transfer(address from, address to, uint256 amount) internal override {
       // Single storage read with bitmap checks
       require(!_checkBit(from, IS_BLACKLISTED_BIT), "Sender is blacklisted");
       require(!_checkBit(to, IS_BLACKLISTED_BIT), "Recipient is blacklisted");
       
       // Direct comparison without helper function
       bool isStakingTransfer = from == address(this) || to == address(this);
       // ...
   }
   ```

2. **Simplify First-Time Mint Logic**
   ```solidity
   // Current implementation - complex with many branches
   function firstTimeMint(address user, bytes32[] calldata proof, string calldata deviceId) external whenNotPaused nonReentrant {
       // Complex logic with many storage operations
       // ...
   }
   
   // Suggested refactoring - split into smaller functions
   function firstTimeMint(address user, bytes32[] calldata proof, string calldata deviceId) external whenNotPaused nonReentrant {
       _validateFirstTimeMintPrerequisites(user, proof);
       bytes32 userDeviceKey = _computeDeviceKey(user, deviceId);
       _processFirstTimeMint(user, userDeviceKey);
   }
   
   function _validateFirstTimeMintPrerequisites(address user, bytes32[] calldata proof) internal view {
       // Validation logic
   }
   
   // Additional helper functions...
   ```

3. **Improve Staking Implementation**
   - Consider using a more gas-efficient data structure for tracking stakes
   - Implement a withdraw queue for large withdrawals
   - Add emergency pause functionality for specific operations

### Project Structure Recommendations

1. **Separate Core and Auxiliary Contracts**
   ```
   contracts/
   ├── core/
   │   ├── SHAHICoin.sol
   │   └── SHAHIStorage.sol
   ├── interfaces/
   │   └── ISHAHICoin.sol  (New interface file)
   └── periphery/
       ├── NFT.sol
       └── Marketplace.sol
   ```

2. **Organize Test Files**
   ```
   test/
   ├── unit/
   │   ├── SHAHICoin.test.js
   │   └── SHAHIStorage.test.js
   └── integration/
       └── StakingSystem.test.js
   ```

3. **Deployment Scripts Structure**
   ```
   scripts/
   ├── deploy/
   │   ├── config/
   │   │   └── chainConfig.js
   │   └── networks/
   │       ├── polygon.js
   │       └── bsc.js
   └── verify/
       └── verifyContracts.js
   ```

## Migration Steps

1. **Prepare New Project Structure**
   ```bash
   # Create directory structure
   mkdir -p new-project/contracts/{core,interfaces,periphery}
   mkdir -p new-project/scripts/{deploy,verify}
   mkdir -p new-project/test/{unit,integration}
   
   # Copy configuration files
   cp hardhat.config.js package.json package-lock.json .env* new-project/
   ```

2. **Copy and Refactor Core Contracts**
   ```bash
   # Copy core contracts
   cp SHAHICoin.sol SHAHIStorage.sol new-project/contracts/core/
   
   # Create interface file (new)
   touch new-project/contracts/interfaces/ISHAHICoin.sol
   ```

3. **Migrate Deployment Scripts**
   ```bash
   # Copy deployment scripts
   cp -r deploy/ new-project/scripts/deploy/
   cp deploy-recompile.sh direct-compile.sh new-project/scripts/
   ```

4. **Migrate ABIs and Artifacts**
   ```bash
   # Copy ABIs
   cp -r abis/ new-project/
   
   # Copy necessary artifacts
   mkdir -p new-project/artifacts
   cp -r artifacts/deployment-info-* new-project/artifacts/
   ```

5. **Install Dependencies**
   ```bash
   # Navigate to new project
   cd new-project
   
   # Install dependencies
   npm install
   ```

6. **Update Import Paths**
   - Review all `.sol` files to update import paths
   - Update deployment scripts to reflect new file structure

## Testing After Migration

1. **Compile Contracts**
   ```bash
   npx hardhat compile
   ```

2. **Run Unit Tests**
   ```bash
   npx hardhat test
   ```

3. **Test Deployment Scripts**
   ```bash
   npx hardhat run --network hardhat scripts/deploy/deploy-all.js
   ```

## Security Considerations

1. **Audit Changes**
   - Review all refactored code for security vulnerabilities
   - Consider a professional audit for significant changes

2. **Verify Upgradability**
   - Ensure storage layout compatibility for upgradeable contracts
   - Test upgradeability using Hardhat's upgrade plugins

3. **Access Control**
   - Double-check all access control mechanisms
   - Verify role-based permissions are correctly implemented

## Future Enhancements

1. **Implement More Gas Optimizations**
   - Use assembly for critical functions
   - Batch operations where possible
   - Consider using newer Solidity versions (0.8.17+)

2. **Enhance Staking System**
   - Add variable APY based on token economics
   - Implement delegation capabilities
   - Add time-weighted positions

3. **Improve Developer Experience**
   - Add comprehensive documentation
   - Create deployment guides for each network
   - Implement CI/CD pipelines for testing and deployment

## Conclusion
This refactoring and migration plan provides a comprehensive approach to moving the SHAHI Coin project to a new structure while implementing improvements. Following these steps will ensure a clean migration with minimal disruption to existing functionalities.

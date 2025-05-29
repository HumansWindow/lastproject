# SHAHICoin Implementation Guide

## Contract Architecture

### Core Contracts

1. **SHAHIStorage.sol**
   - Abstract contract that defines storage variables
   - Implements bitmap-based role system
   - Contains structs and constants

2. **SHAHICoin.sol**
   - Main contract that inherits from SHAHIStorage
   - Implements ERC20 functionality with OpenZeppelin
   - Uses UUPS upgradeable pattern
   - Implements minting, staking, and burning logic

## Optimized Implementation

### SHAHIStorage.sol

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SHAHIStorage
 * @dev Storage contract for SHAHI token - separating storage from logic for upgradeable pattern
 */
abstract contract SHAHIStorage {
    // Constants for time periods
    uint256 internal constant ONE_YEAR = 365 days;
    uint256 internal constant SIX_MONTHS = 183 days;
    uint256 internal constant THREE_MONTHS = 91 days;
    
    // Constants for token economics
    uint256 internal constant KHORDE_PER_SHAHI = 10000; // 1 SHAHI = 10,000 KHORDE
    uint256 internal constant EARLY_WITHDRAWAL_PENALTY_PERCENT = 50; // 50% penalty
    
    // ============= BITMAP FLAGS SYSTEM =============
    
    // Define bit positions for user flags - using powers of 2 for bitmaps
    uint256 private constant IS_INVESTOR_BIT = 1;                     // 2^0
    uint256 private constant IS_BLACKLISTED_BIT = 2;                  // 2^1
    uint256 private constant IS_AUTHORIZED_MINTER_BIT = 4;            // 2^2
    uint256 private constant IS_AUTHORIZED_MINTER_SIGNER_BIT = 8;     // 2^3
    uint256 private constant IS_AUTHORIZED_APP_CONTRACT_BIT = 16;     // 2^4
    
    // Single mapping for all user flags (saves ~20,000 gas per user compared to multiple mappings)
    mapping(address => uint256) internal userFlags;
    
    // Helper functions to interact with the bitmap
    function _setBit(address user, uint256 bit, bool value) internal {
        if (value) {
            userFlags[user] = userFlags[user] | bit;
        } else {
            userFlags[user] = userFlags[user] & ~bit;
        }
    }
    
    function _checkBit(address user, uint256 bit) internal view returns (bool) {
        return (userFlags[user] & bit) != 0;
    }
    
    // Wallet status public accessor functions
    function isInvestor(address user) public view returns (bool) {
        return _checkBit(user, IS_INVESTOR_BIT);
    }
    
    function setInvestorStatus(address user, bool status) internal {
        _setBit(user, IS_INVESTOR_BIT, status);
    }
    
    function isBlacklisted(address user) public view returns (bool) {
        return _checkBit(user, IS_BLACKLISTED_BIT);
    }
    
    function setBlacklisted(address user, bool status) internal {
        _setBit(user, IS_BLACKLISTED_BIT, status);
    }
    
    function isAuthorizedMinter(address user) public view returns (bool) {
        return _checkBit(user, IS_AUTHORIZED_MINTER_BIT);
    }
    
    function setAuthorizedMinter(address user, bool status) internal {
        _setBit(user, IS_AUTHORIZED_MINTER_BIT, status);
    }
    
    function isAuthorizedMinterSigner(address user) public view returns (bool) {
        return _checkBit(user, IS_AUTHORIZED_MINTER_SIGNER_BIT);
    }
    
    function setAuthorizedMinterSigner(address user, bool status) internal {
        _setBit(user, IS_AUTHORIZED_MINTER_SIGNER_BIT, status);
    }
    
    function isAuthorizedAppContract(address contract_) public view returns (bool) {
        return _checkBit(contract_, IS_AUTHORIZED_APP_CONTRACT_BIT);
    }
    
    function setAuthorizedAppContract(address contract_, bool status) internal {
        _setBit(contract_, IS_AUTHORIZED_APP_CONTRACT_BIT, status);
    }
    
    // Legacy mappings - for backward compatibility with existing contracts
    mapping(address => bool) internal isInvestorLegacy;
    mapping(address => bool) internal isBlacklistedLegacy;
    mapping(address => bool) internal isAuthorizedMinterLegacy;
    mapping(address => bool) internal isAuthorizedMinterSignerLegacy;
    mapping(address => bool) internal isAuthorizedAppContractLegacy;
    
    // ============= TOKEN DATA =============
    
    // Records of user minting history
    struct UserMintRecord {
        bool hasFirstMinted;
        uint256 lastMintTimestamp;
        uint256 totalMinted;
    }
    
    // User staking position
    struct StakingPosition {
        uint256 amount;
        uint256 startTime;
        uint256 endTime; // 0 for flexible staking (no lock)
        uint256 lastClaimTime;
        uint256 accumulatedRewards;
        bool autoCompound;
        bool autoClaimEnabled;
    }
    
    // Token data
    address public adminHotWallet;  // Admin hot wallet for receiving shares
    
    // Packed struct for APY rates to save gas (single SLOAD for all rates)
    struct APYRates {
        uint64 oneYearAPY;
        uint64 sixMonthAPY;
        uint64 threeMonthAPY;
        uint64 defaultAPY;
    }
    
    APYRates public apyRates;
    
    // Legacy individual APY variables - maintained for backward compatibility
    uint256 public oneYearAPY = 2000; // 20% APY for 1-year lock (in basis points)
    uint256 public sixMonthAPY = 1500; // 15% APY for 6-month lock
    uint256 public threeMonthAPY = 1000; // 10% APY for 3-month lock 
    uint256 public defaultAPY = 500; // 5% APY for flexible staking
    
    // Transaction burn rate in basis points (100 = 1%)
    uint256 public transactionBurnRate = 100; // Default 1%
    
    // Root hash for Merkle tree verification
    bytes32 public merkleRoot;
    
    // Tracking mints and burns
    uint256 public totalMintedTokens;
    uint256 public burnedTokens;
    uint256 public totalStaked;
    
    // Mappings for token functionality
    mapping(address => UserMintRecord) internal userMintRecords;
    mapping(address => mapping(uint256 => uint256)) public userTokenExpiry; // user => mint timestamp => expiry timestamp
    mapping(address => StakingPosition[]) public userStakingPositions;
    
    mapping(bytes32 => bool) public usedProofs; // Prevents replay of merkle proofs or signatures
}
```

### Interface for SHAHICoin

Create a new interface file for better code organization and external integrations:

```solidity
// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";

/**
 * @title ISHAHICoin
 * @dev Interface for the SHAHI Coin token with extended functionality
 */
interface ISHAHICoin is IERC20 {
    // User status functions
    function isInvestor(address user) external view returns (bool);
    function isBlacklisted(address user) external view returns (bool);
    function isAuthorizedMinter(address user) external view returns (bool);
    function isAuthorizedAppContract(address contract_) external view returns (bool);
    
    // Minting functions
    function firstTimeMint(address user, bytes32[] calldata proof, string calldata deviceId) external;
    function annualMint(address user, bytes calldata signature, string calldata deviceId) external;
    function regularMint(address user, bytes calldata signature, string calldata deviceId) external;
    function mintForNewUser(address user) external;
    function adminMint(address to, uint256 amount) external;
    
    // Batch operations
    function batchMintForNewUsers(address[] calldata users) external;
    function batchAnnualMint(address[] calldata users, string calldata batchId) external;
    function adminMintBatch(address[] calldata recipients, uint256 amountEach) external;
    
    // Staking functions
    function createStake(uint256 amount, uint256 lockPeriod, bool autoCompound, bool enableAutoClaim) external;
    function claimStakingRewards(uint256 positionId) external;
    function withdrawStake(uint256 positionId) external;
    function emergencyWithdraw(uint256 positionId) external;
    
    // Token operations
    function burn(uint256 amount) external;
    function burnExpiredTokens(address user) external;
    function batchBurnExpiredTokens(address[] calldata users) external returns (uint256);
    
    // Conversion functions
    function convertToKhorde(uint256 shahiAmount) external pure returns (uint256);
    function convertToShahi(uint256 khordeAmount) external pure returns (uint256);
    
    // Admin functions
    function setTransactionBurnRate(uint256 newBurnRate) external;
    function setAdminHotWallet(address newAdminWallet) external;
    function setMerkleRoot(bytes32 newMerkleRoot) external;
    function setBlacklist(address user, bool blacklisted) external;
    function setAuthorizedMinterRole(address minter, bool authorized) external;
    function setAppContract(address contractAddress, bool authorized) external;
    function updateAPYTiers(
        uint256 _oneYearAPY,
        uint256 _sixMonthAPY,
        uint256 _threeMonthAPY,
        uint256 _defaultAPY
    ) external;
    function pause() external;
    function unpause() external;
    function setInvestor(address user, bool status) external;
    
    // Events
    event FirstTimeMint(address indexed user, uint256 amount);
    event RegularMint(address indexed user, uint256 adminShare, uint256 userShare);
    event StakeCreated(address indexed user, uint256 positionId, uint256 amount, uint256 endTime);
    event StakeWithdrawn(address indexed user, uint256 positionId, uint256 amount, uint256 rewards);
    event EmergencyWithdraw(address indexed user, uint256 positionId, uint256 amount, uint256 rewards, bool early);
    event RewardsClaimed(address indexed user, uint256 positionId, uint256 rewards);
    event TokensBurned(address indexed from, uint256 amount);
    event BurnRateUpdated(uint256 newRate);
    event AdminWalletUpdated(address newWallet);
    event MerkleRootUpdated(bytes32 newRoot);
    event BlacklistUpdated(address user, bool blacklisted);
    event MinterUpdated(address minter, bool authorized);
    event AppContractUpdated(address indexed contractAddress, bool authorized);
    event APYTiersUpdated(uint256 oneYearAPY, uint256 sixMonthAPY, uint256 threeMonthAPY, uint256 defaultAPY);
    event InvestorStatusUpdated(address indexed user, bool status);
    event TokensExpiredAndBurned(address indexed user, uint256 amount);
}
```

## Migration Script

Here's a bash script to help with migration:

```bash
#!/bin/bash

# Define source and destination directories
SRC_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/contracts"
DEST_DIR="/path/to/your/new/project/contracts"

# Create directory structure
mkdir -p "$DEST_DIR/core"
mkdir -p "$DEST_DIR/interfaces"
mkdir -p "$DEST_DIR/periphery"
mkdir -p "$DEST_DIR/../scripts/deploy"
mkdir -p "$DEST_DIR/../test/unit"
mkdir -p "$DEST_DIR/../abis"

# Copy core contracts
echo "Copying core contracts..."
cp "$SRC_DIR/SHAHICoin.sol" "$DEST_DIR/core/"
cp "$SRC_DIR/SHAHIStorage.sol" "$DEST_DIR/core/"

# Copy configuration files
echo "Copying configuration files..."
cp "$SRC_DIR/hardhat.config.js" "$DEST_DIR/../"
cp "$SRC_DIR/.env" "$DEST_DIR/../" 2>/dev/null || echo "No .env file found"
cp "$SRC_DIR/.env.example" "$DEST_DIR/../" 2>/dev/null || echo "No .env.example file found"
cp "$SRC_DIR/package.json" "$DEST_DIR/../"
cp "$SRC_DIR/package-lock.json" "$DEST_DIR/../"

# Copy deployment scripts
echo "Copying deployment scripts..."
cp -r "$SRC_DIR/deploy" "$DEST_DIR/../scripts/"
cp "$SRC_DIR/deploy-recompile.sh" "$DEST_DIR/../scripts/" 2>/dev/null || echo "No deploy-recompile.sh found"
cp "$SRC_DIR/direct-compile.sh" "$DEST_DIR/../scripts/" 2>/dev/null || echo "No direct-compile.sh found"

# Copy ABI files
echo "Copying ABI files..."
cp -r "$SRC_DIR/abis/SHAHICoin.ts" "$DEST_DIR/../abis/" 2>/dev/null || echo "No SHAHICoin.ts ABI file found"
cp -r "$SRC_DIR/shahi-token.abi.json" "$DEST_DIR/../abis/" 2>/dev/null || echo "No shahi-token.abi.json file found"

# Optional: Copy related contracts if they exist and are related
if [ -f "$SRC_DIR/NFT.sol" ]; then
  echo "Copying related NFT contract..."
  cp "$SRC_DIR/NFT.sol" "$DEST_DIR/periphery/"
fi

if [ -f "$SRC_DIR/Marketplace.sol" ]; then
  echo "Copying related Marketplace contract..."
  cp "$SRC_DIR/Marketplace.sol" "$DEST_DIR/periphery/"
fi

echo "Migration completed! Files have been copied to $DEST_DIR"
echo "Next steps:"
echo "1. Update import paths in Solidity files"
echo "2. Modify configuration files for your new environment"
echo "3. Run 'npm install' in the new project directory"
echo "4. Test compilation with 'npx hardhat compile'"
```

## Next Steps After Migration

1. **Update Import Paths**
   - In SHAHICoin.sol:
     - Update `import "./SHAHIStorage.sol"` to `import "../core/SHAHIStorage.sol"`
     - Update OpenZeppelin imports as needed

2. **Install Dependencies**
   ```bash
   cd /path/to/your/new/project
   npm install
   ```

3. **Compile Contracts**
   ```bash
   npx hardhat compile
   ```

4. **Run Tests**
   ```bash
   npx hardhat test
   ```

## Hardhat Configuration

Here's a recommended hardhat.config.js for the new project:

```javascript
require("@nomiclabs/hardhat-waffle");
require("@nomiclabs/hardhat-ethers");
require("@openzeppelin/hardhat-upgrades");
require("@nomiclabs/hardhat-etherscan");
require('dotenv').config();

// Load environment variables
const PRIVATE_KEY = process.env.PRIVATE_KEY;
const POLYGON_RPC_URL = process.env.POLYGON_RPC_URL;
const BSC_RPC_URL = process.env.BSC_RPC_URL;
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY;
const POLYGONSCAN_API_KEY = process.env.POLYGONSCAN_API_KEY;
const BSCSCAN_API_KEY = process.env.BSCSCAN_API_KEY;

module.exports = {
  solidity: {
    version: "0.8.19",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      // Local development network
      chainId: 31337,
    },
    polygon: {
      url: POLYGON_RPC_URL || "https://polygon-rpc.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 137,
    },
    polygonMumbai: {
      url: process.env.MUMBAI_RPC_URL || "https://rpc-mumbai.maticvigil.com",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 80001,
    },
    bsc: {
      url: BSC_RPC_URL || "https://bsc-dataseed.binance.org/",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 56,
    },
    bscTestnet: {
      url: process.env.BSC_TESTNET_RPC_URL || "https://data-seed-prebsc-1-s1.binance.org:8545/",
      accounts: PRIVATE_KEY ? [PRIVATE_KEY] : [],
      chainId: 97,
    }
  },
  etherscan: {
    apiKey: {
      mainnet: ETHERSCAN_API_KEY,
      polygon: POLYGONSCAN_API_KEY,
      polygonMumbai: POLYGONSCAN_API_KEY,
      bsc: BSCSCAN_API_KEY,
      bscTestnet: BSCSCAN_API_KEY,
    }
  },
  paths: {
    sources: "./contracts",
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts"
  }
};
```

## Conclusion

This implementation guide provides the core files needed to migrate the SHAHICoin project to a new structure. By following these steps, you'll be able to refactor the contracts for better organization and maintenance while preserving all existing functionality.

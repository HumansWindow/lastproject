#!/bin/bash

# SHAHI Coin Migration Script
# This script migrates all necessary files from the old project structure
# to a new project structure

# Define source and destination directories
# Change the DEST_DIR to your new project path
SRC_DIR="/home/alivegod/Desktop/4-Ordibehesht/LastProjectendpoint/LastProject/backend/src/blockchain/contracts"
DEST_DIR="/path/to/your/new/project"

# Create color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${GREEN}Starting SHAHI Coin project migration...${NC}"

# Create directory structure
echo -e "${YELLOW}Creating directory structure...${NC}"
mkdir -p "$DEST_DIR/contracts/core"
mkdir -p "$DEST_DIR/contracts/interfaces"
mkdir -p "$DEST_DIR/contracts/periphery"
mkdir -p "$DEST_DIR/scripts/deploy"
mkdir -p "$DEST_DIR/scripts/verify"
mkdir -p "$DEST_DIR/test/unit"
mkdir -p "$DEST_DIR/test/integration"
mkdir -p "$DEST_DIR/abis"
mkdir -p "$DEST_DIR/artifacts"

# Function to copy a file with error handling
copy_file() {
    if [ -f "$1" ]; then
        cp "$1" "$2"
        echo -e "${GREEN}✓ Copied $(basename $1)${NC}"
    else
        echo -e "${RED}✗ File not found: $(basename $1)${NC}"
    fi
}

# Function to copy a directory with error handling
copy_dir() {
    if [ -d "$1" ]; then
        cp -r "$1" "$2"
        echo -e "${GREEN}✓ Copied directory $(basename $1)${NC}"
    else
        echo -e "${RED}✗ Directory not found: $(basename $1)${NC}"
    fi
}

# Copy core contract files
echo -e "\n${YELLOW}Copying core contract files...${NC}"
copy_file "$SRC_DIR/SHAHICoin.sol" "$DEST_DIR/contracts/core/"
copy_file "$SRC_DIR/SHAHIStorage.sol" "$DEST_DIR/contracts/core/"

# Create the interface file
echo -e "\n${YELLOW}Creating interface file...${NC}"
cat > "$DEST_DIR/contracts/interfaces/ISHAHICoin.sol" << 'EOF'
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
}
EOF
echo -e "${GREEN}✓ Created ISHAHICoin.sol interface${NC}"

# Copy periphery contracts if they exist
echo -e "\n${YELLOW}Copying periphery contracts...${NC}"
copy_file "$SRC_DIR/NFT.sol" "$DEST_DIR/contracts/periphery/"
copy_file "$SRC_DIR/Marketplace.sol" "$DEST_DIR/contracts/periphery/"

# Copy configuration files
echo -e "\n${YELLOW}Copying configuration files...${NC}"
copy_file "$SRC_DIR/hardhat.config.js" "$DEST_DIR/"
copy_file "$SRC_DIR/package.json" "$DEST_DIR/"
copy_file "$SRC_DIR/package-lock.json" "$DEST_DIR/"
copy_file "$SRC_DIR/.env" "$DEST_DIR/" 
copy_file "$SRC_DIR/.env.example" "$DEST_DIR/"

# Copy deployment scripts
echo -e "\n${YELLOW}Copying deployment scripts...${NC}"
copy_dir "$SRC_DIR/deploy" "$DEST_DIR/scripts/"
copy_file "$SRC_DIR/deploy-recompile.sh" "$DEST_DIR/scripts/"
copy_file "$SRC_DIR/direct-compile.sh" "$DEST_DIR/scripts/"

# Copy ABI files
echo -e "\n${YELLOW}Copying ABI files...${NC}"
if [ -d "$SRC_DIR/abis" ]; then
    copy_file "$SRC_DIR/abis/SHAHICoin.ts" "$DEST_DIR/abis/"
fi
copy_file "$SRC_DIR/shahi-token.abi.json" "$DEST_DIR/abis/"

# Copy artifacts if they exist
echo -e "\n${YELLOW}Copying contract artifacts...${NC}"
if [ -d "$SRC_DIR/artifacts" ]; then
    find "$SRC_DIR/artifacts" -name "*deployment-info*" -exec cp {} "$DEST_DIR/artifacts/" \;
    echo -e "${GREEN}✓ Copied deployment info artifacts${NC}"
fi

# Update import paths in the copied files
echo -e "\n${YELLOW}Updating import paths in Solidity files...${NC}"
sed -i 's/import ".\/SHAHIStorage.sol";/import ".\/SHAHIStorage.sol";/g' "$DEST_DIR/contracts/core/SHAHICoin.sol"

# Generate a sample test file
echo -e "\n${YELLOW}Creating sample test file...${NC}"
cat > "$DEST_DIR/test/unit/SHAHICoin.test.js" << 'EOF'
const { expect } = require("chai");
const { ethers, upgrades } = require("hardhat");

describe("SHAHICoin", function () {
  let SHAHICoin;
  let shahiCoin;
  let owner;
  let addr1;
  let addr2;

  beforeEach(async function () {
    // Get the ContractFactory and Signers
    SHAHICoin = await ethers.getContractFactory("SHAHICoinV1");
    [owner, addr1, addr2] = await ethers.getSigners();

    // Deploy as upgradeable contract
    shahiCoin = await upgrades.deployProxy(SHAHICoin, [
      1000, // initialSupply
      owner.address // adminHotWalletAddress
    ]);
    
    await shahiCoin.deployed();
  });

  describe("Deployment", function () {
    it("Should set the right owner", async function () {
      expect(await shahiCoin.owner()).to.equal(owner.address);
    });

    it("Should have correct name and symbol", async function () {
      expect(await shahiCoin.name()).to.equal("SHAHI Coin");
      expect(await shahiCoin.symbol()).to.equal("SHAHI");
    });
  });

  // Add more test cases here
});
EOF
echo -e "${GREEN}✓ Created sample test file${NC}"

# Create a README.md file with instructions
echo -e "\n${YELLOW}Creating README.md...${NC}"
cat > "$DEST_DIR/README.md" << 'EOF'
# SHAHI Coin

SHAHI Coin is an ERC-20 token with staking functionality implemented using the UUPS upgradeable pattern.

## Project Structure

```
├── contracts/
│   ├── core/
│   │   ├── SHAHICoin.sol      # Main token contract
│   │   └── SHAHIStorage.sol   # Storage contract
│   ├── interfaces/
│   │   └── ISHAHICoin.sol     # Interface for external integrations
│   └── periphery/
│       ├── NFT.sol            # NFT contract (if applicable)
│       └── Marketplace.sol    # Marketplace contract (if applicable)
├── scripts/
│   ├── deploy/                # Deployment scripts
│   └── verify/                # Contract verification scripts
├── test/
│   ├── unit/                  # Unit tests
│   └── integration/           # Integration tests
├── abis/                      # Contract ABIs
├── artifacts/                 # Deployment artifacts
├── hardhat.config.js          # Hardhat configuration
├── package.json               # Project dependencies
└── README.md                  # This file
```

## Setup

1. Install dependencies:
   ```
   npm install
   ```

2. Copy `.env.example` to `.env` and update the environment variables:
   ```
   cp .env.example .env
   ```

3. Compile contracts:
   ```
   npx hardhat compile
   ```

4. Run tests:
   ```
   npx hardhat test
   ```

## Deployment

1. Deploy to a local Hardhat network:
   ```
   npx hardhat run scripts/deploy/deploy-all.js
   ```

2. Deploy to a testnet (Mumbai):
   ```
   npx hardhat run scripts/deploy/deploy-polygon.js --network polygonMumbai
   ```

3. Deploy to mainnet:
   ```
   npx hardhat run scripts/deploy/deploy-polygon.js --network polygon
   ```

## Features

1. ERC-20 token functionality
2. Staking system with different APY tiers
3. Minting system with first-time and annual minting
4. Batch operations for gas efficiency
5. Role-based access control using bitmap flags
6. Token burning mechanism
7. Upgradeable contract pattern (UUPS)
EOF
echo -e "${GREEN}✓ Created README.md${NC}"

echo -e "\n${GREEN}Migration complete!${NC}"
echo -e "Next steps:"
echo -e "1. Change to the new directory: ${YELLOW}cd $DEST_DIR${NC}"
echo -e "2. Install dependencies: ${YELLOW}npm install${NC}"
echo -e "3. Compile contracts: ${YELLOW}npx hardhat compile${NC}"
echo -e "4. Run tests: ${YELLOW}npx hardhat test${NC}"
echo -e "\nHappy coding!"

# SHAHICoin Smart Contract

## Overview

`SHAHICoin` is an advanced ERC-20 token implementation that powers our platform's economy. It's designed as an upgradeable contract using the UUPS (Universal Upgradeable Proxy Standard) pattern and offers comprehensive tokenomics features including website-based minting, staking, time-locked tokens, and a deflationary mechanism.

## Technical Design

### Contract Architecture

The `SHAHICoin` contract follows a modular design with storage separation:

- `SHAHICoin.sol` - Main implementation with business logic
- `SHAHIStorage.sol` - Storage contract containing state variables

This separation enables upgradeable functionality while maintaining persistent state.

### Key Dependencies

The contract imports several OpenZeppelin libraries for security and standard functionality:

```solidity
import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./SHAHIStorage.sol";
```

## Core Features

### 1. Token Economics

- **Symbol**: SHAHI
- **Decimals**: 18
- **Initial Supply**: Configurable during initialization
- **Deflationary Mechanism**: Per-transaction burn rate
- **Time-Locked Tokens**: Tokens minted to users are time-locked for 1 year

### 2. Website-Based Minting System

The contract implements three main types of minting:

#### First-Time Minting

Users can mint tokens on their first visit to the website:
- Admin receives 110 SHAHI on first visit
- Regular users receive 1 SHAHI (split 0.5 to user, 0.5 to admin)
- Uses Merkle proofs to verify eligibility
- Prevents duplicate claims through device tracking

```solidity
function firstTimeMint(address user, bytes32[] calldata proof, string calldata deviceId) external
```

#### Annual Minting

Users can mint additional tokens once per year:
- 1 SHAHI per year (split 0.5 to user, 0.5 to admin)
- Requires cryptographic signature for verification
- Implements 1-year cooldown period

```solidity
function annualMint(address user, bytes calldata signature, string calldata deviceId) external
```

#### Administrative Minting

Special functions for application-controlled minting:

```solidity
function mintForNewUser(address user) external
function adminMint(address to, uint256 amount) external
function batchMintForNewUsers(address[] calldata users) external
function batchAnnualMint(address[] calldata users, string calldata batchId) external
```

### 3. Staking System

The contract implements a flexible staking system with:

- Variable lock periods (3 months, 6 months, 1 year, or no lock)
- Tiered APY rewards based on lock period
- Auto-compound and auto-claim options
- Emergency withdrawal with penalties

Key staking functions:

```solidity
function createStake(uint256 amount, uint256 lockPeriod, bool autoCompound, bool enableAutoClaim) external
function claimStakingRewards(uint256 positionId) external
function withdrawStake(uint256 positionId) external
function emergencyWithdraw(uint256 positionId) external
```

### 4. Token Transfer Restrictions

The contract implements custom transfer logic:

- Blacklisted addresses cannot send or receive tokens
- Users can only send tokens to approved app contracts or admin
- Each transfer includes a burn mechanism (deflationary model)
- Special handling for staking-related transfers

## Security Features

### 1. Access Control

- **Owner**: Contract deployer with administrative privileges
- **Admin Hot Wallet**: Delegated administrative wallet for day-to-day operations
- **Authorized Minters**: External systems permitted to mint tokens
- **Authorized App Contracts**: Approved contracts that can receive tokens

### 2. Protection Mechanisms

- **Pausability**: Emergency pause of all operations
- **Reentrancy Guard**: Protection against reentrancy attacks
- **Rate Limiting**: Implicit rate limiting through time restrictions
- **Blacklisting**: Ability to block malicious actors
- **Signature Verification**: Cryptographic proof for sensitive operations

## Tokenomics

### 1. Token Distribution

- Initial minting to contract owner
- Distribution through website visits (first-time and annual)
- Special administrative minting for promotions or rewards

### 2. Token Burning

- Automatic burn on regular transfers (configurable percentage)
- Manual burn function for additional deflationary pressure
- Automatic burning of expired tokens

### 3. Staking Rewards

- Default staking rate: 5% APY
- 3-month lock period: 10% APY
- 6-month lock period: 15% APY
- 1-year lock period: 20% APY

## Upgradability

The contract follows the UUPS (Universal Upgradeable Proxy) pattern:

- Uses `Initializable` pattern instead of constructors
- Implements `_authorizeUpgrade` with owner-only restriction
- Storage layout is defined in a separate contract

## Gas Optimization Techniques

The contract implements numerous gas optimizations:

- Constant values for common operations
- Storage packing for related variables
- Assembly optimizations for critical paths
- Minimizing SLOADs with local caching
- Batch operations where applicable

## Events

The contract emits events for all significant state changes:

```solidity
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
```

## Administrative Functions

The contract includes administrative functions for managing the token ecosystem:

- `setTransactionBurnRate`: Adjust the burn rate for transfers
- `setAdminHotWallet`: Update the administrative hot wallet address
- `setMerkleRoot`: Update the Merkle root for verification
- `setBlacklist`: Add or remove addresses from the blacklist
- `setAuthorizedMinterRole`: Manage authorized minters
- `setAppContract`: Manage authorized app contracts
- `updateAPYTiers`: Adjust staking reward rates
- `setInvestor`: Mark addresses as eligible for staking

## Interaction with Other Contracts

The SHAHICoin contract is designed to interact with:

1. **Marketplace Contract**: For NFT purchases using SHAHI tokens
2. **NFT Contract**: For minting and managing NFTs
3. **Proxy Contract**: For contract upgrades

## Deployment and Initialization

The contract is deployed using the UUPS proxy pattern:

1. Deploy `SHAHIStorage` contract
2. Deploy `SHAHICoin` implementation contract
3. Deploy UUPS proxy pointing to the implementation
4. Call `initialize` function to set up initial parameters

```solidity
function initialize(uint256 initialSupply, address adminHotWalletAddress) public initializer
```

## Future Upgrades

The modular design allows for future upgrades:

- Token economics adjustments
- New staking features
- Enhanced security measures
- Integration with additional blockchain ecosystems
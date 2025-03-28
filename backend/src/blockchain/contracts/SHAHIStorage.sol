// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SHAHIStorage
 * @dev Storage contract for SHAHI token to enable upgradeable pattern.
 * Keeps all state variables separate from logic to prevent storage collisions during upgrades.
 */
contract SHAHIStorage {
    // Minting System
    struct MintingRecord {
        uint256 lastMintTimestamp;
        bool hasFirstMinted;
        uint256 totalMinted;
    }
    mapping(address => MintingRecord) public userMintRecords;
    mapping(bytes32 => bool) public usedProofs;
    
    // Staking System
    struct StakingPosition {
        uint256 amount;         // Amount staked
        uint256 startTime;      // When the stake was created
        uint256 endTime;        // When the stake will end (0 if no lock period)
        uint256 lastClaimTime;  // Last time rewards were claimed
        uint256 accumulatedRewards; // Unclaimed rewards
        bool autoCompound;      // Whether to auto-compound rewards
        bool autoClaimEnabled;  // Whether to auto-claim rewards monthly
    }
    mapping(address => StakingPosition[]) public userStakingPositions;
    uint256 public totalStaked;
    
    // Tokenomics
    uint256 public constant KHORDE_PER_SHAHI = 10**18; // 1 SHAHI = 10^18 KHORDE
    uint256 public burnedTokens;
    uint256 public totalMintedTokens;
    
    // APY Tiers for Staking (represented in basis points, 100 = 1%)
    uint256 public oneYearAPY = 1300;    // 13%
    uint256 public sixMonthAPY = 900;    // 9%
    uint256 public threeMonthAPY = 600;  // 6%
    uint256 public defaultAPY = 300;     // 3%
    
    // Admin addresses
    address public adminHotWallet;
    
    // Time periods
    uint256 public constant MINT_COOLDOWN = 365 days;
    uint256 public constant ONE_YEAR = 365 days;
    uint256 public constant SIX_MONTHS = 180 days;
    uint256 public constant THREE_MONTHS = 90 days;
    uint256 public constant EARLY_WITHDRAWAL_PENALTY_PERCENT = 50; // 50% penalty
    
    // Transaction fee burn rate in basis points (0.01%)
    uint256 public transactionBurnRate = 1;  // Changed from 50 (0.5%) to 1 (0.01%)
    
    // Merkle root for mint eligibility verification
    bytes32 public merkleRoot;
    
    // Security features
    mapping(address => bool) public isAuthorizedMinter;
    mapping(address => bool) public isBlacklisted;
    
    // Token gating
    mapping(uint256 => bool) public isNFTEligibleForRewards;
    
    // User-specific mappings for token restrictions
    mapping(address => bool) public isInvestor;  // Tracks who can stake (only investors)
    mapping(address => mapping(uint256 => uint256)) public userTokenExpiry;  // Tracks when each user's tokens will expire
    
    // App contract authorization (for locked tokens)
    mapping(address => bool) public isAuthorizedAppContract;  // Approves contracts that can receive locked tokens
    
    // Add missing property for minter signature verification
    mapping(address => bool) public isAuthorizedMinterSigner; // Additional authorized signers for minting verification
    
    // Reserved for future expansion (prevents storage collision)
    uint256[45] private __gap; // Reduced to account for the additional mappings
}

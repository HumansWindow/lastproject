// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title SHAHIStorage
 * @dev Storage contract for SHAHI token - separating storage from logic
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
    
    // Define bit positions for user flags
    uint256 private constant IS_INVESTOR_BIT = 1;
    uint256 private constant IS_BLACKLISTED_BIT = 2; 
    uint256 private constant IS_AUTHORIZED_MINTER_BIT = 4;
    uint256 private constant IS_AUTHORIZED_MINTER_SIGNER_BIT = 8;
    uint256 private constant IS_AUTHORIZED_APP_CONTRACT_BIT = 16;
    
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
    
    // Wallet statuses (backward compatibility functions)
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
    
    // Legacy mappings - for backward compatibility, but we'll use our optimized bitmap instead
    mapping(address => bool) internal isInvestorLegacy;  // Tracks who can stake tokens
    mapping(address => bool) internal isBlacklistedLegacy;  // Blacklisted addresses can't transfer tokens
    mapping(address => bool) internal isAuthorizedMinterLegacy;  // Authorized to mint new tokens
    mapping(address => bool) internal isAuthorizedMinterSignerLegacy;  // Can sign messages for minting
    mapping(address => bool) internal isAuthorizedAppContractLegacy;  // Contracts that can receive locked tokens
    
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
    
    // Legacy individual APY variables - we'll use the packed struct instead
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

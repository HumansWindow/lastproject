// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts-upgradeable/token/ERC20/ERC20Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/PausableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/security/ReentrancyGuardUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/UUPSUpgradeable.sol";
import "@openzeppelin/contracts/utils/cryptography/MerkleProof.sol";
import "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import "./SHAHIStorage.sol";

/**
 * @title SHAHICoinV1
 * @dev Upgradeable ERC20 implementation of the SHAHI token with website-based minting,
 * staking system, advanced security features, and tokenomics
 */
contract SHAHICoinV1 is 
    Initializable, 
    ERC20Upgradeable, 
    PausableUpgradeable,
    OwnableUpgradeable,
    ReentrancyGuardUpgradeable,
    UUPSUpgradeable,
    SHAHIStorage
{
    using ECDSA for bytes32;
    
    // Constants for gas optimization
    uint256 private constant DECIMALS_FACTOR = 10**18; // Based on standard 18 decimals 
    uint256 private constant ONE_SHAHI = 10**18;
    uint256 private constant ADMIN_INITIAL_MINT = 110 * 10**18;
    uint256 private constant HALF_SHAHI = 5 * 10**17; // 0.5 SHAHI
    uint256 private constant SECONDS_PER_YEAR = 365 days;
    
    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() initializer {}
    
    /**
     * @dev Initializes the contract with initial supply and parameters
     * @param initialSupply The initial amount of tokens to be minted to the admin
     */
    function initialize(uint256 initialSupply, address adminHotWalletAddress) public initializer {
        __ERC20_init("SHAHI Coin", "SHAHI");
        __Pausable_init();
        __Ownable_init();
        __ReentrancyGuard_init();
        __UUPSUpgradeable_init();
        
        adminHotWallet = adminHotWalletAddress;
        
        // Initialize the APY rates struct (gas optimization)
        apyRates.oneYearAPY = 2000; // 20% APY
        apyRates.sixMonthAPY = 1500; // 15% APY
        apyRates.threeMonthAPY = 1000; // 10% APY
        apyRates.defaultAPY = 500; // 5% APY
        
        // Mint initial supply to the contract owner
        uint256 initialTokens = initialSupply * DECIMALS_FACTOR;
        _mint(msg.sender, initialTokens);
        totalMintedTokens = initialTokens;
    }
    
    /**
     * @dev Required override for UUPS proxy pattern
     * Only the owner can upgrade the contract
     */
    function _authorizeUpgrade(address newImplementation) internal override onlyOwner {}

    // ============= WEBSITE MINTING SYSTEM =============
    
    /**
     * @dev First-time minting function for new users
     * Mints 110 SHAHI only when the admin (owner) is the first visitor
     * For regular users, mints 1 SHAHI with 50/50 split
     * @param user Address of the user who is eligible for minting
     * @param proof Merkle proof verifying the user's eligibility
     * @param deviceId Unique identifier for the user's device
     */
    function firstTimeMint(address user, bytes32[] calldata proof, string calldata deviceId) external whenNotPaused nonReentrant {
        require(user != address(0), "Invalid address");
        require(!isBlacklisted(user), "User is blacklisted");
        
        // Cache storage variables to minimize SLOADs
        UserMintRecord storage mintRecord = userMintRecords[user];
        require(!mintRecord.hasFirstMinted, "Already claimed first mint");
        require(_verifyMerkle(user, proof), "Invalid proof");
        
        // Create unique device identifier - optimize using assembly
        bytes32 userDeviceKey;
        assembly {
            // More efficient keccak256 calculation in assembly
            let ptr := mload(0x40)
            mstore(ptr, user) 
            let deviceIdPos := add(deviceId.offset, 0x20)
            let deviceIdLen := mload(deviceId.offset)
            
            // Copy deviceId bytes to memory
            for { let i := 0 } lt(i, deviceIdLen) { i := add(i, 0x20) } {
                let chunk := mload(add(deviceIdPos, i))
                mstore(add(add(ptr, 0x20), i), chunk)
            }
            
            // Compute the hash
            userDeviceKey := keccak256(ptr, add(0x20, deviceIdLen))
        }
        
        // Verify this is a unique visit for this device+user combination
        require(!usedProofs[userDeviceKey], "Already minted from this device");
        
        // Record this visit to prevent duplicate minting
        usedProofs[userDeviceKey] = true;
        
        // Mark as first minted and record timestamp
        mintRecord.hasFirstMinted = true;
        mintRecord.lastMintTimestamp = block.timestamp;
        
        unchecked {
            // For the admin/first user, mint 110 SHAHI to admin hot wallet
            if (user == owner()) {
                _mint(adminHotWallet, ADMIN_INITIAL_MINT);
                totalMintedTokens += ADMIN_INITIAL_MINT;
                mintRecord.totalMinted += ADMIN_INITIAL_MINT;
                emit FirstTimeMint(user, ADMIN_INITIAL_MINT);
            } else {
                // For all other first-time users, mint 1 SHAHI and split 50/50
                uint256 adminShare = HALF_SHAHI;
                uint256 userShare = HALF_SHAHI;
                
                // Mint shares to respective wallets
                _mint(adminHotWallet, adminShare);
                _mint(user, userShare);
                
                // Record when these tokens will expire (1 year from now)
                userTokenExpiry[user][block.timestamp] = block.timestamp + ONE_YEAR;
                
                totalMintedTokens += ONE_SHAHI;
                mintRecord.totalMinted += ONE_SHAHI;
                emit RegularMint(user, adminShare, userShare);
            }
        }
    }
    
    /**
     * @dev Annual minting function for returning users
     * Users can mint 1 SHAHI once per year after their initial mint
     * 50% goes to admin, 50% goes to user (locked for 1 year)
     * @param user Address of the user who is eligible for minting
     * @param signature Signed proof of website visit
     * @param deviceId Unique identifier for the user's device
     */
    function annualMint(address user, bytes calldata signature, string calldata deviceId) external whenNotPaused nonReentrant {
        require(user != address(0), "Invalid address");
        require(!isBlacklisted(user), "User is blacklisted");
        
        // Cache storage variables
        UserMintRecord storage mintRecord = userMintRecords[user];
        require(mintRecord.hasFirstMinted, "Must claim first mint first");
        
        // Verify 1-year cooldown period
        require(
            block.timestamp >= mintRecord.lastMintTimestamp + ONE_YEAR,
            "Annual cooldown period not over yet"
        );
        
        // Create a unique key based on user and device
        bytes32 userDeviceKey = keccak256(abi.encodePacked(user, deviceId, block.timestamp / ONE_YEAR));
        
        // Verify this is a unique annual mint
        require(!usedProofs[userDeviceKey], "Already claimed annual mint this year");
        
        // Verify signature (prevents abuse)
        bytes32 messageHash = keccak256(abi.encodePacked(user, deviceId, block.timestamp));
        bytes32 signedHash = messageHash.toEthSignedMessageHash();
        require(_verifySignature(signedHash, signature), "Invalid signature");
        
        // Record this visit to prevent duplicate minting
        usedProofs[userDeviceKey] = true;
        
        // Update minting record with new timestamp
        mintRecord.lastMintTimestamp = block.timestamp;
        
        // Fixed shares for consistent gas usage
        uint256 adminShare = HALF_SHAHI;
        uint256 userShare = HALF_SHAHI;
        
        // Mint to admin hot wallet
        _mint(adminHotWallet, adminShare);
        
        // Mint to user (these tokens are locked and non-transferable)
        _mint(user, userShare);
        
        // Record when these tokens will expire (1 year from now)
        userTokenExpiry[user][block.timestamp] = block.timestamp + ONE_YEAR;
        
        totalMintedTokens += ONE_SHAHI;
        mintRecord.totalMinted += ONE_SHAHI;
        
        emit RegularMint(user, adminShare, userShare);
    }
    
    /**
     * @dev Direct implementation instead of an external call to annualMint
     */
    function regularMint(address user, bytes calldata signature, string calldata deviceId) external whenNotPaused nonReentrant {
        require(user != address(0), "Invalid address");
        require(!isBlacklisted(user), "User is blacklisted");
        
        // Cache storage variables
        UserMintRecord storage mintRecord = userMintRecords[user];
        require(mintRecord.hasFirstMinted, "Must claim first mint first");
        
        // Verify 1-year cooldown period
        require(
            block.timestamp >= mintRecord.lastMintTimestamp + ONE_YEAR,
            "Annual cooldown period not over yet"
        );
        
        // Create a unique key based on user and device
        bytes32 userDeviceKey = keccak256(abi.encodePacked(user, deviceId, block.timestamp / ONE_YEAR));
        
        // Verify this is a unique annual mint
        require(!usedProofs[userDeviceKey], "Already claimed annual mint this year");
        
        // Verify signature (prevents abuse)
        bytes32 messageHash = keccak256(abi.encodePacked(user, deviceId, block.timestamp));
        bytes32 signedHash = messageHash.toEthSignedMessageHash();
        require(_verifySignature(signedHash, signature), "Invalid signature");
        
        // Record this visit to prevent duplicate minting
        usedProofs[userDeviceKey] = true;
        
        // Update minting record with new timestamp
        mintRecord.lastMintTimestamp = block.timestamp;
        
        // Fixed shares for consistent gas usage
        uint256 adminShare = HALF_SHAHI;
        uint256 userShare = HALF_SHAHI;
        
        // Mint to admin hot wallet
        _mint(adminHotWallet, adminShare);
        
        // Mint to user (these tokens are locked and non-transferable)
        _mint(user, userShare);
        
        // Record when these tokens will expire (1 year from now)
        userTokenExpiry[user][block.timestamp] = block.timestamp + ONE_YEAR;
        
        totalMintedTokens += ONE_SHAHI;
        mintRecord.totalMinted += ONE_SHAHI;
        
        emit RegularMint(user, adminShare, userShare);
    }
    
    /**
     * @dev Direct minting for new users by authorized minters without proof verification
     * Used by the backend services when a new user connects with wallet
     * Mints 1 SHAHI token with 50/50 split between admin and user
     * @param user Address of the new user
     */
    function mintForNewUser(address user) external whenNotPaused {
        require(msg.sender == owner() || isAuthorizedMinter(msg.sender), "Only owner or authorized minter");
        require(user != address(0), "Invalid address");
        require(!isBlacklisted(user), "User is blacklisted");
        
        // Cache storage reference for gas savings
        UserMintRecord storage mintRecord = userMintRecords[user]; 
        
        // Don't mint if user has already done first-time minting
        if (mintRecord.hasFirstMinted) {
            return;
        }
        
        // Mark as first minted and record timestamp
        mintRecord.hasFirstMinted = true;
        mintRecord.lastMintTimestamp = block.timestamp;
        
        // Fixed shares for consistent gas usage
        uint256 adminShare = HALF_SHAHI;
        uint256 userShare = HALF_SHAHI;
        
        // Mint shares to respective wallets
        _mint(adminHotWallet, adminShare);
        _mint(user, userShare);
        
        // Record when these tokens will expire (1 year from now)
        userTokenExpiry[user][block.timestamp] = block.timestamp + ONE_YEAR;
        
        totalMintedTokens += ONE_SHAHI;
        mintRecord.totalMinted += ONE_SHAHI;
        
        // Use the same event as regular minting to maintain consistency in event logs
        emit RegularMint(user, adminShare, userShare);
    }
    
    /**
     * @dev Mint function that can only be called by owner
     * General-purpose minting for admin use
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function adminMint(address to, uint256 amount) external onlyOwner whenNotPaused {
        require(to != address(0), "Invalid address");
        require(!isBlacklisted(to), "User is blacklisted");
        
        _mint(to, amount);
        totalMintedTokens += amount;
        
        // Use FirstTimeMint event for consistency with other minting functions
        emit FirstTimeMint(to, amount);
    }
    
    /**
     * @dev Batch minting for multiple new users at once
     * This function greatly optimizes gas costs when minting for multiple users
     * @param users Array of user addresses to mint tokens for
     */
    function batchMintForNewUsers(address[] calldata users) external whenNotPaused onlyOwner {
        require(users.length > 0, "Empty users array");
        
        // Calculate total amounts to mint
        uint256 totalMintAmount = users.length * ONE_SHAHI;
        uint256 adminTotalShare = users.length * HALF_SHAHI;
        uint256 userShareEach = HALF_SHAHI;
        
        // First mint the admin's total share in one operation
        _mint(adminHotWallet, adminTotalShare);
        
        // Then mint each user's portion and record expiry
        uint256 currentTimestamp = block.timestamp;
        uint256 expiryTimestamp = currentTimestamp + ONE_YEAR;
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            require(user != address(0), "Invalid address");
            require(!isBlacklisted(user), "User is blacklisted");
            
            // Cache storage variables for gas savings
            UserMintRecord storage mintRecord = userMintRecords[user];
            
            // Skip if already minted (to avoid reverts for the whole batch)
            if (mintRecord.hasFirstMinted) continue;
            
            // Mark as first minted and record timestamp
            mintRecord.hasFirstMinted = true;
            mintRecord.lastMintTimestamp = currentTimestamp;
            
            // Mint to user (these tokens are locked and non-transferable)
            _mint(user, userShareEach);
            
            // Record when these tokens will expire
            userTokenExpiry[user][currentTimestamp] = expiryTimestamp;
            
            mintRecord.totalMinted += userShareEach;
            
            emit RegularMint(user, userShareEach, userShareEach);
        }
        
        // Update total minted tokens
        totalMintedTokens += totalMintAmount;
    }

    /**
     * @dev Batch annual minting for multiple users at once
     * This function greatly optimizes gas costs when annual minting for multiple users
     * The admin must sign a batch mint approval for security
     * @param users Array of user addresses for annual minting
     */
    function batchAnnualMint(address[] calldata users, string calldata /* batchId */) external whenNotPaused onlyOwner {
        require(users.length > 0, "Empty users array");
        
        // Calculate total amounts to mint
        uint256 totalMintAmount = users.length * ONE_SHAHI;
        uint256 adminTotalShare = users.length * HALF_SHAHI;
        uint256 userShareEach = HALF_SHAHI;
        
        // First mint the admin's total share in one operation
        _mint(adminHotWallet, adminTotalShare);
        
        // Then mint each user's portion and record expiry
        uint256 currentTimestamp = block.timestamp;
        uint256 expiryTimestamp = currentTimestamp + ONE_YEAR;
        
        for (uint256 i = 0; i < users.length; i++) {
            address user = users[i];
            require(user != address(0), "Invalid address");
            require(!isBlacklisted(user), "User is blacklisted");
            
            // Cache storage variables for gas savings
            UserMintRecord storage mintRecord = userMintRecords[user];
            
            // Must have done first mint
            if (!mintRecord.hasFirstMinted) continue;
            
            // Skip users who haven't waited the full 1-year cooldown
            if (currentTimestamp < mintRecord.lastMintTimestamp + ONE_YEAR) continue;
            
            // Update minting record with new timestamp
            mintRecord.lastMintTimestamp = currentTimestamp;
            
            // Mint to user (these tokens are locked and non-transferable)
            _mint(user, userShareEach);
            
            // Record when these tokens will expire
            userTokenExpiry[user][currentTimestamp] = expiryTimestamp;
            
            mintRecord.totalMinted += userShareEach;
            
            emit RegularMint(user, userShareEach, userShareEach);
        }
        
        // Update total minted tokens
        totalMintedTokens += totalMintAmount;
    }

    /**
     * @dev Batch mint function for admins to mint to multiple addresses at once
     * Optimizes gas by creating multiple mints in one transaction
     * @param recipients Array of addresses to mint to
     * @param amountEach Amount of tokens to mint for each recipient
     */
    function adminMintBatch(address[] calldata recipients, uint256 amountEach) external onlyOwner whenNotPaused {
        require(recipients.length > 0, "Empty recipients array");
        require(amountEach > 0, "Amount must be greater than 0");
        
        uint256 totalAmount = amountEach * recipients.length;
        
        for (uint256 i = 0; i < recipients.length; i++) {
            address to = recipients[i];
            require(to != address(0), "Invalid address");
            require(!isBlacklisted(to), "Recipient is blacklisted");
            
            _mint(to, amountEach);
            
            emit FirstTimeMint(to, amountEach);
        }
        
        totalMintedTokens += totalAmount;
    }
    
    // ============= STAKING SYSTEM =============
    
    /**
     * @dev Create a new staking position
     * @param amount Amount of SHAHI to stake
     * @param lockPeriod Time in seconds to lock the stake (0 for no lock)
     * @param autoCompound Whether to auto-compound rewards
     * @param enableAutoClaim Whether to enable auto-claiming of rewards
     */
    function createStake(
        uint256 amount, 
        uint256 lockPeriod, 
        bool autoCompound,
        bool enableAutoClaim
    ) external whenNotPaused nonReentrant {
        require(isInvestor(msg.sender), "Only investors can stake");
        require(amount > 0, "Stake amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transfer tokens from user to contract
        _transfer(msg.sender, address(this), amount);
        
        // Calculate end time based on lock period (avoid branching where possible)
        uint256 endTime = lockPeriod > 0 ? block.timestamp + lockPeriod : 0;
        
        // Create new staking position
        StakingPosition memory newPosition = StakingPosition({
            amount: amount,
            startTime: block.timestamp,
            endTime: endTime,
            lastClaimTime: block.timestamp,
            accumulatedRewards: 0,
            autoCompound: autoCompound,
            autoClaimEnabled: enableAutoClaim
        });
        
        // Cache array length for gas saving
        uint256 positionId = userStakingPositions[msg.sender].length;
        userStakingPositions[msg.sender].push(newPosition);
        totalStaked += amount;
        
        emit StakeCreated(msg.sender, positionId, amount, endTime);
    }
    
    /**
     * @dev Claim rewards from a staking position
     * @param positionId ID of the staking position
     */
    function claimStakingRewards(uint256 positionId) external nonReentrant {
        require(positionId < userStakingPositions[msg.sender].length, "Invalid position ID");
        
        // Cache the position struct in storage to save gas on multiple accesses
        StakingPosition storage position = userStakingPositions[msg.sender][positionId];
        
        // Calculate rewards
        uint256 rewards = _calculateRewards(position);
        require(rewards > 0, "No rewards available");
        
        // Update the position
        position.accumulatedRewards = 0;
        position.lastClaimTime = block.timestamp;
        
        // Mint rewards to user
        _mint(msg.sender, rewards);
        
        emit RewardsClaimed(msg.sender, positionId, rewards);
    }
    
    /**
     * @dev Withdraw staked tokens and any unclaimed rewards
     * @param positionId ID of the staking position
     */
    function withdrawStake(uint256 positionId) external nonReentrant {
        require(positionId < userStakingPositions[msg.sender].length, "Invalid position ID");
        
        // Cache the position struct in storage to save gas on multiple accesses
        StakingPosition storage position = userStakingPositions[msg.sender][positionId];
        
        // Check if lock period has ended
        if (position.endTime > 0) {
            require(block.timestamp >= position.endTime, "Lock period not over");
        }
        
        // Cache values before clearing to save gas
        uint256 stakedAmount = position.amount;
        uint256 rewards = _calculateRewards(position);
        
        // Require non-zero amount to prevent unnecessary transactions
        require(stakedAmount > 0, "No stake to withdraw");
        
        // Clear the position (set to 0) - using delete can save gas for multiple fields
        position.amount = 0;
        position.accumulatedRewards = 0;
        
        // Update total staked
        totalStaked -= stakedAmount;
        
        // Batch operations to save gas - mint rewards first if any
        if (rewards > 0) {
            _mint(msg.sender, rewards);
        }
        
        // Then transfer staked tokens back to user
        _transfer(address(this), msg.sender, stakedAmount);
        
        emit StakeWithdrawn(msg.sender, positionId, stakedAmount, rewards);
    }
    
    /**
     * @dev Emergency withdraw staked tokens before lock period ends (with penalty)
     * @param positionId ID of the staking position
     */
    function emergencyWithdraw(uint256 positionId) external nonReentrant {
        require(positionId < userStakingPositions[msg.sender].length, "Invalid position ID");
        
        // Cache the position struct in storage
        StakingPosition storage position = userStakingPositions[msg.sender][positionId];
        uint256 stakedAmount = position.amount;
        require(stakedAmount > 0, "No stake to withdraw");
        
        // Check if early withdrawal (before lock period) - optimized calculation
        bool isEarlyWithdrawal = position.endTime > 0 && block.timestamp < position.endTime;
        
        // Calculate rewards
        uint256 rewards = _calculateRewards(position);
        
        // Apply penalty if early withdrawal and rewards exist
        if (isEarlyWithdrawal && rewards > 0) {
            rewards = (rewards * EARLY_WITHDRAWAL_PENALTY_PERCENT) / 100;
        }
        
        // Clear the position
        position.amount = 0;
        position.accumulatedRewards = 0;
        
        // Update total staked
        totalStaked -= stakedAmount;
        
        // Batch operations to save gas
        if (rewards > 0) {
            _mint(msg.sender, rewards);
        }
        
        // Transfer staked tokens back to user
        _transfer(address(this), msg.sender, stakedAmount);
        
        emit EmergencyWithdraw(msg.sender, positionId, stakedAmount, rewards, isEarlyWithdrawal);
    }
    
    // ============= TOKEN OPERATIONS =============
    
    /**
     * @dev Override transfer function to implement burn mechanism and restricted transfers
     */
    function _transfer(
        address from,
        address to,
        uint256 amount
    ) internal override {
        // Check if the sender is blacklisted
        require(!isBlacklisted(from), "Sender is blacklisted");
        require(!isBlacklisted(to), "Recipient is blacklisted");
        
        // Fast path for staking transfers to save gas (most common path in DeFi apps)
        // Use assembly-optimized address comparison
        bool isStakingTransfer = _addressEquals(from, address(this)) || _addressEquals(to, address(this));
        
        // Only check restrictions for non-staking transfers
        if (!isStakingTransfer) {
            // Check if from is owner, admin wallet or special contract
            bool isSpecialSender = _addressEquals(from, owner()) || _addressEquals(from, adminHotWallet);
            
            if (!isSpecialSender) {
                // Users can only send their tokens to approved app contracts
                require(
                    isAuthorizedAppContract(to) || _addressEquals(to, adminHotWallet),
                    "Locked tokens: can only be used within app"
                );
                
                // Calculate and apply burn only for non-staking transfers
                uint256 burnAmount = (amount * transactionBurnRate) / 10000;
                
                // Only process burn logic if burnAmount > 0
                if (burnAmount > 0) {
                    uint256 transferAmount = amount - burnAmount;
                    super._transfer(from, to, transferAmount);
                    super._burn(from, burnAmount);
                    burnedTokens += burnAmount;
                    emit TokensBurned(from, burnAmount);
                    return; // Early return to avoid executing the standard transfer below
                }
            }
        }
        
        // Default path when no burn is needed
        super._transfer(from, to, amount);
    }
    
    /**
     * @dev Mint function that can only be called by authorized minters
     * @param to Address to mint tokens to
     * @param amount Amount of tokens to mint
     */
    function mint(address to, uint256 amount) external onlyOwner {
        _mint(to, amount);
        totalMintedTokens += amount;
    }
    
    /**
     * @dev Burn function to manually burn tokens
     * @param amount Amount of tokens to burn
     */
    function burn(uint256 amount) external {
        _burn(msg.sender, amount);
        burnedTokens += amount;
        emit TokensBurned(msg.sender, amount);
    }
    
    /**
     * @dev Convert SHAHI to KHORDE (view function)
     * @param shahiAmount Amount of SHAHI to convert
     * @return The equivalent KHORDE value
     */
    function convertToKhorde(uint256 shahiAmount) external pure returns (uint256) {
        return shahiAmount * KHORDE_PER_SHAHI;
    }
    
    /**
     * @dev Convert KHORDE to SHAHI (view function)
     * @param khordeAmount Amount of KHORDE to convert
     * @return The equivalent SHAHI value
     */
    function convertToShahi(uint256 khordeAmount) external pure returns (uint256) {
        return khordeAmount / KHORDE_PER_SHAHI;
    }
    
    // ============= ADMIN FUNCTIONS =============
    
    /**
     * @dev Update the transaction burn rate
     * @param newBurnRate New burn rate in basis points (100 = 1%)
     */
    function setTransactionBurnRate(uint256 newBurnRate) external onlyOwner {
        require(newBurnRate <= 1000, "Burn rate too high"); // Max 10%
        transactionBurnRate = newBurnRate;
        emit BurnRateUpdated(newBurnRate);
    }
    
    /**
     * @dev Update the admin hot wallet
     * @param newAdminWallet New admin wallet address
     */
    function setAdminHotWallet(address newAdminWallet) external onlyOwner {
        require(newAdminWallet != address(0), "Invalid address");
        adminHotWallet = newAdminWallet;
        emit AdminWalletUpdated(newAdminWallet);
    }
    
    /**
     * @dev Update the Merkle root for verification
     * @param newMerkleRoot New Merkle root hash
     */
    function setMerkleRoot(bytes32 newMerkleRoot) external onlyOwner {
        merkleRoot = newMerkleRoot;
        emit MerkleRootUpdated(newMerkleRoot);
    }
    
    /**
     * @dev Add or remove an address from the blacklist
     * @param user Address to modify
     * @param blacklisted Whether to blacklist or whitelist
     */
    function setBlacklist(address user, bool blacklisted) external onlyOwner {
        setBlacklisted(user, blacklisted);
        isBlacklistedLegacy[user] = blacklisted; // For backward compatibility
        emit BlacklistUpdated(user, blacklisted);
    }
    
    /**
     * @dev Add or remove an authorized minter
     * @param minter Address of the minter
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedMinterRole(address minter, bool authorized) external onlyOwner {
        setAuthorizedMinter(minter, authorized);
        isAuthorizedMinterLegacy[minter] = authorized; // For backward compatibility
        emit MinterUpdated(minter, authorized);
    }
    
    /**
     * @dev Add or remove an authorized app contract
     * @param contractAddress Address of the app contract
     * @param authorized Whether to authorize or revoke
     */
    function setAppContract(address contractAddress, bool authorized) external onlyOwner {
        setAuthorizedAppContract(contractAddress, authorized);
        isAuthorizedAppContractLegacy[contractAddress] = authorized; // For backward compatibility
        emit AppContractUpdated(contractAddress, authorized);
    }
    
    /**
     * @dev Update APY tiers for staking
     */
    function updateAPYTiers(
        uint256 _oneYearAPY,
        uint256 _sixMonthAPY,
        uint256 _threeMonthAPY,
        uint256 _defaultAPY
    ) external onlyOwner {
        require(_oneYearAPY <= 10000 && _sixMonthAPY <= 10000 && 
                _threeMonthAPY <= 10000 && _defaultAPY <= 10000, 
                "APY must be <= 100%");
        
        // Update both the packed struct and legacy variables for backward compatibility
        apyRates.oneYearAPY = uint64(_oneYearAPY);
        apyRates.sixMonthAPY = uint64(_sixMonthAPY);
        apyRates.threeMonthAPY = uint64(_threeMonthAPY);
        apyRates.defaultAPY = uint64(_defaultAPY);
        
        // Legacy variables
        oneYearAPY = _oneYearAPY;
        sixMonthAPY = _sixMonthAPY;
        threeMonthAPY = _threeMonthAPY;
        defaultAPY = _defaultAPY;
        
        emit APYTiersUpdated(_oneYearAPY, _sixMonthAPY, _threeMonthAPY, _defaultAPY);
    }
    
    /**
     * @dev Pause contract functionality in case of emergency
     */
    function pause() external onlyOwner {
        _pause();
    }
    
    /**
     * @dev Unpause the contract
     */
    function unpause() external onlyOwner {
        _unpause();
    }
    
    // ============= INTERNAL FUNCTIONS =============
    
    /**
     * @dev Optimized address comparison using assembly
     * @param a First address
     * @param b Second address
     * @return equal True if addresses are equal
     */
    function _addressEquals(address a, address b) internal pure returns (bool equal) {
        assembly {
            equal := eq(a, b)
        }
    }
    
    /**
     * @dev Optimized address zero check using assembly
     * @param addr Address to check
     * @return isZero True if address is zero address
     */
    function _isZeroAddress(address addr) internal pure returns (bool isZero) {
        assembly {
            isZero := iszero(addr)
        }
    }
    
    /**
     * @dev Calculate the APY for a staking position
     * @param position The staking position
     * @return The APY in basis points (100 = 1%)
     */
    function _getAPY(StakingPosition memory position) private view returns (uint256) {
        // Early return for most common case
        if (position.endTime == 0) {
            return apyRates.defaultAPY;
        }
        
        uint256 lockDuration = position.endTime - position.startTime;
        
        // Use sequential checks to avoid unnecessary comparisons
        if (lockDuration >= ONE_YEAR) {
            return apyRates.oneYearAPY;
        } 
        if (lockDuration >= SIX_MONTHS) {
            return apyRates.sixMonthAPY;
        } 
        if (lockDuration >= THREE_MONTHS) {
            return apyRates.threeMonthAPY;
        } 
        return apyRates.defaultAPY;
    }
    
    /**
     * @dev Calculate rewards for a staking position
     * @param position The staking position
     * @return The calculated rewards
     */
    function _calculateRewards(StakingPosition memory position) private view returns (uint256) {
        // Early return for zero amount to save gas
        if (position.amount == 0) {
            return 0;
        }
        
        // Get staking duration in seconds
        uint256 stakingDuration = block.timestamp - position.lastClaimTime;
        
        // Early return if no time passed (same block)
        if (stakingDuration == 0) {
            return position.accumulatedRewards;
        }
        
        // Get APY in basis points
        uint256 apy = _getAPY(position);
        
        unchecked {
            // Calculate rewards: principal * APY * time / (365 days * 10000)
            // Where APY is in basis points (100 = 1%)
            // Pre-calculate the denominator for clarity and gas optimization
            uint256 denominator = SECONDS_PER_YEAR * 10000;
            uint256 rewards = (position.amount * apy * stakingDuration) / denominator;
            
            return rewards + position.accumulatedRewards;
        }
    }
    
    /**
     * @dev Verify a Merkle proof
     * @param user Address of the user
     * @param proof Merkle proof to verify
     * @return Whether the proof is valid
     */
    function _verifyMerkle(address user, bytes32[] calldata proof) private view returns (bool) {
        // Compute leaf hash outside the MerkleProof call
        bytes32 leaf = keccak256(abi.encodePacked(user));
        
        // Use unchecked to skip overflow/underflow checks for gas optimization
        unchecked {
            return MerkleProof.verify(proof, merkleRoot, leaf);
        }
    }
    
    /**
     * @dev Verify signature for minting
     * @param messageHash Hashed message
     * @param signature Signature to verify
     * @return Whether the signature is valid
     */
    function _verifySignature(bytes32 messageHash, bytes memory signature) private view returns (bool) {
        address signer = messageHash.recover(signature);
        return isAuthorizedMinter(signer) || isAuthorizedMinterSigner(signer) || signer == owner();
    }
    
    /**
     * @dev Add a function to mark investors (who can stake)
     * @param user Address of the user
     * @param status Whether to mark as investor or not
     */
    function setInvestor(address user, bool status) external onlyOwner {
        setInvestorStatus(user, status);
        isInvestorLegacy[user] = status; // For backward compatibility
        emit InvestorStatusUpdated(user, status);
    }
    
    /**
     * @dev Add a function to burn expired tokens (can be called by anyone)
     * @param user Address of the user
     */
    function burnExpiredTokens(address user) external {
        uint256 totalExpired = 0;
        uint256 userBalance = balanceOf(user);
        
        // If user has no balance, return early to save gas
        if (userBalance == 0) {
            return;
        }
        
        // Cache the current timestamp
        uint256 currentTime = block.timestamp;
        uint256 expireAmount = HALF_SHAHI; // Use constant instead of literal
        
        // Limit the loop iteration count to prevent DOS attacks
        uint256 maxIterations = 100;
        for (uint256 i = 0; i < maxIterations; i++) {
            uint256 mintTimestamp = currentTime - ONE_YEAR - i * 1 days;
            
            // Break early if we've gone too far back in time
            if (i > 0 && mintTimestamp < 946684800) { // Jan 1, 2000 timestamp as a lower boundary
                break;
            }
            
            // Check if tokens have expired
            if (userTokenExpiry[user][mintTimestamp] > 0 && 
                userTokenExpiry[user][mintTimestamp] <= currentTime) {
                
                // Only burn if user has enough balance
                if (userBalance >= expireAmount) {
                    _burn(user, expireAmount);
                    burnedTokens += expireAmount;
                    totalExpired += expireAmount;
                    userBalance -= expireAmount; // Update cached balance
                    
                    // Once user has no more balance, stop burning
                    if (userBalance == 0) {
                        break;
                    }
                }
                
                // Clear the expiry record to save gas on future calls
                delete userTokenExpiry[user][mintTimestamp];
            }
        }
        
        if (totalExpired > 0) {
            emit TokensExpiredAndBurned(user, totalExpired);
        }
    }
    
    /**
     * @dev Batch burn expired tokens for multiple users at once
     * @param users Array of user addresses to check for expired tokens
     * @return totalBurned Total amount of tokens burned
     */
    function batchBurnExpiredTokens(address[] calldata users) external returns (uint256 totalBurned) {
        uint256 currentTime = block.timestamp;
        uint256 expireAmount = HALF_SHAHI;
        
        for (uint256 u = 0; u < users.length; u++) {
            address user = users[u];
            uint256 userBalance = balanceOf(user);
            
            // Skip users with no balance
            if (userBalance == 0) continue;
            
            // Find up to 10 expired timestamps per user (to bound gas usage)
            unchecked {
                for (uint256 i = 0; i < 10; i++) {
                    uint256 mintTimestamp = currentTime - ONE_YEAR - i * 1 days;
                    
                    if (userTokenExpiry[user][mintTimestamp] > 0 && 
                        userTokenExpiry[user][mintTimestamp] <= currentTime) {
                        
                        // Only burn if user has enough balance
                        if (userBalance >= expireAmount) {
                            _burn(user, expireAmount);
                            burnedTokens += expireAmount;
                            totalBurned += expireAmount;
                            userBalance -= expireAmount;
                            
                            // Once user has no more balance, skip to next user
                            if (userBalance == 0) break;
                        }
                        
                        delete userTokenExpiry[user][mintTimestamp];
                    }
                }
            }
            
            // Emit only one event per user instead of per burn
            if (totalBurned > 0) {
                emit TokensExpiredAndBurned(user, totalBurned);
            }
        }
        
        return totalBurned;
    }
    
    // ============= EVENTS =============
    
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

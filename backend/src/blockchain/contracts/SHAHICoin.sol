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
        
        // Mint initial supply to the contract owner
        _mint(msg.sender, initialSupply * (10 ** decimals()));
        totalMintedTokens = initialSupply * (10 ** decimals());
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
        require(!isBlacklisted[user], "User is blacklisted");
        require(!userMintRecords[user].hasFirstMinted, "Already claimed first mint");
        require(_verifyMerkle(user, proof), "Invalid proof");
        
        // Create unique device identifier
        bytes32 userDeviceKey = keccak256(abi.encodePacked(user, deviceId));
        
        // Verify this is a unique visit for this device+user combination
        require(!usedProofs[userDeviceKey], "Already minted from this device");
        
        // Record this visit to prevent duplicate minting
        usedProofs[userDeviceKey] = true;
        
        // Mark as first minted and record timestamp
        userMintRecords[user].hasFirstMinted = true;
        userMintRecords[user].lastMintTimestamp = block.timestamp;
        
        // For the admin/first user, mint 110 SHAHI to admin hot wallet
        if (user == owner()) {
            uint256 mintAmount = 110 * (10 ** decimals());
            _mint(adminHotWallet, mintAmount);
            totalMintedTokens += mintAmount;
            userMintRecords[user].totalMinted += mintAmount;
            emit FirstTimeMint(user, mintAmount);
        } else {
            // For all other first-time users, mint 1 SHAHI and split 50/50
            uint256 mintAmount = 1 * (10 ** decimals());
            uint256 adminShare = mintAmount / 2;
            uint256 userShare = mintAmount - adminShare;
            
            // Mint shares to respective wallets
            _mint(adminHotWallet, adminShare);
            _mint(user, userShare);
            
            // Record when these tokens will expire (1 year from now)
            userTokenExpiry[user][block.timestamp] = block.timestamp + ONE_YEAR;
            
            totalMintedTokens += mintAmount;
            userMintRecords[user].totalMinted += mintAmount;
            emit RegularMint(user, adminShare, userShare);
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
        require(!isBlacklisted[user], "User is blacklisted");
        require(userMintRecords[user].hasFirstMinted, "Must claim first mint first");
        
        // Verify 1-year cooldown period
        require(
            block.timestamp >= userMintRecords[user].lastMintTimestamp + ONE_YEAR,
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
        userMintRecords[user].lastMintTimestamp = block.timestamp;
        
        // Mint 1 SHAHI (split between admin and user)
        uint256 mintAmount = 1 * (10 ** decimals());
        uint256 adminShare = mintAmount / 2;
        uint256 userShare = mintAmount - adminShare;
        
        // Mint to admin hot wallet
        _mint(adminHotWallet, adminShare);
        
        // Mint to user (these tokens are locked and non-transferable)
        _mint(user, userShare);
        
        // Record when these tokens will expire (1 year from now)
        userTokenExpiry[user][block.timestamp] = block.timestamp + ONE_YEAR;
        
        totalMintedTokens += mintAmount;
        userMintRecords[user].totalMinted += mintAmount;
        
        emit RegularMint(user, adminShare, userShare);
    }
    
    /**
     * @dev Deprecated - use annualMint instead
     * This function is kept for backward compatibility
     */
    function regularMint(address user, bytes calldata signature, string calldata deviceId) external whenNotPaused nonReentrant {
        // Forward to annualMint with the same parameters
        this.annualMint(user, signature, deviceId);
    }
    
    /**
     * @dev Direct minting for new users by authorized minters without proof verification
     * Used by the backend services when a new user connects with wallet
     * Mints 1 SHAHI token with 50/50 split between admin and user
     * @param user Address of the new user
     */
    function mintForNewUser(address user) external whenNotPaused {
        require(msg.sender == owner() || isAuthorizedMinter[msg.sender], "Only owner or authorized minter");
        require(user != address(0), "Invalid address");
        require(!isBlacklisted[user], "User is blacklisted");
        
        // Don't mint if user has already done first-time minting
        if (userMintRecords[user].hasFirstMinted) {
            return;
        }
        
        // Mark as first minted and record timestamp
        userMintRecords[user].hasFirstMinted = true;
        userMintRecords[user].lastMintTimestamp = block.timestamp;
        
        // Standard 1 SHAHI mint with 50/50 split (same as regular first-time minting)
        uint256 mintAmount = 1 * (10 ** decimals());
        uint256 adminShare = mintAmount / 2;
        uint256 userShare = mintAmount - adminShare;
        
        // Mint shares to respective wallets
        _mint(adminHotWallet, adminShare);
        _mint(user, userShare);
        
        // Record when these tokens will expire (1 year from now)
        userTokenExpiry[user][block.timestamp] = block.timestamp + ONE_YEAR;
        
        totalMintedTokens += mintAmount;
        userMintRecords[user].totalMinted += mintAmount;
        
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
        require(!isBlacklisted[to], "User is blacklisted");
        
        _mint(to, amount);
        totalMintedTokens += amount;
        
        // Use FirstTimeMint event for consistency with other minting functions
        emit FirstTimeMint(to, amount);
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
        require(isInvestor[msg.sender], "Only investors can stake");
        require(amount > 0, "Stake amount must be greater than 0");
        require(balanceOf(msg.sender) >= amount, "Insufficient balance");
        
        // Transfer tokens from user to contract
        _transfer(msg.sender, address(this), amount);
        
        // Calculate end time based on lock period
        uint256 endTime = 0;
        if (lockPeriod > 0) {
            endTime = block.timestamp + lockPeriod;
        }
        
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
        
        userStakingPositions[msg.sender].push(newPosition);
        totalStaked += amount;
        
        emit StakeCreated(msg.sender, userStakingPositions[msg.sender].length - 1, amount, endTime);
    }
    
    /**
     * @dev Claim rewards from a staking position
     * @param positionId ID of the staking position
     */
    function claimStakingRewards(uint256 positionId) external nonReentrant {
        require(positionId < userStakingPositions[msg.sender].length, "Invalid position ID");
        
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
        
        StakingPosition storage position = userStakingPositions[msg.sender][positionId];
        
        // Check if lock period has ended
        if (position.endTime > 0) {
            require(block.timestamp >= position.endTime, "Lock period not over");
        }
        
        // Calculate rewards
        uint256 rewards = _calculateRewards(position);
        
        // Get the staked amount
        uint256 stakedAmount = position.amount;
        
        // Clear the position (set to 0)
        position.amount = 0;
        position.accumulatedRewards = 0;
        
        // Update total staked
        totalStaked -= stakedAmount;
        
        // Transfer staked tokens back to user
        _transfer(address(this), msg.sender, stakedAmount);
        
        // Mint rewards to user
        if (rewards > 0) {
            _mint(msg.sender, rewards);
        }
        
        emit StakeWithdrawn(msg.sender, positionId, stakedAmount, rewards);
    }
    
    /**
     * @dev Emergency withdraw staked tokens before lock period ends (with penalty)
     * @param positionId ID of the staking position
     */
    function emergencyWithdraw(uint256 positionId) external nonReentrant {
        require(positionId < userStakingPositions[msg.sender].length, "Invalid position ID");
        
        StakingPosition storage position = userStakingPositions[msg.sender][positionId];
        require(position.amount > 0, "No stake to withdraw");
        
        // Check if early withdrawal (before lock period)
        bool isEarlyWithdrawal = position.endTime > 0 && block.timestamp < position.endTime;
        
        // Calculate rewards (with penalty for early withdrawal)
        uint256 rewards = _calculateRewards(position);
        if (isEarlyWithdrawal && rewards > 0) {
            rewards = (rewards * EARLY_WITHDRAWAL_PENALTY_PERCENT) / 100;
        }
        
        // Get the staked amount
        uint256 stakedAmount = position.amount;
        
        // Clear the position
        position.amount = 0;
        position.accumulatedRewards = 0;
        
        // Update total staked
        totalStaked -= stakedAmount;
        
        // Transfer staked tokens back to user
        _transfer(address(this), msg.sender, stakedAmount);
        
        // Mint rewards to user (if any after penalty)
        if (rewards > 0) {
            _mint(msg.sender, rewards);
        }
        
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
        require(!isBlacklisted[from], "Sender is blacklisted");
        require(!isBlacklisted[to], "Recipient is blacklisted");
        
        // Implement restriction for locked tokens
        // Users can only send their tokens to approved app contracts
        // This implements the "locked and can't trade" requirement
        if (from != owner() && from != adminHotWallet && to != address(this)) {
            require(
                isAuthorizedAppContract[to] || to == adminHotWallet,
                "Locked tokens: can only be used within app"
            );
        }
        
        // Calculate burn amount based on transaction fee (if applicable)
        uint256 burnAmount = 0;
        if (from != address(this) && to != address(this)) { // Exclude staking transactions
            burnAmount = (amount * transactionBurnRate) / 10000;
        }
        
        // Reduce the transfer amount by the burn amount
        uint256 transferAmount = amount - burnAmount;
        
        // Execute the transfer
        super._transfer(from, to, transferAmount);
        
        // Burn tokens if applicable
        if (burnAmount > 0) {
            super._burn(from, burnAmount);
            burnedTokens += burnAmount;
            emit TokensBurned(from, burnAmount);
        }
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
        isBlacklisted[user] = blacklisted;
        emit BlacklistUpdated(user, blacklisted);
    }
    
    /**
     * @dev Add or remove an authorized minter
     * @param minter Address of the minter
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedMinter(address minter, bool authorized) external onlyOwner {
        isAuthorizedMinter[minter] = authorized;
        emit MinterUpdated(minter, authorized);
    }
    
    /**
     * @dev Add or remove an authorized app contract
     * @param contractAddress Address of the app contract
     * @param authorized Whether to authorize or revoke
     */
    function setAuthorizedAppContract(address contractAddress, bool authorized) external onlyOwner {
        isAuthorizedAppContract[contractAddress] = authorized;
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
     * @dev Calculate the APY for a staking position
     * @param position The staking position
     * @return The APY in basis points (100 = 1%)
     */
    function _getAPY(StakingPosition memory position) internal view returns (uint256) {
        if (position.endTime == 0) {
            return defaultAPY; // No lock period
        }
        
        uint256 lockDuration = position.endTime - position.startTime;
        
        if (lockDuration >= ONE_YEAR) {
            return oneYearAPY;
        } else if (lockDuration >= SIX_MONTHS) {
            return sixMonthAPY;
        } else if (lockDuration >= THREE_MONTHS) {
            return threeMonthAPY;
        } else {
            return defaultAPY;
        }
    }
    
    /**
     * @dev Calculate rewards for a staking position
     * @param position The staking position
     * @return The calculated rewards
     */
    function _calculateRewards(StakingPosition memory position) internal view returns (uint256) {
        if (position.amount == 0) {
            return 0;
        }
        
        // Get staking duration in seconds
        uint256 stakingDuration = block.timestamp - position.lastClaimTime;
        
        // Get APY in basis points
        uint256 apy = _getAPY(position);
        
        // Calculate rewards: principal * APY * time / (365 days * 10000)
        // Where APY is in basis points (100 = 1%)
        uint256 rewards = (position.amount * apy * stakingDuration) / (365 days * 10000);
        
        return rewards + position.accumulatedRewards;
    }
    
    /**
     * @dev Verify a Merkle proof
     * @param user Address of the user
     * @param proof Merkle proof to verify
     * @return Whether the proof is valid
     */
    function _verifyMerkle(address user, bytes32[] calldata proof) internal view returns (bool) {
        bytes32 leaf = keccak256(abi.encodePacked(user));
        return MerkleProof.verify(proof, merkleRoot, leaf);
    }
    
    /**
     * @dev Verify signature for minting
     * @param messageHash Hashed message
     * @param signature Signature to verify
     * @return Whether the signature is valid
     */
    function _verifySignature(bytes32 messageHash, bytes memory signature) internal view returns (bool) {
        address signer = messageHash.recover(signature);
        return isAuthorizedMinter[signer] || signer == owner();
    }
    
    /**
     * @dev Add a function to mark investors (who can stake)
     * @param user Address of the user
     * @param status Whether to mark as investor or not
     */
    function setInvestor(address user, bool status) external onlyOwner {
        isInvestor[user] = status;
        emit InvestorStatusUpdated(user, status);
    }
    
    /**
     * @dev Add a function to burn expired tokens (can be called by anyone)
     * @param user Address of the user
     */
    function burnExpiredTokens(address user) external {
        uint256 totalExpired = 0;
        
        // Check each batch of minted tokens
        for (uint256 i = 0; i < 100; i++) {
            uint256 mintTimestamp = block.timestamp - ONE_YEAR - i * 1 days;
            
            if (mintTimestamp < 0) break;
            
            if (userTokenExpiry[user][mintTimestamp] > 0 && 
                userTokenExpiry[user][mintTimestamp] <= block.timestamp) {
                // Changed from 0.5 to 5e17 (0.5 in wei)
                uint256 expireAmount = 5e17;
                
                if (balanceOf(user) >= expireAmount) {
                    _burn(user, expireAmount);
                    burnedTokens += expireAmount;
                    totalExpired += expireAmount;
                }
                
                delete userTokenExpiry[user][mintTimestamp];
            }
        }
        
        if (totalExpired > 0) {
            emit TokensExpiredAndBurned(user, totalExpired);
        }
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

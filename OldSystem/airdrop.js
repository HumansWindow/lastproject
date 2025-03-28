const mongoose = require('mongoose');
const crypto = require('crypto');
const { ethers } = require('ethers');
const Redis = require('ioredis');
const RewardService = require('../services/rewardService');
const MonitoringService = require('../services/monitoringService');
const WalletValidation = require('../utils/walletValidation');
const {
    WalletError,
    ReferralError,
    RewardError,
    SecurityError,
    RateLimitError
} = require('./errors/modelErrors');

// Initialize Redis client
const redis = new Redis({
    host: process.env.REDIS_HOST || 'localhost',
    port: process.env.REDIS_PORT || 6379,
    retryStrategy: (times) => Math.min(times * 50, 2000)
});

// Cache keys
const CACHE_KEYS = {
    USER_STATS: (walletAddress) => `stats:${walletAddress}`,
    REFERRAL_COUNT: (walletAddress) => `referrals:${walletAddress}`,
    REWARDS: (walletAddress) => `rewards:${walletAddress}`
};

// Cache TTL in seconds
const CACHE_TTL = {
    STATS: 300,        // 5 minutes
    REFERRALS: 600,    // 10 minutes
    REWARDS: 300       // 5 minutes
};

// Import shared constants
const {
    SECURITY_SETTINGS,
    TOKEN_AMOUNTS,
    COOLDOWN_PERIODS,
    REWARD_SYSTEM
} = require('../constants/config');

// Referral history schema
const referralHistorySchema = new mongoose.Schema({
    referredUser: {
        type: String,
        required: true,
        lowercase: true
    },
    timestamp: { type: Date, default: Date.now },
    rewardPaid: { type: Boolean, default: false },
    status: {
        type: String,
        enum: ['pending', 'active', 'rewarded', 'rejected'],
        default: 'pending'
    },
    deviceId: String,
    ipAddress: String,
    fraudScore: Number,
    verificationStatus: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'suspicious'],
        default: 'pending'
    }
});

// Main airdrop schema
const airdropSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true
    },
    referralCode: {
        type: String
        // Remove any index or unique declarations here
    },
    referredBy: { type: String, default: null },
    referralCount: { type: Number, default: 0 },
    referralHistory: [referralHistorySchema],
    // Rewards tracking
    lockedRewards: { type: Number, default: 0 },
    totalReferralRewards: { type: Number, default: 0 },
    lastRewardClaim: Date,
    // KHORDE validation
    hasKhordePurchase: { type: Boolean, default: false },
    khordeBalance: { type: Number, default: 0 },
    // Session tracking
    lastActive: Date,
    sessions: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Session' }],
    createdAt: { type: Date, default: Date.now },
    // New reward tracking fields
    rewardBalance: { type: Number, default: 0 },
    totalRewardsEarned: { type: Number, default: 0 },
    claimedRewards: { type: Number, default: 0 },
    walletConnected: { type: Boolean, default: false },
    referralMilestones: [{
        tier: Number,
        achieved: { type: Boolean, default: false },
        rewardClaimed: { type: Boolean, default: false }
    }]
}, {
    timestamps: true
});

// Define indexes in one place
airdropSchema.index({ walletAddress: 1 }, { unique: true });
airdropSchema.index({ referralCode: 1 }, { unique: true, sparse: true });
airdropSchema.index({ 'referralHistory.deviceId': 1 });
airdropSchema.index({ 'referralHistory.ipAddress': 1 });

// Methods
airdropSchema.methods = {
    // Generate unique referral code
    async generateReferralCode() {
        if (this.referralCode) return this.referralCode;
        
        const code = crypto
            .createHash('sha256')
            .update(this.walletAddress + Date.now())
            .digest('hex')
            .substring(0, 8)
            .toUpperCase();

        this.referralCode = code;
        // Don't save here, let the pre-save middleware handle it
        return code;
    },

    // Validate referral attempt
    async validateReferral(referredUser, deviceId, ipAddress) {
        // Validate wallet address format and ownership
        const walletValidation = await WalletValidation.validateWallet(this.walletAddress);
        
        if (!walletValidation.isValid) {
            return { 
                isValid: false, 
                reason: 'Invalid wallet address' 
            };
        }

        // Verify KHORDE ownership
        if (!walletValidation.khordeOwnership.hasKhorde) {
            return { 
                isValid: false, 
                reason: 'Referrer must own KHORDE tokens' 
            };
        }

        // Check wallet age
        if (walletValidation.walletAge.isNew) {
            return { 
                isValid: false, 
                reason: 'Wallet must be at least 24 hours old' 
            };
        }

        // Update KHORDE balance
        this.khordeBalance = walletValidation.khordeOwnership.balance;
        this.hasKhordePurchase = true;

        // Calculate fraud score
        const fraudScore = await this.calculateFraudScore(referredUser, deviceId, ipAddress);
        if (fraudScore > SECURITY_SETTINGS.FRAUD_THRESHOLD) {
            return { isValid: false, reason: 'High fraud risk detected' };
        }

        return { 
            isValid: true, 
            fraudScore,
            walletValidation 
        };
    },

    // Add fraud score calculation
    async calculateFraudScore(referredUser, deviceId, ipAddress) {
        let score = 0;
        
        // Check for multiple referrals from same device
        const deviceReferrals = this.referralHistory.filter(r => r.deviceId === deviceId).length;
        if (deviceReferrals > 0) score += 0.3;
        
        // Check for multiple referrals from same IP
        const ipReferrals = this.referralHistory.filter(r => r.ipAddress === ipAddress).length;
        if (ipReferrals > 0) score += 0.2;
        
        // Check for rapid successive referrals
        const lastReferral = this.referralHistory[this.referralHistory.length - 1];
        if (lastReferral && Date.now() - lastReferral.timestamp < 300000) { // 5 minutes
            score += 0.2;
        }
        
        // Check if referred user exists in other referral histories
        const existingReferral = await this.constructor.findOne({
            'referralHistory.referredUser': referredUser.walletAddress
        });
        if (existingReferral) score += 0.3;
        
        return Math.min(1, score);
    },

    // Process reward claim
    async claimRewards() {
        try {
            await this.checkClaimRateLimit();

            const gamingCheck = await this.detectRewardGaming();
            if (gamingCheck.isGaming) {
                throw new SecurityError('Suspicious activity detected');
            }

            if (!this.walletConnected) {
                throw new WalletError('Wallet must be connected to claim rewards');
            }

            if (!this.canClaimRewards()) {
                throw new RewardError('Cannot claim rewards: requirements not met');
            }

            if (this.rewardBalance <= 0) {
                throw new RewardError('No rewards available to claim');
            }

            const periodMs = REWARD_SYSTEM.WITHDRAWAL_PERIOD;
            const cutoffDate = new Date(Date.now() - periodMs);

            // Get total rewards claimed in current period
            const claimedInPeriod = await this.constructor.aggregate([
                {
                    $match: {
                        walletAddress: this.walletAddress,
                        lastRewardClaim: { $gt: cutoffDate }
                    }
                },
                {
                    $group: {
                        _id: null,
                        totalClaimed: { $sum: "$claimedRewards" }
                    }
                }
            ]);

            const alreadyClaimedInPeriod = claimedInPeriod[0]?.totalClaimed || 0;
            const remainingAllowance = REWARD_SYSTEM.MAX_WITHDRAWAL_PER_PERIOD - alreadyClaimedInPeriod;

            // Calculate how much can be claimed now
            const claimAmount = Math.min(
                this.rewardBalance,
                Math.max(0, remainingAllowance)
            );

            if (claimAmount <= 0) {
                throw new Error(`Withdrawal limit reached. Next claim available in ${Math.ceil((periodMs - (Date.now() - this.lastRewardClaim)) / (24 * 60 * 60 * 1000))} days`);
            }

            // Attempt atomic update
            const updatedDoc = await this.constructor.findOneAndUpdate(
                { _id: this._id },
                {
                    $set: {
                        lastRewardClaim: new Date(),
                        rewardBalance: this.rewardBalance - claimAmount,
                        claimedRewards: this.claimedRewards + claimAmount
                    }
                },
                { new: true }
            );

            if (!updatedDoc) {
                throw new Error('Failed to process claim');
            }

            // Update local instance
            this.lastRewardClaim = updatedDoc.lastRewardClaim;
            this.rewardBalance = updatedDoc.rewardBalance;
            this.claimedRewards = updatedDoc.claimedRewards;

            // Calculate KHORDE amount
            const rewardsToKhorde = Number(claimAmount) * Number(REWARD_SYSTEM.REWARD_TO_KHORDE_RATIO);

            const claimResult = {
                claimed: claimAmount,
                khordeAmount: rewardsToKhorde,
                remainingRewards: this.rewardBalance,
                nextClaimDate: new Date(Date.now() + (remainingAllowance <= 0 ? periodMs : 0))
            };

            // Add monitoring
            await MonitoringService.trackReward(
                this.walletAddress,
                claimResult.claimed,
                'claim'
            );

            return claimResult;

        } catch (error) {
            if (error.name === 'WalletError' || 
                error.name === 'RewardError' || 
                error.name === 'SecurityError' || 
                error.name === 'RateLimitError') {
                throw error;
            }
            throw new SecurityError(error.message);
        }
    },

    // Add new method to claim YOU-ME rewards
    async claimYouMeRewards() {
        try {
            await this.checkClaimRateLimit();

            const gamingCheck = await this.detectRewardGaming();
            if (gamingCheck.isGaming) {
                throw new SecurityError('Suspicious activity detected');
            }

            if (!this.walletConnected) {
                throw new WalletError('Wallet must be connected to claim rewards');
            }

            if (this.rewardBalance <= 0) {
                throw new RewardError('No rewards available to claim');
            }

            // Get contract instance (you need to implement this)
            const contract = await RewardService.getContractInstance();

            // Update rewards count on blockchain
            const tx = await contract.updateRewardsCount(
                this.walletAddress,
                this.rewardBalance
            );
            await tx.wait();

            // Create claim transaction
            const claimTx = await contract.claimYouMeRewards();
            await claimTx.wait();

            // Update local state
            const previousBalance = this.rewardBalance;
            this.rewardBalance = 0;
            this.claimedRewards += previousBalance;
            this.lastRewardClaim = new Date();

            await this.save();

            // Add monitoring
            await MonitoringService.trackReward(
                this.walletAddress,
                previousBalance,
                'claim_you_me'
            );

            return {
                claimed: previousBalance,
                youMeAmount: previousBalance, // 1:1 ratio
                remainingRewards: 0,
                txHash: claimTx.hash
            };

        } catch (error) {
            if (error.name === 'WalletError' || 
                error.name === 'RewardError' || 
                error.name === 'SecurityError' || 
                error.name === 'RateLimitError') {
                throw error;
            }
            throw new SecurityError(error.message);
        }
    },

    // Get referral statistics
    getStats: async function() {
        const cacheKey = CACHE_KEYS.USER_STATS(this.walletAddress);
        
        // Try to get from cache first
        const cachedStats = await redis.get(cacheKey);
        if (cachedStats) {
            return JSON.parse(cachedStats);
        }

        // If not in cache, calculate stats
        const rewardsBreakdown = RewardService.getRewardsBreakdown(
            this.referralHistory.filter(r => r.status === 'active' && r.verificationStatus === 'verified').length
        );

        const stats = {
            ...rewardsBreakdown,
            activeReferrals: this.referralHistory.filter(r => r.status === 'active').length,
            pendingReferrals: this.referralHistory.filter(r => r.status === 'pending').length,
            rewardBalance: this.rewardBalance,
            totalRewardsEarned: this.totalRewardsEarned,
            claimedRewards: this.claimedRewards,
            canClaimRewards: this.canClaimRewards(),
            khordeBalance: this.khordeBalance,
            referralTiers: this.referralMilestones || []
        };

        // Cache the result
        await redis.setex(cacheKey, CACHE_TTL.STATS, JSON.stringify(stats));
        return stats;
    },

    // Calculate rewards - Updated to use RewardService
    calculateRewards: async function() {
        const cacheKey = CACHE_KEYS.REWARDS(this.walletAddress);
        
        // Try to get from cache first
        const cachedRewards = await redis.get(cacheKey);
        if (cachedRewards) {
            return parseFloat(cachedRewards);
        }

        // Calculate base rewards from referrals
        const validReferrals = this.referralHistory.filter(
            ref => ref.status === 'active' && ref.verificationStatus === 'verified'
        ).length;

        let totalRewards = RewardService.calculateTierRewards(validReferrals);

        // Add initial wallet connect reward if not claimed yet
        if (this.walletConnected && 
            !this.referralMilestones.some(m => m.tier === 0 && m.rewardClaimed)) {
            totalRewards += REWARD_SYSTEM.INITIAL_CONNECT_REWARD;
            this.referralMilestones.push({
                tier: 0,
                achieved: true,
                rewardClaimed: true
            });
        }

        // Update milestone tracking
        this.updateMilestones(validReferrals);

        const finalRewards = Math.round(totalRewards * 100) / 100;
        
        // Cache the result
        await redis.setex(cacheKey, CACHE_TTL.REWARDS, finalRewards.toString());
        return finalRewards;
    },

    // New method to update milestones
    updateMilestones(validReferrals) {
        REWARD_SYSTEM.REFERRAL_TIERS.forEach((tier, index) => {
            if (validReferrals >= tier.start) {
                const milestone = this.referralMilestones.find(m => m.tier === index + 1);
                if (!milestone) {
                    this.referralMilestones.push({
                        tier: index + 1,
                        achieved: true,
                        rewardClaimed: false
                    });
                }
            }
        });
    },

    // Check if rewards can be claimed
    canClaimRewards() {
        const validation = RewardService.validateRewardClaim(this);
        return validation.canClaim;
    },

    // Add reward gaming protection
    detectRewardGaming: async function() {
        const recentClaims = await this.constructor.countDocuments({
            walletAddress: this.walletAddress,
            'claimHistory.timestamp': { 
                $gte: new Date(Date.now() - 86400000) // Last 24 hours
            }
        });

        const suspiciousPatterns = {
            rapidClaims: recentClaims >= REWARD_PROTECTION.maxClaimsPerDay,
            irregularActivity: this.fraudScore > REWARD_PROTECTION.suspiciousActivityThreshold,
            multipleDevices: this.devices.length > 3
        };

        return {
            isGaming: Object.values(suspiciousPatterns).some(Boolean),
            patterns: suspiciousPatterns
        };
    },

    // Add claim rate limiting
    checkClaimRateLimit: async function() {
        const key = `claim_limit:${this.walletAddress}`;
        const claims = await redis.incr(key);
        await redis.expire(key, 86400); // 24 hours

        if (claims > REWARD_PROTECTION.maxClaimsPerDay) {
            throw new RateLimitError('Daily claim limit exceeded');
        }

        const lastClaimKey = `last_claim:${this.walletAddress}`;
        const lastClaim = await redis.get(lastClaimKey);
        
        if (lastClaim && (Date.now() - parseInt(lastClaim)) < REWARD_PROTECTION.minTimeBetweenClaims) {
            throw new RateLimitError('Please wait before claiming again');
        }

        await redis.set(lastClaimKey, Date.now());
        return true;
    }
};

// Static methods
airdropSchema.statics = {
    async processReferral(referrerAddress, referredAddress, deviceId, ipAddress) {
        try {
            const [referrer, referred] = await Promise.all([
                this.findOne({ walletAddress: referrerAddress.toLowerCase() }),
                this.findOne({ walletAddress: referredAddress.toLowerCase() })
            ]);

            if (!referrer || !referred) {
                throw new ReferralError('Invalid referrer or referred user');
            }

            // Validate referral
            const validation = await referrer.validateReferral({
                walletAddress: referredAddress
            }, deviceId, ipAddress);

            if (!validation.isValid) {
                throw new ReferralError(validation.reason);
            }

            // Create referral record
            const referralRecord = {
                referredUser: referredAddress,
                deviceId,
                ipAddress,
                fraudScore: validation.fraudScore,
                status: validation.fraudScore > 0.3 ? 'pending' : 'active',
                timestamp: new Date(),
                verificationStatus: 'pending'
            };

            // Update referrer
            referrer.referralHistory.push(referralRecord);
            referrer.referralCount = (referrer.referralCount || 0) + 1;
            referrer.lockedRewards += TOKEN_AMOUNTS.REFERRAL_REWARD;

            // Update referred
            referred.referredBy = referrerAddress;

            // Save both documents
            await Promise.all([
                referrer.save(),
                referred.save()
            ]);

            const result = {
                success: true,
                referrer,
                referred,
                referralRecord
            };

            // Add monitoring
            await MonitoringService.trackReferral(
                referrerAddress,
                referredAddress
            );

            return result;
        } catch (error) {
            if (error.name === 'ReferralError' || 
                error.name === 'SecurityError' || 
                error.name === 'RateLimitError') {
                throw error;
            }
            throw new SecurityError(error.message);
        }
    }
};

// Middleware
airdropSchema.pre('save', async function(next) {
    try {
        if (!this.referralCode) {
            this.referralCode = await this.generateReferralCode();
        }

        // Ensure reward values are never negative
        this.rewardBalance = Math.max(0, this.rewardBalance);
        this.totalRewardsEarned = Math.max(0, this.totalRewardsEarned);
        this.claimedRewards = Math.max(0, this.claimedRewards);
        
        // Validate referral counts
        this.referralCount = this.referralHistory.length;
        
        // Ensure KHORDE balance is valid
        this.khordeBalance = Math.max(0, this.khordeBalance);
        
        next();
    } catch (error) {
        next(error);
    }
});

airdropSchema.post('save', async function() {
    const keys = [
        CACHE_KEYS.USER_STATS(this.walletAddress),
        CACHE_KEYS.REFERRAL_COUNT(this.walletAddress),
        CACHE_KEYS.REWARDS(this.walletAddress)
    ];
    
    await redis.del(keys);
});

const Airdrop = mongoose.model('Airdrop', airdropSchema);

module.exports = Airdrop;

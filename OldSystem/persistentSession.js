const mongoose = require('mongoose');
const crypto = require('crypto');

// Schema definition
const persistentSessionSchema = new mongoose.Schema({
    walletAddress: {
        type: String,
        required: true,
        lowercase: true, // Ensure addresses are always stored in lowercase
        trim: true
    },
    deviceId: {
        type: String,
        required: true
    },
    ipAddress: {
        type: String,
        required: true
    },
    userAgent: String,
    authToken: {
        type: String,
        required: true,
        default: function() {
            return crypto.randomBytes(32).toString('hex');
        }
    },
    startTime: {
        type: Date,
        default: Date.now
    },
    endTime: Date,
    lastActive: {
        type: Date,
        default: Date.now
    },
    active: {
        type: Boolean,
        default: true
    },
    duration: Number
}, { timestamps: true });

// Indexes
persistentSessionSchema.index({ walletAddress: 1 });
persistentSessionSchema.index({ deviceId: 1 });
persistentSessionSchema.index({ authToken: 1 });

// Instance methods
persistentSessionSchema.methods.updateActivity = async function(timestamp = new Date()) {
    this.lastActive = timestamp;
    return this.save();
};

persistentSessionSchema.methods.closeSession = async function() {
    this.active = false;
    this.endTime = new Date();
    this.duration = this.endTime - this.startTime;
    return this.save();
};

persistentSessionSchema.methods.generateNewToken = async function() {
    this.authToken = crypto.randomBytes(32).toString('hex');
    await this.save();
    return this.authToken;
};

// Static methods
persistentSessionSchema.statics.findActiveSessionsForWallet = function(walletAddress) {
    // Ensure we're comparing with lowercase
    const lowerWallet = walletAddress.toLowerCase();
    return this.find({
        walletAddress: lowerWallet,
        active: true
    });
};

persistentSessionSchema.statics.findByWalletAndDevice = function(walletAddress, deviceId) {
    // Ensure we're comparing with lowercase
    const lowerWallet = walletAddress.toLowerCase();
    return this.findOne({
        walletAddress: lowerWallet,
        deviceId: deviceId
    });
};

// Create and export the model
const PersistentSession = mongoose.model('PersistentSession', persistentSessionSchema);
module.exports = PersistentSession;

const rateLimit = require('express-rate-limit');

// Simple in-memory store
const createLimiter = (options) => {
    return rateLimit({
        ...options,

        // Using the default memory store
        legacyHeaders: false, 
        standardHeaders: true
    });
};

// Registration limiter - stricter limits
const registrationLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // Limit each IP to 5 registration requests per windowMs
    message: 'Too many registration attempts from this IP, please try again after 15 minutes'
});

// DDoS protection - general API protection
const ddosProtection = createLimiter({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 100, // Limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again after a minute'
});

// General API limiter - less strict than registration
const apiLimiter = createLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // 100 requests per 15 minutes
    message: 'Too many requests, please try again later'
});

module.exports = {
    registrationLimiter,
    ddosProtection,
    apiLimiter
};

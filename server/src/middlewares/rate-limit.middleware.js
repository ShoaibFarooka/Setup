const rateLimit = require('express-rate-limit');
const config = require('../configs/app.config');
const { errorBody } = require('../utils/response.util');

const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: errorBody('Too many requests from this IP, please try again later'),
});

// Stricter limit against password guessing; only failed attempts count
const loginLimiter = rateLimit({
    windowMs: config.rateLimit.login.windowMs,
    max: config.rateLimit.login.max,
    skipSuccessfulRequests: true,
    message: errorBody('Too many failed login attempts, please try again later'),
});

module.exports = {
    apiLimiter,
    loginLimiter,
};

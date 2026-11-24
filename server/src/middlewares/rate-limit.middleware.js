const { rateLimit, ipKeyGenerator } = require('express-rate-limit');
const config = require('../configs/app.config');
const { errorBody } = require('../utils/response.util');

// Messages are functions, so each answer is in the request's language
const limitMessage = (key) => (req) => errorBody(req.t(key));

const apiLimiter = rateLimit({
    windowMs: config.rateLimit.windowMs,
    max: config.rateLimit.max,
    message: limitMessage('errors.tooManyRequests'),
});

// Stricter limit against password guessing; only failed attempts count
const loginLimiter = rateLimit({
    windowMs: config.rateLimit.login.windowMs,
    max: config.rateLimit.login.max,
    skipSuccessfulRequests: true,
    message: limitMessage('errors.tooManyLogins'),
});

// Counted per IP and email address: one person cannot flood someone's inbox with reset emails, and people
// behind a shared IP (an office) can still each ask for their own link
const forgotPasswordLimiter = rateLimit({
    windowMs: config.rateLimit.forgotPassword.windowMs,
    max: config.rateLimit.forgotPassword.max,
    keyGenerator: (req) => {
        const email = typeof req.body?.email === 'string' ? req.body.email.trim().toLowerCase() : '';
        return `${ipKeyGenerator(req.ip)}|${email}`;
    },
    message: limitMessage('errors.tooManyResetRequests'),
});

// Only failed resets count (an unknown or expired link): against guessing tokens
const resetPasswordLimiter = rateLimit({
    windowMs: config.rateLimit.resetPassword.windowMs,
    max: config.rateLimit.resetPassword.max,
    skipSuccessfulRequests: true,
    message: limitMessage('errors.tooManyResetAttempts'),
});

module.exports = {
    apiLimiter,
    loginLimiter,
    forgotPasswordLimiter,
    resetPasswordLimiter,
};

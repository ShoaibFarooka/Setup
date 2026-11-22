const crypto = require('crypto');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

const config = require('../configs/app.config');

const {
    saltRounds,
    accessTokenSecret,
    accessTokenExpiryTime,
    refreshTokenSecret,
    refreshTokenExpiryTime,
} = config.auth;

const hashPassword = (password) => bcrypt.hash(password, saltRounds);

const comparePassword = (storedPassword, password) => bcrypt.compare(password, storedPassword);

const createAccessToken = (payload) =>
    jwt.sign(payload, accessTokenSecret, { expiresIn: accessTokenExpiryTime });

// jwtid: a random id, so two tokens are never identical (e.g. two devices logging in within the same second)
const createRefreshToken = (payload) =>
    jwt.sign(payload, refreshTokenSecret, { expiresIn: refreshTokenExpiryTime, jwtid: crypto.randomUUID() });

// Refresh tokens are stored as a hash; SHA-256 is enough because the token itself is long and random
const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

const verifyRefreshToken = (token) => {
    try {
        return jwt.verify(token, refreshTokenSecret);
    } catch {
        return null;
    }
};

// When a token stops being valid (its `exp`), as a Date
const getTokenExpiry = (token) => new Date(jwt.decode(token).exp * 1000);

const verifyAccessToken = (token) => {
    try {
        return jwt.verify(token, accessTokenSecret);
    } catch {
        return null;
    }
};

module.exports = {
    hashPassword,
    comparePassword,
    createAccessToken,
    createRefreshToken,
    verifyAccessToken,
    verifyRefreshToken,
    getTokenExpiry,
    hashToken,
};

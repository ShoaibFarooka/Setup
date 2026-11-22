const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const authUtils = require('../utils/auth.util');

const { throwError } = require('../utils/app-error.util');

const createTokens = (user) => {
    const payload = {
        id: user._id,
        email: user.email,
        role: user.role,
    };

    return {
        accessToken: authUtils.createAccessToken(payload),
        refreshToken: authUtils.createRefreshToken(payload),
    };
};

const loginUser = async (loginData) => {
    const { identifier, password } = loginData;

    const user = await userRepository.findUserByLoginWithPassword(identifier);
    if (!user) {
        throwError('Invalid credentials!', 401);
    }

    const passwordMatched = await authUtils.comparePassword(user.password, password);
    if (!passwordMatched) {
        throwError('Invalid credentials!', 401);
    }

    const { accessToken, refreshToken } = createTokens(user);

    // A new session per login, so every device stays logged in independently
    await sessionRepository.createSession({
        user: user._id,
        tokenHash: authUtils.hashToken(refreshToken),
        expiresAt: authUtils.getTokenExpiry(refreshToken),
    });

    return { accessToken, refreshToken };
};

const refreshToken = async (refreshToken) => {
    if (!refreshToken) {
        throwError('Refresh token not found!', 401);
    }

    const payload = authUtils.verifyRefreshToken(refreshToken);
    if (!payload) {
        throwError('Invalid refresh token!', 401);
    }

    const session = await sessionRepository.findSessionByTokenHash(authUtils.hashToken(refreshToken));
    if (!session || session.user.toString() !== payload.id) {
        throwError('Invalid refresh token!', 401);
    }

    // Current email and role from the database, in case they changed since login
    const user = await userRepository.findUserById(payload.id, { email: 1, role: 1 });
    if (!user) {
        await sessionRepository.deleteSessionById(session._id);
        throwError('Invalid refresh token!', 401);
    }

    // Rotate: the old refresh token stops working as soon as the new one is issued
    const { accessToken: newAccessToken, refreshToken: newRefreshToken } = createTokens(user);
    await sessionRepository.updateSessionById(session._id, {
        tokenHash: authUtils.hashToken(newRefreshToken),
        expiresAt: authUtils.getTokenExpiry(newRefreshToken),
    });

    return { newAccessToken, newRefreshToken };
};

// Ends only the session of this device; other devices stay logged in
const logoutUser = async (refreshToken) => {
    await sessionRepository.deleteSessionByTokenHash(authUtils.hashToken(refreshToken));
};

// Ends every session of the user, e.g. after a password change or a lost device
const logoutAllDevices = async (userId) => {
    await sessionRepository.deleteSessionsByUserId(userId);
};

module.exports = {
    loginUser,
    refreshToken,
    logoutUser,
    logoutAllDevices,
};

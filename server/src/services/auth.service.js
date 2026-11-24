const crypto = require('node:crypto');
const config = require('../configs/app.config');
const userRepository = require('../repositories/user.repository');
const sessionRepository = require('../repositories/session.repository');
const passwordResetRepository = require('../repositories/password-reset.repository');
const emailService = require('./email.service');
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
        throwError('auth.invalidCredentials', 401);
    }

    const passwordMatched = await authUtils.comparePassword(user.password, password);
    if (!passwordMatched) {
        throwError('auth.invalidCredentials', 401);
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
        throwError('auth.refreshTokenMissing', 401);
    }

    const payload = authUtils.verifyRefreshToken(refreshToken);
    if (!payload) {
        throwError('auth.refreshTokenInvalid', 401);
    }

    const session = await sessionRepository.findSessionByTokenHash(authUtils.hashToken(refreshToken));
    if (!session || session.user.toString() !== payload.id) {
        throwError('auth.refreshTokenInvalid', 401);
    }

    // Current email and role from the database, in case they changed since login
    const user = await userRepository.findUserById(payload.id, { email: 1, role: 1 });
    if (!user) {
        await sessionRepository.deleteSessionById(session._id);
        throwError('auth.refreshTokenInvalid', 401);
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

// "Forgot password": emails a single-use link to reset the password. The caller always answers the same way,
// whether the account exists or not, so the form cannot be used to find out who has an account.
// language: the email's language (the request's Accept-Language)
const requestPasswordReset = async (email, language) => {
    // Checked first, for every request: failing only for existing accounts would reveal them
    if (!config.email.enabled) {
        throwError('email.notConfigured', 500);
    }

    const user = await userRepository.findUserByEmail(email, { name: 1, email: 1 });
    if (!user) {
        return;
    }

    // Only the newest link works; the token itself is only in the email, the database keeps its hash
    const token = crypto.randomBytes(32).toString('hex');
    const expiresInMinutes = config.auth.passwordResetExpiryMinutes;
    await passwordResetRepository.deletePasswordResetsByUserId(user._id);
    await passwordResetRepository.createPasswordReset({
        user: user._id,
        tokenHash: authUtils.hashToken(token),
        expiresAt: new Date(Date.now() + expiresInMinutes * 60 * 1000),
    });

    // Not awaited: the answer takes as long for an unknown email as for a known one (waiting for the mail
    // server would reveal the account by timing). sendEmail logs a failure itself.
    emailService.sendTemplateEmail({
        to: user.email,
        subject: 'email.resetPassword.subject',
        template: 'reset-password',
        data: { name: user.name, resetUrl: `${config.clientUrl}/reset-password?token=${token}`, minutes: expiresInMinutes },
        language,
    }).catch(() => {});
};

// Sets a new password with the token from the reset link, then ends every session: whoever might have known
// the old password is logged out everywhere
const resetPassword = async ({ token, password }) => {
    const reset = await passwordResetRepository.consumePasswordReset(authUtils.hashToken(token));
    if (!reset) {
        throwError('auth.resetLinkInvalid', 400);
    }

    const passwordDigest = await authUtils.hashPassword(password);
    const user = await userRepository.updateUserById(reset.user, { password: passwordDigest }, {}, { _id: 1 });
    if (!user) {
        throwError('auth.resetLinkInvalid', 400);
    }

    await passwordResetRepository.deletePasswordResetsByUserId(reset.user);
    await sessionRepository.deleteSessionsByUserId(reset.user);
};

module.exports = {
    loginUser,
    refreshToken,
    logoutUser,
    logoutAllDevices,
    requestPasswordReset,
    resetPassword,
};

const config = require('../configs/app.config');
const authService = require('../services/auth.service');
const { getTokenExpiry } = require('../utils/auth.util');
const { successBody } = require('../utils/response.util');

// Express 5 passes errors thrown in async handlers to the error handler, so no try/catch is needed

const refreshTokenCookieOptions = () => ({
    httpOnly: true,
    secure: config.isProduction,
    sameSite: config.isProduction ? 'Strict' : 'Lax',
});

// The cookie lasts as long as the refresh token itself, so the login survives closing the browser;
// the client keeps its own token until the same time (sessionExpiresAt)
const sendSession = (res, message, accessToken, refreshToken) => {
    const expires = getTokenExpiry(refreshToken);
    res.cookie('refreshToken', refreshToken, { ...refreshTokenCookieOptions(), expires });
    res.status(200).json(successBody(message, { token: accessToken, sessionExpiresAt: expires.toISOString() }));
};

const login = async (req, res) => {
    const { accessToken, refreshToken } = await authService.loginUser(req.body);
    sendSession(res, req.t('auth.loggedIn'), accessToken, refreshToken);
};

const refreshToken = async (req, res) => {
    const token = req.cookies?.refreshToken;
    const { newAccessToken, newRefreshToken } = await authService.refreshToken(token);
    sendSession(res, req.t('auth.sessionRefreshed'), newAccessToken, newRefreshToken);
};

const logout = async (req, res) => {
    const token = req.cookies?.refreshToken;
    if (token) {
        await authService.logoutUser(token);
    }
    res.clearCookie('refreshToken', refreshTokenCookieOptions());
    res.status(200).json(successBody(req.t('auth.loggedOut')));
};

const logoutAll = async (req, res) => {
    await authService.logoutAllDevices(req.user.id);
    res.clearCookie('refreshToken', refreshTokenCookieOptions());
    res.status(200).json(successBody(req.t('auth.loggedOutAll')));
};

// The same answer whether the email belongs to an account or not
const forgotPassword = async (req, res) => {
    // The email is written in the language of this request
    await authService.requestPasswordReset(req.body.email, req.language);
    res.status(200).json(successBody(req.t('auth.resetLinkSent')));
};

const resetPassword = async (req, res) => {
    await authService.resetPassword(req.body);
    res.clearCookie('refreshToken', refreshTokenCookieOptions());
    res.status(200).json(successBody(req.t('auth.passwordChanged')));
};

module.exports = {
    login,
    refreshToken,
    logout,
    logoutAll,
    forgotPassword,
    resetPassword,
};

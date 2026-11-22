const router = require('express').Router();

const authController = require('../controllers/auth.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { loginLimiter } = require('../middlewares/rate-limit.middleware');
const validationMiddleware = require('../middlewares/validation.middleware');
const authValidations = require('../validations/auth.validation');

router.post(
    '/login',
    loginLimiter,
    validationMiddleware.validateRequest(authValidations.loginSchema),
    authController.login,
);

router.post(
    '/refresh-token',
    authController.refreshToken,
);

router.post(
    '/logout',
    authController.logout,
);

router.post(
    '/logout-all',
    authMiddleware.authenticateRequest,
    authController.logoutAll,
);

module.exports = router;

const router = require('express').Router();

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateRequest } = require('../middlewares/validation.middleware');
const { updateProfileSchema } = require('../validations/user.validation');

router.get(
    '/me',
    authMiddleware.authenticateRequest,
    userController.fetchUserInfo,
);

router.patch(
    '/me',
    authMiddleware.authenticateRequest,
    validateRequest(updateProfileSchema),
    userController.updateUserInfo,
);

module.exports = router;

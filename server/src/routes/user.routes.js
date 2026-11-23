const router = require('express').Router();

const userController = require('../controllers/user.controller');
const authMiddleware = require('../middlewares/auth.middleware');
const { validateRequest, validateQuery } = require('../middlewares/validation.middleware');
const { updateProfileSchema, listUsersQuery } = require('../validations/user.validation');

// Admins only: a paginated, searchable list of users
router.get(
    '/',
    authMiddleware.authenticateRequest,
    authMiddleware.verifyRole(['admin']),
    validateQuery(listUsersQuery),
    userController.listUsers,
);

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

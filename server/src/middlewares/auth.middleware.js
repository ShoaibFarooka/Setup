const { throwError } = require('../utils/app-error.util');
const userRepository = require('../repositories/user.repository');
const authUtils = require('../utils/auth.util');

// Errors are thrown as AppError and answered by the error handler, like everywhere else

const authenticateRequest = (req, res, next) => {
    try {
        const token = req.headers['authorization']?.split(' ')[1];
        const payload = token && authUtils.verifyAccessToken(token);

        if (!payload) {
            throwError('auth.tokenMissing', 401);
        }

        req.user = payload;
        next();
    } catch (error) {
        next(error);
    }
};

const verifyRole = (requiredRoles) => {
    return async (req, res, next) => {
        try {
            const user = await userRepository.findUserById(req.user?.id, { role: 1 });

            if (!user) {
                throwError('auth.userNotFound', 404);
            }

            if (!requiredRoles.includes(user.role)) {
                throwError('auth.insufficientRole', 403);
            }

            // Current role from the database (the role in the token may be outdated)
            req.user.role = user.role;
            next();
        } catch (error) {
            next(error);
        }
    };
};

module.exports = {
    authenticateRequest,
    verifyRole,
};

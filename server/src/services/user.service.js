const mongoose = require('mongoose');
const userRepository = require('../repositories/user.repository');
const authUtils = require('../utils/auth.util');

const { throwError } = require('../utils/app-error.util');

const userProjection = {
    name: 1,
    username: 1,
    email: 1,
    role: 1,
    _id: 0,
};

const createUser = async (userData, role = 'user') => {
    const { name, password } = userData;
    const email = userData.email?.trim().toLowerCase();
    const username = userData.username?.trim().toLowerCase();

    if (await userRepository.userExists({ email })) {
        throwError('A user with that email has already been registered!', 409);
    }
    if (await userRepository.userExists({ username })) {
        throwError('A user with that username has already been registered!', 409);
    }

    const passwordDigest = await authUtils.hashPassword(password);

    const user = await userRepository.createUser({
        name,
        username,
        email,
        password: passwordDigest,
        role,
    });

    return user;
};

const fetchUser = async (userId) => {
    const user = await userRepository.findUserById(userId, userProjection);
    if (!user) {
        throwError('User not found!', 404);
    }

    return user;
};

// Changes the logged-in user's own name and/or email; returns the updated user (public fields only)
const updateProfile = async (userId, changes) => {
    const update = {};
    if (changes.name !== undefined) {
        update.name = changes.name;
    }
    if (changes.email !== undefined) {
        update.email = changes.email.trim().toLowerCase();
        // Another account with this email (keeping your own email is fine). The $ne operator is ours, not user
        // input, so it is marked trusted for sanitizeFilter (trusted() wraps the object that holds the operator).
        if (await userRepository.userExists({ email: update.email, _id: mongoose.trusted({ $ne: userId }) })) {
            throwError('A user with that email has already been registered!', 409);
        }
    }

    const user = await userRepository.updateUserById(userId, update, { returnDocument: 'after', runValidators: true }, userProjection);
    if (!user) {
        throwError('User not found!', 404);
    }

    return user;
};

module.exports = {
    createUser,
    fetchUser,
    updateProfile,
};

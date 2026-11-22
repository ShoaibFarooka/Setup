const User = require('../models/user.model');

const createUser = (data) => User.create(data);

const findUserById = (userId, projection = null, options = {}) =>
    User.findById(userId, projection, options);

const userExists = (filter) => User.exists(filter);

// `password` is `select: false` on the model, so it has to be asked for explicitly.
// Email and username are stored in lowercase, so the login is case-insensitive
const findUserByLoginWithPassword = (identifier) => {
    const value = identifier.trim().toLowerCase();
    return User.findOne({ $or: [{ email: value }, { username: value }] }).select('+password');
};

const updateUserById = (userId, update, options = { returnDocument: 'after', runValidators: true }) =>
    User.findByIdAndUpdate(userId, update, options);

module.exports = {
    createUser,
    findUserById,
    userExists,
    findUserByLoginWithPassword,
    updateUserById,
};

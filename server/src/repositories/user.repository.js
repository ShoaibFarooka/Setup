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

// projection limits the returned fields; it is applied with select(), because findByIdAndUpdate ignores a
// projection passed in its options
const updateUserById = (userId, update, options = { returnDocument: 'after', runValidators: true }, projection = null) => {
    const query = User.findByIdAndUpdate(userId, update, options);
    return projection ? query.select(projection) : query;
};

module.exports = {
    createUser,
    findUserById,
    userExists,
    findUserByLoginWithPassword,
    updateUserById,
};

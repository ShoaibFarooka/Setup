const User = require('../models/user.model');
const { paginate, searchFilter } = require('../utils/pagination.util');

const createUser = (data) => User.create(data);

// Lean by default (a plain object, faster): every caller only reads the user
const findUserById = (userId, projection = null, options = { lean: true }) =>
    User.findById(userId, projection, options);

// One page of users; search matches name, username or email (case-insensitive "contains")
const listUsers = ({ search, page, limit, sort }) => paginate(User, {
    filter: searchFilter(search, ['name', 'username', 'email']),
    projection: { name: 1, username: 1, email: 1, role: 1, createdAt: 1 },
    page,
    limit,
    sort,
});

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
    listUsers,
    userExists,
    findUserByLoginWithPassword,
    updateUserById,
};

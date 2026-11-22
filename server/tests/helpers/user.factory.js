const userService = require('../../src/services/user.service');

let counter = 0;

// Creates a user with sensible defaults; returns the user and the plain password for logging in
const createUser = async (overrides = {}, role = 'user') => {
    counter += 1;
    const data = {
        name: `Test User ${counter}`,
        username: `user${counter}`,
        email: `user${counter}@example.com`,
        password: 'Password123!',
        ...overrides,
    };

    const user = await userService.createUser(data, role);
    return { user, password: data.password };
};

module.exports = { createUser };

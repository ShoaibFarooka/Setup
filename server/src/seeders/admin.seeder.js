const mongoose = require('mongoose');

const config = require('../configs/app.config');
const connectDB = require('../database/connection');
const userRepository = require('../repositories/user.repository');
const userService = require('../services/user.service');
const logger = require('../utils/logger.util');

// Usage: npm run seed
// Creates the admin account from ADMIN_NAME / ADMIN_USERNAME / ADMIN_EMAIL / ADMIN_PASSWORD in .env
const seedAdmin = async () => {
    const { name, username, email, password } = config.admin;

    if (!username || !email || !password) {
        logger.error('ADMIN_USERNAME, ADMIN_EMAIL and ADMIN_PASSWORD must be set in .env');
        process.exit(1);
    }

    await connectDB(config.databaseUri);

    try {
        const existing = { $or: [{ email: email.trim().toLowerCase() }, { username: username.trim().toLowerCase() }] };
        if (await userRepository.userExists(existing)) {
            logger.info({ username, email }, 'A user with this username or email already exists, skipping');
        } else {
            await userService.createUser({ name, username, email, password }, 'admin');
            logger.info({ username, email }, 'Admin created successfully');
        }
    } catch (error) {
        logger.error({ err: error }, 'Seeding failed');
        process.exitCode = 1;
    } finally {
        await mongoose.disconnect();
    }
};

// Runs only when started directly (npm run seed), so tests can require the file without seeding
if (require.main === module) {
    seedAdmin();
}

module.exports = seedAdmin;

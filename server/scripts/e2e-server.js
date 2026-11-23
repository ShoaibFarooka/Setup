// npm run e2e:server
// The API for the client's end-to-end tests (Playwright starts it): a throwaway in-memory MongoDB with known
// test accounts (scripts/e2e-accounts.json), its own settings, port 5100. It never touches the development
// database and does not depend on server/.env. The accounts only ever exist in this temporary database.
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { MongoMemoryServer } = require('mongodb-memory-server');
const { removeStaleMongoDirs } = require('../tests/helpers/stale-mongo-dirs');
const accounts = require('./e2e-accounts.json');

const PORT = 5100;
const CLIENT_ORIGIN = 'http://localhost:5300';
// One fixed database folder, emptied at every start: Playwright may end this process without letting it
// clean up (on Windows it is killed outright), and a fixed folder means at most one leftover, never a pile
const DB_PATH = path.join(os.tmpdir(), 'e2e-mongo-db');

const start = async () => {
    // Leftovers of earlier runs that were killed before they could clean up
    removeStaleMongoDirs();
    fs.rmSync(DB_PATH, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    fs.mkdirSync(DB_PATH, { recursive: true });
    const mongo = await MongoMemoryServer.create({ instance: { dbPath: DB_PATH } });

    // Set before the config loads; dotenv never overwrites variables that are already set
    Object.assign(process.env, {
        NODE_ENV: 'test',
        DOTENV_CONFIG_QUIET: 'true',
        PORT: String(PORT),
        HOST: '127.0.0.1',
        CORS_ORIGINS: CLIENT_ORIGIN,
        DB_URI: mongo.getUri(),
        ACCESS_TOKEN_SECRET: 'e2e-access-secret-at-least-32-characters-long',
        REFRESH_TOKEN_SECRET: 'e2e-refresh-secret-at-least-32-characters-long',
        EMAIL_ENABLED: 'false',
        LOG_LEVEL: process.env.LOG_LEVEL || 'warn',
    });

    const mongoose = require('mongoose');
    const config = require('../src/configs/app.config');
    const connectDB = require('../src/database/connection');
    const userService = require('../src/services/user.service');
    const logger = require('../src/utils/logger.util');
    const app = require('../src/app');

    await connectDB(config.databaseUri);
    for (const { role, ...account } of Object.values(accounts)) {
        await userService.createUser(account, role);
    }
    // Sample users for the admin list (more than one page). One password hash for all and one insert, so the
    // start stays fast (hashing each would take seconds). Nobody logs in as them.
    const User = require('../src/models/user.model');
    const { hashPassword } = require('../src/utils/auth.util');
    const password = await hashPassword('E2e-Sample-Pass-1');
    await User.insertMany(Array.from({ length: 24 }, (_, i) => {
        const n = String(i + 1).padStart(2, '0');
        return { name: `Sample User ${n}`, username: `sample-${n}`, email: `sample-${n}@example.com`, password, role: 'user' };
    }));

    const server = app.listen(config.port, config.host, (error) => {
        if (error) {
            throw error;
        }
        logger.warn({ port: config.port }, 'E2E server listening (in-memory database)');
    });

    // Playwright stops this process when the tests finish: close everything so the temp database is deleted
    let stopping = false;
    const stop = async () => {
        if (stopping) {
            return;
        }
        stopping = true;
        server.close();
        await mongoose.disconnect();
        await mongo.stop({ doCleanup: true, force: true });
        process.exit(0);
    };
    process.on('SIGINT', stop);
    process.on('SIGTERM', stop);
};

start();

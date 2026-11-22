const mongoose = require('mongoose');
const logger = require('../utils/logger.util');

// Fail a request after 5s (instead of Mongoose's 30s default) when the database cannot be reached
const DB_TIMEOUT_MS = 5000;
const RETRY_DELAY_MS = 5000;

mongoose.set('bufferTimeoutMS', DB_TIMEOUT_MS);
// Protects against NoSQL injection: query operators that come from user input (e.g. { email: { $ne: null } }
// built from ?email[$ne]=) are treated as plain values. Wrap intentional operators from your own code in
// mongoose.trusted() if they are built dynamically.
mongoose.set('sanitizeFilter', true);

let listenersAdded = false;

const addConnectionListeners = () => {
    if (listenersAdded) {
        return;
    }
    listenersAdded = true;

    const { connection } = mongoose;
    connection.on('disconnected', () => logger.warn('MongoDB disconnected. Requests will fail until the connection is back.'));
    connection.on('reconnected', () => logger.info('MongoDB reconnected.'));
    // Without a listener a connection error event would crash the server
    connection.on('error', (error) => logger.error({ err: error }, 'MongoDB connection error'));
};

// retry: keep trying until the database answers (the server stays up and answers 503 meanwhile).
// Without retry (seeder) the process exits on failure.
const connectDB = async (DB, { retry = false } = {}) => {
    addConnectionListeners();

    for (let attempt = 1; ; attempt++) {
        try {
            const conn = await mongoose.connect(DB, { serverSelectionTimeoutMS: DB_TIMEOUT_MS });
            logger.info({ host: conn.connection.host }, 'MongoDB connected');
            return;
        } catch (error) {
            logger.error({ err: error }, 'Error connecting to MongoDB');
            if (!retry) {
                process.exit(1);
            }
            logger.warn({ attempt, retryInMs: RETRY_DELAY_MS }, 'Retrying MongoDB connection');
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        }
    }
};

// Errors that mean "the database could not be reached", not a bug in the request
const DB_UNAVAILABLE_ERRORS = new Set([
    'MongooseServerSelectionError',
    'MongoServerSelectionError',
    'MongoNetworkError',
    'MongoNetworkTimeoutError',
    'MongoNotConnectedError',
    'MongoTopologyClosedError',
    'MongoPoolClearedError',
]);

const isDatabaseUnavailableError = (error) =>
    DB_UNAVAILABLE_ERRORS.has(error?.name) || /buffering timed out/i.test(error?.message || '');

module.exports = connectDB;
module.exports.isDatabaseUnavailableError = isDatabaseUnavailableError;

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
// While connectDB is trying to connect, its own log line reports failures; the connection events
// fired by the same failure would only repeat it
let connecting = false;
// Set by disconnectDB: no more connection attempts (the server is shutting down)
let stopped = false;

// Mongoose errors carry the full state of every database server they tried (about 100 lines);
// the type and message are what matters in the logs. Logged under `error`, not `err`: pino reformats
// anything under `err` as a full error and would replace this summary
const summarize = (error) => ({ type: error?.name, message: error?.message });

const addConnectionListeners = () => {
    if (listenersAdded) {
        return;
    }
    listenersAdded = true;

    const { connection } = mongoose;
    connection.on('disconnected', () => {
        if (!connecting && !stopped) {
            logger.warn('MongoDB disconnected. Requests will fail until the connection is back.');
        }
    });
    connection.on('reconnected', () => logger.info('MongoDB reconnected'));
    // Without a listener a connection error event would crash the server
    connection.on('error', (error) => {
        if (!connecting) {
            logger.error({ error: summarize(error) }, 'MongoDB connection error');
        }
    });
};

// retry: keep trying until the database answers (the server stays up and answers 503 meanwhile).
// Without retry (seeder) the process exits on failure.
const connectDB = async (DB, { retry = false } = {}) => {
    addConnectionListeners();
    stopped = false;

    for (let attempt = 1; !stopped; attempt++) {
        connecting = true;
        try {
            const conn = await mongoose.connect(DB, { serverSelectionTimeoutMS: DB_TIMEOUT_MS });
            logger.info({ host: conn.connection.host }, 'MongoDB connected');
            return;
        } catch (error) {
            if (stopped) {
                return;
            }
            if (!retry) {
                logger.error({ error: summarize(error) }, 'Could not connect to MongoDB');
                process.exit(1);
            }
            logger.warn({ error: summarize(error), attempt, retryInMs: RETRY_DELAY_MS }, 'Could not connect to MongoDB, retrying');
            await new Promise((resolve) => setTimeout(resolve, RETRY_DELAY_MS));
        } finally {
            connecting = false;
        }
    }
};

// For shutdown: stops further connection attempts, and closes the connection only if there is one,
// so shutdown does not wait for an attempt to a database that is not answering
const disconnectDB = async () => {
    stopped = true;

    if (mongoose.connection.readyState !== mongoose.ConnectionStates.connected) {
        return false;
    }
    await mongoose.disconnect();
    return true;
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
module.exports.disconnectDB = disconnectDB;
module.exports.isDatabaseUnavailableError = isDatabaseUnavailableError;

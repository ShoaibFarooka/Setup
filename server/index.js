const mongoose = require('mongoose');
const config = require('./src/configs/app.config');
const connectDB = require('./src/database/connection');
const logger = require('./src/utils/logger.util');
const app = require('./src/app');

let server;

// The API starts before the database is reachable: requests get a 503 answer
// while the connection keeps retrying in the background
const startServer = () => {
    server = app.listen(config.port, config.host, (error) => {
        // Express 5 passes startup errors (e.g. port in use) to this callback
        if (error) {
            throw error;
        }
        logger.info({ host: config.host, port: server.address().port }, 'Server listening');
    });

    connectDB(config.databaseUri, { retry: true });
    return server;
};

const shutdown = (signal) => {
    logger.info({ signal }, 'Shutting down gracefully');

    // Stop taking new requests, let running ones finish, then close the database connection
    server.close(async () => {
        logger.info('Server closed');
        await mongoose.disconnect();
        logger.info('Database connection closed');
        process.exit(0);
    });
};

const exitOnFatalError = (label) => (err) => {
    logger.fatal({ err }, label);
    process.exit(1);
};

const registerProcessHandlers = () => {
    process.on('uncaughtException', exitOnFatalError('Uncaught Exception'));
    process.on('unhandledRejection', exitOnFatalError('Unhandled Promise Rejection'));
    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));
};

// Runs only when started directly (npm start / npm run dev), so tests can require the file without starting a server
if (require.main === module) {
    registerProcessHandlers();
    startServer();
}

module.exports = {
    startServer,
    shutdown,
    registerProcessHandlers,
};

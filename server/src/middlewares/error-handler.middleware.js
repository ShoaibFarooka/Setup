const logger = require('../utils/logger.util');
const { AppError } = require('../utils/app-error.util');
const { errorBody } = require('../utils/response.util');
const { isDatabaseUnavailableError } = require('../database/connection');

// Express recognizes an error handler by its four parameters, so `_next` must stay
const errorHandlerMiddleware = (error, req, res, _next) => {
    // req.log (from the request logger) adds the request id to the line
    const log = req.log ?? logger;

    // Errors thrown on purpose by the app (services, CORS, ...)
    if (error instanceof AppError) {
        return res.status(error.statusCode).json(errorBody(error.message, { errors: error.errors, data: error.data }));
    }

    // Database not reachable: temporary, not a server bug
    if (isDatabaseUnavailableError(error)) {
        log.warn({ err: error }, 'Database not reachable');
        return res.status(503).json(errorBody('Database is unavailable, please try again later.'));
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0];

        return res.status(409).json(field
            ? errorBody(`A record with that ${field} already exists!`)
            : errorBody('Duplicate value not allowed!'));
    }

    // Invalid ObjectId or a value that cannot be cast to the schema type
    if (error.name === 'CastError') {
        return res.status(400).json(errorBody(`Invalid value for ${error.path}`));
    }

    // Mongoose schema validation error
    if (error.name === 'ValidationError') {
        const errors = Object.fromEntries(
            Object.entries(error.errors || {}).map(([field, err]) => [field, err.message]),
        );

        return res.status(400).json(errorBody('Validation failed', { errors }));
    }

    if (error.name === 'MulterError') {
        return res.status(400).json(errorBody(error.message));
    }

    // Client errors raised by Express itself and its body parser (e.g. malformed JSON), safe to show
    if (error.expose && error.status >= 400 && error.status < 500) {
        return res.status(error.status).json(errorBody(error.message));
    }

    log.error({ err: error }, 'Unhandled error');

    return res.status(500).json(errorBody('Internal Server Error'));
};

module.exports = errorHandlerMiddleware;

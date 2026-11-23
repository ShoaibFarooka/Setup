const logger = require('../utils/logger.util');
const { AppError } = require('../utils/app-error.util');
const { errorBody } = require('../utils/response.util');
const { isDatabaseUnavailableError } = require('../database/connection');

// Express recognizes an error handler by its four parameters, so `_next` must stay
const errorHandlerMiddleware = (error, req, res, _next) => {
    // req.log (from the request logger) adds the request id to the line
    const log = req.log ?? logger;

    // Every answer goes through here. A 5xx is a server problem: the error is handed to the request logger
    // (res.err), so the request's "request errored" line shows the real message and where it was thrown,
    // instead of a generic "failed with status code 500". 4xx answers are expected and stay without it.
    const send = (statusCode, body) => {
        if (statusCode >= 500) {
            res.err = error;
        }
        return res.status(statusCode).json(body);
    };

    // Errors thrown on purpose by the app (services, CORS, ...)
    if (error instanceof AppError) {
        return send(error.statusCode, errorBody(error.message, { errors: error.errors, data: error.data }));
    }

    // Database not reachable: temporary, not a server bug
    if (isDatabaseUnavailableError(error)) {
        log.warn({ err: error }, 'Database not reachable');
        return send(503, errorBody('Database is unavailable, please try again later.'));
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0];

        return send(409, field
            ? errorBody(`A record with that ${field} already exists!`)
            : errorBody('Duplicate value not allowed!'));
    }

    // Invalid ObjectId or a value that cannot be cast to the schema type
    if (error.name === 'CastError') {
        return send(400, errorBody(`Invalid value for ${error.path}`));
    }

    // Mongoose schema validation error
    if (error.name === 'ValidationError') {
        const errors = Object.fromEntries(
            Object.entries(error.errors || {}).map(([field, err]) => [field, err.message]),
        );

        return send(400, errorBody('Validation failed', { errors }));
    }

    if (error.name === 'MulterError') {
        return send(400, errorBody(error.message));
    }

    // Client errors raised by Express itself and its body parser (e.g. malformed JSON), safe to show
    if (error.expose && error.status >= 400 && error.status < 500) {
        return send(error.status, errorBody(error.message));
    }

    log.error({ err: error }, 'Unhandled error');

    return send(500, errorBody('Internal Server Error'));
};

module.exports = errorHandlerMiddleware;

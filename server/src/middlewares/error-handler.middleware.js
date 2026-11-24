const logger = require('../utils/logger.util');
const { AppError } = require('../utils/app-error.util');
const { errorBody } = require('../utils/response.util');
const { isDatabaseUnavailableError } = require('../database/connection');
const { DEFAULT_LANGUAGE, translate } = require('../utils/i18n.util');

// Body parser errors people can understand, by their type; other client errors keep their own message
const BODY_ERRORS = { 'entity.too.large': 'errors.bodyTooLarge', 'entity.parse.failed': 'errors.invalidJson' };

// Express recognizes an error handler by its four parameters, so `_next` must stay
const errorHandlerMiddleware = (error, req, res, _next) => {
    // req.log (from the request logger) adds the request id to the line
    const log = req.log ?? logger;
    // Messages are keys, answered in the request's language (language middleware); English without it
    const t = req.t ?? ((key, values) => translate(DEFAULT_LANGUAGE, key, values));

    // Every answer goes through here. A 5xx is a server problem: the error is handed to the request logger
    // (res.err), so the request's "request errored" line shows the real message and where it was thrown,
    // instead of a generic "failed with status code 500". 4xx answers are expected and stay without it.
    const send = (statusCode, body) => {
        if (statusCode >= 500) {
            res.err = error;
        }
        return res.status(statusCode).json(body);
    };

    // Errors thrown on purpose by the app (services, CORS, ...). Field messages may be keys too (a service has no
    // req.t); texts already translated and non-text values (unknownFields is a list) pass unchanged
    if (error instanceof AppError) {
        const errors = error.errors && Object.fromEntries(
            Object.entries(error.errors).map(([field, message]) => [field, typeof message === 'string' ? t(message) : message]),
        );
        return send(error.statusCode, errorBody(t(error.message, error.values), { errors, data: error.data }));
    }

    // Database not reachable: temporary, not a server bug
    if (isDatabaseUnavailableError(error)) {
        log.warn({ err: error }, 'Database not reachable');
        return send(503, errorBody(t('errors.databaseUnavailable')));
    }

    // Mongoose duplicate key error
    if (error.code === 11000) {
        const field = Object.keys(error.keyValue || {})[0];

        return send(409, field
            ? errorBody(t('errors.duplicateField', { field }))
            : errorBody(t('errors.duplicateValue')));
    }

    // Invalid ObjectId or a value that cannot be cast to the schema type
    if (error.name === 'CastError') {
        return send(400, errorBody(t('errors.invalidValue', { path: error.path })));
    }

    // Mongoose schema validation error
    if (error.name === 'ValidationError') {
        const errors = Object.fromEntries(
            Object.entries(error.errors || {}).map(([field, err]) => [field, t(err.message)]),
        );

        return send(400, errorBody(t('errors.validationFailed'), { errors }));
    }

    if (error.name === 'MulterError') {
        return send(400, errorBody(error.code === 'LIMIT_FILE_SIZE' ? t('errors.fileTooLarge') : error.message));
    }

    // Client errors raised by Express itself and its body parser (e.g. malformed JSON), safe to show
    if (error.expose && error.status >= 400 && error.status < 500) {
        return send(error.status, errorBody(BODY_ERRORS[error.type] ? t(BODY_ERRORS[error.type]) : error.message));
    }

    log.error({ err: error }, 'Unhandled error');

    return send(500, errorBody(t('errors.internal')));
};

module.exports = errorHandlerMiddleware;

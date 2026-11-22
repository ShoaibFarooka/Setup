// Error with an HTTP status code; the error handler answers it with that status and its message.
// Options: errors = message per field (e.g. validation), data = extra facts for the client
class AppError extends Error {
    constructor(message, statusCode = 500, { errors, data } = {}) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = data;
    }
}

const throwError = (message, statusCode, options) => {
    throw new AppError(message, statusCode, options);
};

module.exports = {
    AppError,
    throwError,
};

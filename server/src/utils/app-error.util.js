// Error with an HTTP status code; the error handler answers it with that status and its message.
// message: a key in src/locales/*.json ('users.notFound'); the error handler sends its text in the request's
// language (a message that is not a key is sent as it is).
// Options: errors = message per field (e.g. validation), data = extra facts for the client,
// values = the key's {placeholders} ({ field: 'email' })
class AppError extends Error {
    constructor(message, statusCode = 500, { errors, data, values } = {}) {
        super(message);
        this.name = 'AppError';
        this.statusCode = statusCode;
        this.errors = errors;
        this.data = data;
        this.values = values;
    }
}

const throwError = (message, statusCode, options) => {
    throw new AppError(message, statusCode, options);
};

module.exports = {
    AppError,
    throwError,
};

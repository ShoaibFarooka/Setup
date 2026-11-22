const errorHandler = require('../../../src/middlewares/error-handler.middleware');
const logger = require('../../../src/utils/logger.util');
const { AppError } = require('../../../src/utils/app-error.util');

const run = (error) => {
    const res = {};
    res.status = jest.fn(() => res);
    res.json = jest.fn(() => res);
    errorHandler(error, { method: 'GET', originalUrl: '/test' }, res, jest.fn());
    return { status: res.status.mock.calls[0][0], body: res.json.mock.calls[0][0] };
};

const failure = (message, extra = {}) => ({ success: false, message, ...extra });

describe('error-handler.middleware', () => {
    test('AppError -> its status code and message', () => {
        expect(run(new AppError('User not found!', 404))).toEqual({ status: 404, body: failure('User not found!') });
    });

    test('AppError data is included when given', () => {
        expect(run(new AppError('Conflict', 409, { data: { id: '1' } }))).toEqual({ status: 409, body: failure('Conflict', { data: { id: '1' } }) });
    });

    test('AppError errors are included when given', () => {
        expect(run(new AppError('Invalid', 400, { errors: { name: 'Required' } }))).toEqual({ status: 400, body: failure('Invalid', { errors: { name: 'Required' } }) });
    });

    test('database unavailable -> 503', () => {
        const error = Object.assign(new Error('down'), { name: 'MongooseServerSelectionError' });

        expect(run(error)).toEqual({ status: 503, body: failure('Database is unavailable, please try again later.') });
    });

    test('duplicate key -> 409 naming the field', () => {
        const error = Object.assign(new Error('dup'), { code: 11000, keyValue: { email: 'a@b.com' } });

        expect(run(error)).toEqual({ status: 409, body: failure('A record with that email already exists!') });
    });

    test('duplicate key without a field name -> 409 generic message', () => {
        const error = Object.assign(new Error('dup'), { code: 11000 });

        expect(run(error)).toEqual({ status: 409, body: failure('Duplicate value not allowed!') });
    });

    test('CastError -> 400', () => {
        const error = Object.assign(new Error('cast'), { name: 'CastError', path: '_id' });

        expect(run(error)).toEqual({ status: 400, body: failure('Invalid value for _id') });
    });

    test('Mongoose ValidationError -> 400 with a message per field', () => {
        const error = Object.assign(new Error('invalid'), {
            name: 'ValidationError',
            errors: { username: { message: 'Username is invalid' } },
        });

        expect(run(error)).toEqual({ status: 400, body: failure('Validation failed', { errors: { username: 'Username is invalid' } }) });
    });

    test('MulterError -> 400 with its message', () => {
        const error = Object.assign(new Error('File too large'), { name: 'MulterError' });

        expect(run(error)).toEqual({ status: 400, body: failure('File too large') });
    });

    test('Express client errors that are safe to show -> their status and message', () => {
        const error = Object.assign(new Error('Unexpected token'), { status: 400, expose: true });

        expect(run(error)).toEqual({ status: 400, body: failure('Unexpected token') });
    });

    test('an error with a numeric code is not mistaken for an HTTP status', () => {
        const error = Object.assign(new Error('internal detail'), { code: 404 });

        expect(run(error)).toEqual({ status: 500, body: failure('Internal Server Error') });
    });

    test('logs through req.log when present, so the line carries the request id', () => {
        const reqLog = { error: jest.fn(), warn: jest.fn() };
        const res = { status: jest.fn(() => res), json: jest.fn(() => res) };
        const error = new Error('boom');

        errorHandler(error, { method: 'GET', originalUrl: '/test', log: reqLog }, res, jest.fn());

        expect(reqLog.error).toHaveBeenCalledWith({ err: error }, 'Unhandled error');
        expect(logger.error).not.toHaveBeenCalled();
    });

    test('anything else -> 500 without leaking the message, and logs it', () => {
        const error = new Error('secret details');

        expect(run(error)).toEqual({ status: 500, body: failure('Internal Server Error') });
        expect(logger.error).toHaveBeenCalledWith({ err: error }, 'Unhandled error');
    });
});

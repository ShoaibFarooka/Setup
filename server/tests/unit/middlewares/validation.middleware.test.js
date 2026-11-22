const yup = require('yup');
const { validate, validateRequest, validateParams, validateQuery, validateFile } = require('../../../src/middlewares/validation.middleware');
const { AppError } = require('../../../src/utils/app-error.util');
const { loginSchema } = require('../../../src/validations/auth.validation');

// Failures are passed to next() as a 400 AppError; returns that error
const errorPassedTo = (next) => {
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error.statusCode).toBe(400);
    return error;
};

const idSchema = yup.object().shape({ id: yup.string().length(24, 'Invalid id').required('Id is required') });
const pageSchema = yup.object().shape({ page: yup.number().min(1, 'Page must be at least 1') });

describe('validation.middleware validateRequest', () => {
    test('calls next without an error for a valid body', async () => {
        const req = { body: { identifier: 'admin', password: 'secret' } };
        const next = jest.fn();

        await validateRequest(loginSchema)(req, {}, next);

        expect(next).toHaveBeenCalledWith();
    });

    test('replaces the body with the validated values', async () => {
        const req = { body: { identifier: '  admin  ', password: 'secret' } };

        await validateRequest(loginSchema)(req, {}, jest.fn());

        expect(req.body.identifier).toBe('admin');
    });

    test('invalid fields -> 400 with a message per field', async () => {
        const next = jest.fn();

        await validateRequest(loginSchema)({ body: {} }, {}, next);

        expect(errorPassedTo(next)).toMatchObject({
            message: 'Request validation failed',
            errors: {
                identifier: 'Email or username is required',
                password: 'Password is required',
            },
        });
    });

    test('unknown fields -> 400 listing them', async () => {
        const next = jest.fn();
        const req = { body: { identifier: 'admin', password: 'secret', extra: true } };

        await validateRequest(loginSchema)(req, {}, next);

        expect(errorPassedTo(next)).toMatchObject({
            message: 'Unknown fields present in request body',
            errors: { unknownFields: ['extra'] },
        });
    });

    test('an error that is not a Yup validation error -> 400 with its message', async () => {
        const next = jest.fn();
        const brokenSchema = { fields: {}, validate: jest.fn().mockRejectedValue(new Error('Schema exploded')) };

        await validateRequest(brokenSchema)({ body: {} }, {}, next);

        expect(errorPassedTo(next).errors).toEqual({ message: 'Schema exploded' });
    });
});

describe('validation.middleware validateParams', () => {
    test('calls next without an error for valid params', async () => {
        const next = jest.fn();

        await validateParams(idSchema)({ params: { id: 'a'.repeat(24) } }, {}, next);

        expect(next).toHaveBeenCalledWith();
    });

    test('invalid params -> 400 with errors', async () => {
        const next = jest.fn();

        await validateParams(idSchema)({ params: { id: 'short' } }, {}, next);

        expect(errorPassedTo(next)).toMatchObject({ message: 'Params validation failed', errors: { id: 'Invalid id' } });
    });

    test('unknown params -> 400', async () => {
        const next = jest.fn();

        await validateParams(idSchema)({ params: { id: 'a'.repeat(24), other: 'x' } }, {}, next);

        expect(errorPassedTo(next).errors.unknownFields).toEqual(['other']);
    });
});

describe('validation.middleware validateQuery', () => {
    test('calls next and converts the values (string -> number)', async () => {
        const req = { query: { page: '2' } };
        const next = jest.fn();

        await validateQuery(pageSchema)(req, {}, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.query.page).toBe(2);
    });

    test('invalid query -> 400 with errors', async () => {
        const next = jest.fn();

        await validateQuery(pageSchema)({ query: { page: '0' } }, {}, next);

        expect(errorPassedTo(next)).toMatchObject({ message: 'Query validation failed', errors: { page: 'Page must be at least 1' } });
    });

    test('unknown query fields -> 400', async () => {
        const next = jest.fn();

        await validateQuery(pageSchema)({ query: { sort: 'name' } }, {}, next);

        expect(errorPassedTo(next).errors.unknownFields).toEqual(['sort']);
    });
});

describe('validation.middleware validate', () => {
    test('validates the body by default', async () => {
        const next = jest.fn();

        await validate(loginSchema)({ body: {} }, {}, next);

        expect(errorPassedTo(next).message).toBe('Request validation failed');
    });
});

describe('validation.middleware validateFile', () => {
    const image = (overrides = {}) => ({ size: 1024, mimetype: 'image/png', ...overrides });

    test('required file missing -> 400', () => {
        const next = jest.fn();

        validateFile({ required: true })({}, {}, next);

        expect(errorPassedTo(next).message).toBe('File upload is mandatory');
    });

    test('optional file missing -> next without an error', () => {
        const next = jest.fn();

        validateFile({ required: false })({}, {}, next);

        expect(next).toHaveBeenCalledWith();
    });

    test('file larger than 10MB -> 400', () => {
        const next = jest.fn();

        validateFile({ required: true })({ file: image({ size: 10 * 1024 * 1024 + 1 }) }, {}, next);

        expect(errorPassedTo(next).message).toBe('File size too large');
    });

    test('file that is not an image -> 400', () => {
        const next = jest.fn();

        validateFile({ required: true })({ file: image({ mimetype: 'application/pdf' }) }, {}, next);

        expect(errorPassedTo(next).message).toBe('File type not allowed');
    });

    test('malformed file object -> 400 instead of a crash', () => {
        const next = jest.fn();

        validateFile({ required: true })({ file: { size: 10 } }, {}, next);

        expect(errorPassedTo(next).message).toBe('File validation failed');
    });

    test('valid image -> next without an error', () => {
        const next = jest.fn();

        validateFile({ required: true })({ file: image() }, {}, next);

        expect(next).toHaveBeenCalledWith();
    });
});

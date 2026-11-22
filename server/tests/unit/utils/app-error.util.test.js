const { AppError, throwError } = require('../../../src/utils/app-error.util');

describe('app-error.util', () => {
    test('AppError carries a status code, and optional errors and data', () => {
        const error = new AppError('Invalid', 400, { errors: { name: 'Required' }, data: { id: '1' } });

        expect(error).toBeInstanceOf(Error);
        expect(error).toMatchObject({ name: 'AppError', message: 'Invalid', statusCode: 400, errors: { name: 'Required' }, data: { id: '1' } });
    });

    test('AppError defaults to 500', () => {
        expect(new AppError('Oops').statusCode).toBe(500);
    });

    test('throwError throws an AppError', () => {
        expect(() => throwError('Forbidden', 403)).toThrow(AppError);
        expect(() => throwError('Forbidden', 403)).toThrow(expect.objectContaining({ statusCode: 403 }));
        expect(() => throwError('Conflict', 409, { data: { id: '1' } })).toThrow(expect.objectContaining({ data: { id: '1' } }));
    });
});

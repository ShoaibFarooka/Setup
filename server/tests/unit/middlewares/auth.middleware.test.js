jest.mock('../../../src/repositories/user.repository');

const userRepository = require('../../../src/repositories/user.repository');
const { authenticateRequest, verifyRole } = require('../../../src/middlewares/auth.middleware');
const { AppError } = require('../../../src/utils/app-error.util');
const authUtils = require('../../../src/utils/auth.util');

// Errors go to next() as AppError, so the error handler answers them like every other error
const expectAppError = (next, statusCode, message) => {
    const error = next.mock.calls[0][0];
    expect(error).toBeInstanceOf(AppError);
    expect(error).toMatchObject({ statusCode, message });
};

describe('auth.middleware authenticateRequest', () => {
    test('no Authorization header -> 401', () => {
        const next = jest.fn();

        authenticateRequest({ headers: {} }, {}, next);

        expectAppError(next, 401, 'Invalid or missing token!');
    });

    test('invalid token -> 401', () => {
        const next = jest.fn();

        authenticateRequest({ headers: { authorization: 'Bearer invalid' } }, {}, next);

        expectAppError(next, 401, 'Invalid or missing token!');
    });

    test('a refresh token is not accepted as an access token', () => {
        const next = jest.fn();
        const token = authUtils.createRefreshToken({ id: '1' });

        authenticateRequest({ headers: { authorization: `Bearer ${token}` } }, {}, next);

        expectAppError(next, 401, 'Invalid or missing token!');
    });

    test('valid token -> sets req.user and calls next without an error', () => {
        const token = authUtils.createAccessToken({ id: '1', role: 'user' });
        const req = { headers: { authorization: `Bearer ${token}` } };
        const next = jest.fn();

        authenticateRequest(req, {}, next);

        expect(req.user).toMatchObject({ id: '1', role: 'user' });
        expect(next).toHaveBeenCalledWith();
    });
});

describe('auth.middleware verifyRole', () => {
    afterEach(() => jest.resetAllMocks());

    test('allowed role -> calls next and sets the current role from the database', async () => {
        userRepository.findUserById.mockResolvedValue({ role: 'admin' });
        const req = { user: { id: '1', role: 'user' } };
        const next = jest.fn();

        await verifyRole(['admin'])(req, {}, next);

        expect(next).toHaveBeenCalledWith();
        expect(req.user.role).toBe('admin');
    });

    test('role not in the list -> 403', async () => {
        userRepository.findUserById.mockResolvedValue({ role: 'user' });
        const next = jest.fn();

        await verifyRole(['admin'])({ user: { id: '1' } }, {}, next);

        expectAppError(next, 403, 'Insufficient role');
    });

    test('user no longer exists -> 404', async () => {
        userRepository.findUserById.mockResolvedValue(null);
        const next = jest.fn();

        await verifyRole(['admin'])({ user: { id: '1' } }, {}, next);

        expectAppError(next, 404, 'User not found');
    });

    test('database error -> passed to next as is', async () => {
        const error = new Error('db down');
        userRepository.findUserById.mockRejectedValue(error);
        const next = jest.fn();

        await verifyRole(['admin'])({ user: { id: '1' } }, {}, next);

        expect(next).toHaveBeenCalledWith(error);
    });
});

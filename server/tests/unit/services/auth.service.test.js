jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/repositories/session.repository');

const userRepository = require('../../../src/repositories/user.repository');
const sessionRepository = require('../../../src/repositories/session.repository');
const authService = require('../../../src/services/auth.service');
const authUtils = require('../../../src/utils/auth.util');

afterEach(() => jest.resetAllMocks());

describe('auth.service loginUser', () => {
    test('rejects an unknown user with 401', async () => {
        userRepository.findUserByLoginWithPassword.mockResolvedValue(null);

        await expect(authService.loginUser({ identifier: 'nobody', password: 'x' }))
            .rejects.toMatchObject({ statusCode: 401, message: 'Invalid credentials!' });
    });

    test('rejects a wrong password with 401', async () => {
        const password = await authUtils.hashPassword('right');
        userRepository.findUserByLoginWithPassword.mockResolvedValue({ _id: '1', password });

        await expect(authService.loginUser({ identifier: 'admin', password: 'wrong' }))
            .rejects.toMatchObject({ statusCode: 401 });
        expect(sessionRepository.createSession).not.toHaveBeenCalled();
    });

    test('returns tokens and creates a session holding only the token hash', async () => {
        const password = await authUtils.hashPassword('right');
        userRepository.findUserByLoginWithPassword.mockResolvedValue({ _id: '1', email: 'a@b.com', role: 'user', password });

        const { accessToken, refreshToken } = await authService.loginUser({ identifier: 'admin', password: 'right' });

        expect(authUtils.verifyAccessToken(accessToken)).toMatchObject({ id: '1', role: 'user' });
        expect(sessionRepository.createSession).toHaveBeenCalledWith({
            user: '1',
            tokenHash: authUtils.hashToken(refreshToken),
            expiresAt: expect.any(Date),
        });
    });
});

describe('auth.service refreshToken', () => {
    const tokenFor = (id) => authUtils.createRefreshToken({ id, email: 'a@b.com', role: 'user' });

    test('missing token -> 401', async () => {
        await expect(authService.refreshToken(undefined)).rejects.toMatchObject({ statusCode: 401, message: 'Refresh token not found!' });
    });

    test('invalid token -> 401', async () => {
        await expect(authService.refreshToken('invalid')).rejects.toMatchObject({ statusCode: 401, message: 'Invalid refresh token!' });
    });

    test('no session for the token -> 401', async () => {
        sessionRepository.findSessionByTokenHash.mockResolvedValue(null);

        await expect(authService.refreshToken(tokenFor('1'))).rejects.toMatchObject({ statusCode: 401 });
    });

    test('session that belongs to another user -> 401', async () => {
        sessionRepository.findSessionByTokenHash.mockResolvedValue({ _id: 's1', user: '2' });

        await expect(authService.refreshToken(tokenFor('1'))).rejects.toMatchObject({ statusCode: 401 });
        expect(sessionRepository.updateSessionById).not.toHaveBeenCalled();
    });

    test('user deleted -> 401 and the session is removed', async () => {
        sessionRepository.findSessionByTokenHash.mockResolvedValue({ _id: 's1', user: '1' });
        userRepository.findUserById.mockResolvedValue(null);

        await expect(authService.refreshToken(tokenFor('1'))).rejects.toMatchObject({ statusCode: 401 });
        expect(sessionRepository.deleteSessionById).toHaveBeenCalledWith('s1');
    });

    test('valid -> new tokens with the current role, and the session is rotated', async () => {
        sessionRepository.findSessionByTokenHash.mockResolvedValue({ _id: 's1', user: '1' });
        userRepository.findUserById.mockResolvedValue({ _id: '1', email: 'a@b.com', role: 'admin' });

        const { newAccessToken, newRefreshToken } = await authService.refreshToken(tokenFor('1'));

        expect(authUtils.verifyAccessToken(newAccessToken)).toMatchObject({ id: '1', role: 'admin' });
        expect(sessionRepository.updateSessionById).toHaveBeenCalledWith('s1', {
            tokenHash: authUtils.hashToken(newRefreshToken),
            expiresAt: expect.any(Date),
        });
    });
});

describe('auth.service logout', () => {
    test('logoutUser deletes only the session of that token', async () => {
        await authService.logoutUser('some-token');

        expect(sessionRepository.deleteSessionByTokenHash).toHaveBeenCalledWith(authUtils.hashToken('some-token'));
    });

    test('logoutAllDevices deletes every session of the user', async () => {
        await authService.logoutAllDevices('1');

        expect(sessionRepository.deleteSessionsByUserId).toHaveBeenCalledWith('1');
    });
});

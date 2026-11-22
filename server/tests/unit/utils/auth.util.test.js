const authUtils = require('../../../src/utils/auth.util');

describe('auth.util', () => {
    test('hashPassword and comparePassword match the right password only', async () => {
        const hash = await authUtils.hashPassword('secret');

        expect(hash).not.toBe('secret');
        expect(await authUtils.comparePassword(hash, 'secret')).toBe(true);
        expect(await authUtils.comparePassword(hash, 'wrong')).toBe(false);
    });

    test('access token round trip returns the payload', () => {
        const token = authUtils.createAccessToken({ id: '1', role: 'user' });

        expect(authUtils.verifyAccessToken(token)).toMatchObject({ id: '1', role: 'user' });
    });

    test('access and refresh tokens are not interchangeable', () => {
        const accessToken = authUtils.createAccessToken({ id: '1' });
        const refreshToken = authUtils.createRefreshToken({ id: '1' });

        expect(authUtils.verifyRefreshToken(accessToken)).toBeNull();
        expect(authUtils.verifyAccessToken(refreshToken)).toBeNull();
    });

    test('verify returns null for a malformed token', () => {
        expect(authUtils.verifyAccessToken('not-a-token')).toBeNull();
    });

    test('refresh tokens with the same payload are still unique', () => {
        const first = authUtils.createRefreshToken({ id: '1' });
        const second = authUtils.createRefreshToken({ id: '1' });

        expect(first).not.toBe(second);
    });

    test('hashToken is stable and does not return the token itself', () => {
        expect(authUtils.hashToken('abc')).toBe(authUtils.hashToken('abc'));
        expect(authUtils.hashToken('abc')).not.toBe('abc');
    });

    test('getTokenExpiry returns a future date', () => {
        const token = authUtils.createRefreshToken({ id: '1' });

        expect(authUtils.getTokenExpiry(token).getTime()).toBeGreaterThan(Date.now());
    });
});

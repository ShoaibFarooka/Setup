import { canAccess, getLandingPage } from '@/utils/accessUtils';

describe('canAccess', () => {
    test('a role listed in the route\'s roles may open it', () => {
        expect(canAccess('admin', ['admin'])).toBe(true);
        expect(canAccess('user', ['admin', 'user'])).toBe(true);
    });

    test('a role not listed is refused', () => {
        expect(canAccess('user', ['admin'])).toBe(false);
        expect(canAccess('guest', ['admin', 'user'])).toBe(false);
    });

    test('a route without roles is open to no one', () => {
        expect(canAccess('admin', undefined)).toBe(false);
        expect(canAccess('admin', [])).toBe(false);
    });

    test('a user without a role is refused', () => {
        expect(canAccess(undefined, ['admin'])).toBe(false);
    });
});

describe('getLandingPage', () => {
    test('the first page of the role\'s menu', () => {
        expect(getLandingPage('admin')).toBe('/dashboard');
    });

    test('null for a role without pages', () => {
        expect(getLandingPage('guest')).toBeNull();
    });
});

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

describe('getLandingPage with a grouped menu', () => {
    test('the first page inside the first group when the menu starts with a group', async () => {
        vi.resetModules();
        vi.doMock('@/constants/menuItems', () => ({
            menuItems: { admin: [{ key: 'sales', label: 'Sales', items: [{ path: '/orders', label: 'Orders' }] }, { path: '/profile', label: 'Profile' }] },
        }));
        const { getLandingPage: landingOf } = await import('@/utils/accessUtils');

        expect(landingOf('admin')).toBe('/orders');
        vi.doUnmock('@/constants/menuItems');
    });
});

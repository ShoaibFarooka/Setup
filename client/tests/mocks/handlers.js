import { http } from 'msw';
import { API, VALID_CREDENTIALS, VALID_RESET_TOKEN, failure, preflight, success, testUser } from './responses';

// 25 users for the admin list, newest first by default; the list route pages, searches and sorts them like the
// server does (the pagination contract in ../../../CLAUDE.md)
export const listUsers = Array.from({ length: 25 }, (_, i) => ({
    id: `user-${String(i + 1).padStart(2, '0')}`,
    name: `Person ${String(i + 1).padStart(2, '0')}`,
    username: `person${i + 1}`,
    email: `person${i + 1}@example.com`,
    role: i === 0 ? 'admin' : 'user',
    createdAt: new Date(Date.UTC(2026, 0, i + 1)).toISOString(),
}));

const pageOfUsers = (url) => {
    const page = Number(url.searchParams.get('page') ?? 1);
    const limit = Number(url.searchParams.get('limit') ?? 20);
    const sort = url.searchParams.get('sort') ?? '-createdAt';
    const search = (url.searchParams.get('search') ?? '').toLowerCase();

    const field = sort.replace('-', '');
    const matching = listUsers
        .filter((user) => !search || [user.name, user.username, user.email].some((value) => value.toLowerCase().includes(search)))
        .sort((a, b) => (sort.startsWith('-') ? -1 : 1) * a[field].localeCompare(b[field]));

    return {
        items: matching.slice((page - 1) * limit, page * limit),
        pagination: { page, limit, totalItems: matching.length, totalPages: Math.ceil(matching.length / limit) },
    };
};

// Default fake server: a visitor who is not logged in (no refresh cookie) and one valid account.
// Tests change single routes with server.use(...), e.g. loggedIn() in tests/helpers/renderApp.jsx.
export const handlers = [
    http.options(`${API}/*`, () => preflight()),

    http.post(`${API}/api/auth/refresh-token`, () => failure(401, 'Refresh token not found!')),

    http.post(`${API}/api/auth/login`, async ({ request }) => {
        const { identifier, password } = await request.json();
        if (identifier === VALID_CREDENTIALS.identifier && password === VALID_CREDENTIALS.password) {
            return success({ token: 'access-token-1', sessionExpiresAt: '2030-01-01T00:00:00.000Z' }, 'Logged in successfully');
        }
        return failure(401, 'Invalid credentials!');
    }),

    http.get(`${API}/api/users/me`, ({ request }) => (
        request.headers.get('Authorization')?.startsWith('Bearer ')
            ? success({ user: testUser }, 'User fetched successfully')
            : failure(401, 'Invalid or missing token!')
    )),

    http.get(`${API}/api/users`, ({ request }) => (
        request.headers.get('Authorization')?.startsWith('Bearer ')
            ? success(pageOfUsers(new URL(request.url)), 'Users fetched successfully')
            : failure(401, 'Invalid or missing token!')
    )),

    // Answers like the server: the user with the changes applied
    http.patch(`${API}/api/users/me`, async ({ request }) => {
        if (!request.headers.get('Authorization')?.startsWith('Bearer ')) {
            return failure(401, 'Invalid or missing token!');
        }
        const changes = await request.json();
        return success({ user: { ...testUser, ...changes } }, 'Profile updated successfully');
    }),

    http.post(`${API}/api/auth/logout`, () => success(null, 'Logged out successfully')),

    http.post(`${API}/api/auth/logout-all`, () => success(null, 'Logged out from all devices successfully')),

    // Like the server: the same answer for every address
    http.post(`${API}/api/auth/forgot-password`, () => (
        success(null, 'If an account exists for that email, we have sent a link to reset the password')
    )),

    // Only VALID_RESET_TOKEN works
    http.post(`${API}/api/auth/reset-password`, async ({ request }) => {
        const { token } = await request.json();
        return token === VALID_RESET_TOKEN
            ? success(null, 'Your password has been changed. Log in with the new password')
            : failure(400, 'This reset link is invalid or has expired');
    }),
];

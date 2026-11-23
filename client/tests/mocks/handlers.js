import { http } from 'msw';
import { API, VALID_CREDENTIALS, failure, preflight, success, testUser } from './responses';

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
];

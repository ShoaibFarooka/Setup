import { http, HttpResponse } from 'msw';
import { api, refreshSession } from '@/lib/axiosInstance';
import { ApiError } from '@/lib/apiError';
import { session } from '@/lib/session';
import { server } from '../../mocks/server';
import { API, failure, success } from '../../mocks/responses';

describe('api client', () => {
    test('returns the `data` of a successful response', async () => {
        server.use(http.get(`${API}/api/things`, () => success({ things: [1, 2] }, 'Things fetched')));

        await expect(api.get('/api/things')).resolves.toEqual({ things: [1, 2] });
    });

    test('a failed response becomes an ApiError with the server\'s message, field errors and request id', async () => {
        server.use(http.post(`${API}/api/things`, () => failure(400, 'Request validation failed', {
            errors: { name: 'Name is required' },
            headers: { 'X-Request-Id': 'req-42' },
        })));

        const error = await api.post('/api/things', {}).catch((e) => e);

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({ status: 400, message: 'Request validation failed', errors: { name: 'Name is required' }, requestId: 'req-42' });
    });

    test('a server that cannot be reached becomes an ApiError with status 0', async () => {
        server.use(http.get(`${API}/api/things`, () => HttpResponse.error()));

        await expect(api.get('/api/things')).rejects.toMatchObject({ status: 0 });
    });

    test('sends the access token of the session', async () => {
        let authorization;
        server.use(http.get(`${API}/api/things`, ({ request }) => {
            authorization = request.headers.get('Authorization');
            return success({});
        }));
        session.start('token-1');

        await api.get('/api/things');

        expect(authorization).toBe('Bearer token-1');
    });

    test('an expired access token is refreshed once and the request sent again', async () => {
        server.use(
            http.get(`${API}/api/things`, ({ request }) => (request.headers.get('Authorization') === 'Bearer new-token'
                ? success({ ok: true })
                : failure(401, 'Invalid or missing token!'))),
            http.post(`${API}/api/auth/refresh-token`, () => success({ token: 'new-token' })),
        );
        session.start('expired-token');

        await expect(api.get('/api/things')).resolves.toEqual({ ok: true });
        expect(session.getState().accessToken).toBe('new-token');
    });

    test('when the refresh fails too, the session ends and the original 401 is thrown', async () => {
        server.use(http.get(`${API}/api/things`, () => failure(401, 'Invalid or missing token!')));
        session.start('expired-token');

        await expect(api.get('/api/things')).rejects.toMatchObject({ status: 401 });
        expect(session.getState().status).toBe('anonymous');
    });

    test('several requests failing at once share one refresh (the server rotates the refresh token)', async () => {
        let refreshes = 0;
        server.use(
            http.get(`${API}/api/things`, ({ request }) => (request.headers.get('Authorization') === 'Bearer new-token'
                ? success({ ok: true })
                : failure(401, 'Invalid or missing token!'))),
            http.post(`${API}/api/auth/refresh-token`, () => {
                refreshes += 1;
                return success({ token: 'new-token' });
            }),
        );
        session.start('expired-token');

        await Promise.all([api.get('/api/things'), api.get('/api/things'), api.get('/api/things')]);

        expect(refreshes).toBe(1);
    });

    test('skipRefresh: a 401 is final (e.g. wrong password on login)', async () => {
        let refreshes = 0;
        server.use(
            http.post(`${API}/api/auth/refresh-token`, () => {
                refreshes += 1;
                return success({ token: 'new-token' });
            }),
        );

        await expect(api.post('/api/auth/login', { identifier: 'x', password: 'y' }, { skipRefresh: true }))
            .rejects.toMatchObject({ status: 401, message: 'Invalid credentials!' });
        expect(refreshes).toBe(0);
    });

    test('refreshSession starts the session with the new token', async () => {
        server.use(http.post(`${API}/api/auth/refresh-token`, () => success({ token: 'restored-token' })));

        await expect(refreshSession()).resolves.toBe('restored-token');
        expect(session.getState()).toMatchObject({ status: 'authenticated', accessToken: 'restored-token' });
    });
});

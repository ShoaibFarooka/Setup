import { http } from 'msw';
import { api } from '@/lib/axiosInstance';
import { authService } from '@/services/authService';
import { session } from '@/lib/session';
import { server } from '../../mocks/server';
import { API, success } from '../../mocks/responses';

describe('api client methods', () => {
    test.each([
        ['put', http.put],
        ['patch', http.patch],
    ])('%s sends the body and returns the `data`', async (method, route) => {
        let received;
        server.use(route(`${API}/api/things/1`, async ({ request }) => {
            received = await request.json();
            return success({ thing: { id: '1', name: 'New' } });
        }));

        await expect(api[method]('/api/things/1', { name: 'New' })).resolves.toEqual({ thing: { id: '1', name: 'New' } });
        expect(received).toEqual({ name: 'New' });
    });

    test('delete returns the `data`', async () => {
        server.use(http.delete(`${API}/api/things/1`, () => success(null, 'Deleted')));

        await expect(api.delete('/api/things/1')).resolves.toBeNull();
    });
});

describe('authService.refresh', () => {
    test('restores the session from the refresh token cookie', async () => {
        server.use(http.post(`${API}/api/auth/refresh-token`, () => success({ token: 'restored' })));

        await expect(authService.refresh()).resolves.toBe('restored');
        expect(session.getState().status).toBe('authenticated');
    });
});

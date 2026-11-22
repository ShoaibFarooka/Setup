// No database connection in this file: requests hit the "database unavailable" paths
const mongoose = require('mongoose');
const request = require('supertest');
const app = require('../../src/app');
const authUtils = require('../../src/utils/auth.util');

beforeAll(() => {
    // The app waits 5s before giving up on the database; shortened so the tests stay fast
    mongoose.set('bufferTimeoutMS', 200);
});

describe('database unavailable', () => {
    test('GET /api/health -> 503', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(503);
        expect(res.body).toEqual({ success: false, message: 'Database is disconnected', data: { status: 'error', database: 'disconnected' } });
    });

    test('a request that needs the database -> 503 with a clear message', async () => {
        const res = await request(app).post('/api/auth/login').send({ identifier: 'admin', password: 'secret' });

        expect(res.status).toBe(503);
        expect(res.body).toEqual({ success: false, message: 'Database is unavailable, please try again later.' });
    });

    test('logout -> 503', async () => {
        const res = await request(app).post('/api/auth/logout').set('Cookie', 'refreshToken=some-token');

        expect(res.status).toBe(503);
    });

    test('logout-all -> 503', async () => {
        const token = authUtils.createAccessToken({ id: '507f1f77bcf86cd799439011', role: 'user' });

        const res = await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(503);
    });
});

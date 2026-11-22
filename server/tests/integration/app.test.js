const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');

beforeAll(db.connect);
afterAll(db.close);

describe('app', () => {
    test('GET / -> server status', async () => {
        const res = await request(app).get('/');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, message: 'Server is up!', data: null });
    });

    test('GET /api/health -> 200 when the database is connected', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, message: 'Server is healthy', data: { status: 'ok', database: 'connected' } });
    });

    test('unknown API route -> 404', async () => {
        const res = await request(app).get('/api/does-not-exist');

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: 'Route not found' });
    });

    test('unknown non-API route -> 404', async () => {
        const res = await request(app).get('/does-not-exist');

        expect(res.status).toBe(404);
    });

    test('a request without a body is validated, not crashed on', async () => {
        const res = await request(app).post('/api/auth/login');

        expect(res.status).toBe(400);
        expect(res.body.errors).toHaveProperty('identifier');
    });

    test('malformed JSON -> 400, not 500', async () => {
        const res = await request(app)
            .post('/api/auth/login')
            .set('Content-Type', 'application/json')
            .send('{"identifier": ');

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('security headers are set (helmet)', async () => {
        const res = await request(app).get('/api/health');

        expect(res.headers['x-content-type-options']).toBe('nosniff');
        expect(res.headers).not.toHaveProperty('x-powered-by');
    });
});

describe('app CORS', () => {
    test('allowed origin gets CORS headers', async () => {
        const res = await request(app).get('/api/health').set('Origin', 'http://localhost:5200');

        expect(res.headers['access-control-allow-origin']).toBe('http://localhost:5200');
        expect(res.headers['access-control-allow-credentials']).toBe('true');
    });

    test('same-origin requests are allowed', async () => {
        const server = app.listen(0);
        const origin = `http://127.0.0.1:${server.address().port}`;

        const res = await request(server).get('/api/health').set('Origin', origin);
        server.close();

        expect(res.status).toBe(200);
    });

    test('origin that is not allowed -> 403', async () => {
        const res = await request(app).get('/api/health').set('Origin', 'http://not-allowed.com');

        expect(res.status).toBe(403);
        expect(res.body).toEqual({ success: false, message: 'Not allowed by CORS' });
    });
});

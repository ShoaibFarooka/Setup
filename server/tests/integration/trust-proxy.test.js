const request = require('supertest');
const config = require('../../src/configs/app.config');

// Set before the app is loaded: one proxy in front of the server, and a tiny limit to make the effect visible
config.trustProxy = 1;
config.rateLimit.max = 1;
const app = require('../../src/app');

describe('trust proxy', () => {
    test('is applied to Express', () => {
        expect(app.get('trust proxy')).toBe(1);
    });

    test('visitors behind the proxy are rate limited by their own IP, not the proxy\'s', async () => {
        const first = await request(app).get('/api/does-not-exist').set('X-Forwarded-For', '203.0.113.1');
        const second = await request(app).get('/api/does-not-exist').set('X-Forwarded-For', '203.0.113.2');
        const firstAgain = await request(app).get('/api/does-not-exist').set('X-Forwarded-For', '203.0.113.1');

        expect(first.status).toBe(404);
        expect(second.status).toBe(404);
        expect(firstAgain.status).toBe(429);
    });
});

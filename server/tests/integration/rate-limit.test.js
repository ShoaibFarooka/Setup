const request = require('supertest');
const config = require('../../src/configs/app.config');

// Lowered before the app is loaded, so the limiter is created with it (the real limit is 1000 per 15 minutes)
config.rateLimit.max = 2;
const app = require('../../src/app');

describe('rate limiting', () => {
    test('blocks API requests above the limit with 429', async () => {
        await request(app).get('/api/does-not-exist');
        await request(app).get('/api/does-not-exist');
        const res = await request(app).get('/api/does-not-exist');

        expect(res.status).toBe(429);
        expect(res.body).toEqual({ success: false, message: 'Too many requests from this IP, please try again later' });
    });

    test('the health check is not rate limited', async () => {
        const res = await request(app).get('/api/health');

        expect(res.status).not.toBe(429);
    });
});

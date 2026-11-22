const request = require('supertest');
const config = require('../../src/configs/app.config');
const db = require('../helpers/db');
const { createUser } = require('../helpers/user.factory');

// Lowered before the app is loaded, so the login limiter is created with it (the real limit is 10 per 15 minutes)
config.rateLimit.login.max = 2;
const app = require('../../src/app');

beforeAll(db.connect);
afterAll(db.close);

const login = (identifier, password) => request(app).post('/api/auth/login').send({ identifier, password });

describe('login rate limiting', () => {
    test('successful logins do not count towards the limit', async () => {
        const { user, password } = await createUser();

        const results = [];
        for (let i = 0; i < 4; i++) {
            results.push((await login(user.email, password)).status);
        }

        expect(results).toEqual([200, 200, 200, 200]);
    });

    test('blocks after too many failed attempts, even with the right password', async () => {
        const { user, password } = await createUser();

        await login(user.email, 'wrong');
        await login(user.email, 'wrong');
        const res = await login(user.email, password);

        expect(res.status).toBe(429);
        expect(res.body).toEqual({ success: false, message: 'Too many failed login attempts, please try again later' });
    });
});

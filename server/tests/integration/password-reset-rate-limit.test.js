jest.mock('../../src/configs/email.config', () => ({ sendMail: jest.fn().mockResolvedValue({ messageId: '1' }) }));

const request = require('supertest');
const config = require('../../src/configs/app.config');
const db = require('../helpers/db');

// Lowered before the app is loaded, so the limiters are created with them (real: 5 and 10 per 15 minutes)
config.rateLimit.forgotPassword.max = 2;
config.rateLimit.resetPassword.max = 2;
config.email.enabled = true;
const app = require('../../src/app');

beforeAll(db.connect);
afterAll(db.close);

const forgot = (email) => request(app).post('/api/auth/forgot-password').send({ email });
const reset = () => request(app).post('/api/auth/reset-password').send({ token: 'b'.repeat(64), password: 'NewPassword123' });

describe('password reset rate limiting', () => {
    test('"forgot password" is limited per email address, so one inbox cannot be flooded', async () => {
        const statuses = [];
        for (let i = 0; i < 3; i++) {
            statuses.push((await forgot('victim@example.com')).status);
        }
        const other = await forgot('someone-else@example.com');

        expect(statuses).toEqual([200, 200, 429]);
        expect(other.status).toBe(200);
    });

    test('the limit ignores case and spaces in the address', async () => {
        await forgot('target@example.com');
        await forgot(' TARGET@example.com');
        const res = await forgot('Target@Example.com ');

        expect(res.status).toBe(429);
        expect(res.body).toEqual({ success: false, message: 'Too many password reset requests, please try again later' });
    });

    test('failed resets are limited (against guessing tokens)', async () => {
        const statuses = [];
        for (let i = 0; i < 3; i++) {
            statuses.push((await reset()).status);
        }

        expect(statuses).toEqual([400, 400, 429]);
        expect((await reset()).body.message).toBe('Too many failed password reset attempts, please try again later');
    });
});

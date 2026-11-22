const request = require('supertest');
const config = require('../../src/configs/app.config');
const db = require('../helpers/db');
const { createUser } = require('../helpers/user.factory');
const { loginAs } = require('../helpers/auth.helper');

// The cookie settings are read on every request, so switching to production here applies to this file only
config.isProduction = true;
const app = require('../../src/app');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('refresh token cookie in production', () => {
    test('login sets it HttpOnly, Secure (HTTPS only) and SameSite=Strict', async () => {
        const { user, password } = await createUser();

        const { cookie } = await loginAs(user.email, password);

        expect(cookie[0]).toMatch(/^refreshToken=/);
        expect(cookie[0]).toMatch(/HttpOnly/);
        expect(cookie[0]).toMatch(/Secure/);
        expect(cookie[0]).toMatch(/SameSite=Strict/);
    });

    test('refresh sets the new cookie with the same flags', async () => {
        const { user, password } = await createUser();
        const { cookie } = await loginAs(user.email, password);

        const res = await request(app).post('/api/auth/refresh-token').set('Cookie', cookie);

        const newCookie = res.headers['set-cookie'][0];
        expect(newCookie).toMatch(/HttpOnly/);
        expect(newCookie).toMatch(/Secure/);
        expect(newCookie).toMatch(/SameSite=Strict/);
    });

    test('logout clears it with the same flags, so the browser removes the right cookie', async () => {
        const { user, password } = await createUser();
        const { cookie } = await loginAs(user.email, password);

        const res = await request(app).post('/api/auth/logout').set('Cookie', cookie);

        expect(res.headers['set-cookie'][0]).toMatch(/^refreshToken=;/);
        expect(res.headers['set-cookie'][0]).toMatch(/Secure/);
        expect(res.headers['set-cookie'][0]).toMatch(/SameSite=Strict/);
    });
});

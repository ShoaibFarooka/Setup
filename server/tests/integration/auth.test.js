const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const Session = require('../../src/models/session.model');
const User = require('../../src/models/user.model');
const { createUser } = require('../helpers/user.factory');
const { loginAs } = require('../helpers/auth.helper');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('POST /api/auth/login', () => {
    test('logs in with email and sets an httpOnly refresh token cookie', async () => {
        const { user, password } = await createUser();

        const { res } = await loginAs(user.email, password);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: 'Logged in successfully',
            data: { token: expect.any(String), sessionExpiresAt: expect.any(String) },
        });
        expect(res.headers['set-cookie'][0]).toMatch(/^refreshToken=.+HttpOnly/);
    });

    test('outside production the cookie is SameSite=Lax and not Secure', async () => {
        const { user, password } = await createUser();

        const { cookie } = await loginAs(user.email, password);

        expect(cookie[0]).toMatch(/SameSite=Lax/);
        expect(cookie[0]).not.toMatch(/Secure/);
    });

    test('spaces around the identifier are ignored', async () => {
        const { user, password } = await createUser();

        const { res } = await loginAs(`  ${user.email}  `, password);

        expect(res.status).toBe(200);
    });

    test('logs in with username, case-insensitively', async () => {
        const { user, password } = await createUser();

        const { res } = await loginAs(user.username.toUpperCase(), password);

        expect(res.status).toBe(200);
    });

    test('wrong password -> 401', async () => {
        const { user } = await createUser();

        const { res } = await loginAs(user.email, 'wrong-password');

        expect(res.status).toBe(401);
        expect(res.body).toEqual({ success: false, message: 'Invalid credentials!' });
    });

    test('unknown user -> 401', async () => {
        const { res } = await loginAs('nobody@example.com', 'whatever');

        expect(res.status).toBe(401);
    });

    test('NoSQL injection in the login body is rejected', async () => {
        const { password } = await createUser();

        const res = await request(app).post('/api/auth/login').send({ identifier: { $ne: null }, password });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('missing fields -> 400 with details', async () => {
        const res = await request(app).post('/api/auth/login').send({});

        expect(res.status).toBe(400);
        expect(Object.keys(res.body.errors)).toEqual(['identifier', 'password']);
    });
});

describe('POST /api/auth/refresh-token', () => {
    test('a valid cookie returns a new access token', async () => {
        const { user, password } = await createUser();
        const { cookie } = await loginAs(user.email, password);

        const res = await request(app).post('/api/auth/refresh-token').set('Cookie', cookie);

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Session refreshed successfully');
        expect(res.body.data.token).toEqual(expect.any(String));
        expect(res.headers['set-cookie'][0]).toMatch(/^refreshToken=/);
    });

    test('no cookie -> 401', async () => {
        const res = await request(app).post('/api/auth/refresh-token');

        expect(res.status).toBe(401);
    });

    test('an old refresh token stops working once it has been rotated', async () => {
        const { user, password } = await createUser();
        const { cookie } = await loginAs(user.email, password);

        await request(app).post('/api/auth/refresh-token').set('Cookie', cookie);
        const reuse = await request(app).post('/api/auth/refresh-token').set('Cookie', cookie);

        expect(reuse.status).toBe(401);
    });

    test('user deleted after login -> 401 and the session is removed', async () => {
        const { user, password } = await createUser();
        const { cookie } = await loginAs(user.email, password);
        await User.deleteOne({ _id: user._id });

        const res = await request(app).post('/api/auth/refresh-token').set('Cookie', cookie);

        expect(res.status).toBe(401);
        expect(await Session.countDocuments({ user: user._id })).toBe(0);
    });
});

describe('POST /api/auth/logout', () => {
    test('clears the cookie and the old refresh token stops working', async () => {
        const { user, password } = await createUser();
        const { cookie } = await loginAs(user.email, password);

        const logout = await request(app).post('/api/auth/logout').set('Cookie', cookie);
        const refresh = await request(app).post('/api/auth/refresh-token').set('Cookie', cookie);

        expect(logout.status).toBe(200);
        expect(logout.body).toEqual({ success: true, message: 'Logged out successfully', data: null });
        expect(logout.headers['set-cookie'][0]).toMatch(/^refreshToken=;/);
        expect(refresh.status).toBe(401);
    });

    test('without a cookie -> still 200', async () => {
        const res = await request(app).post('/api/auth/logout');

        expect(res.status).toBe(200);
    });

    test('with an invalid cookie -> still 200', async () => {
        const res = await request(app).post('/api/auth/logout').set('Cookie', 'refreshToken=garbage');

        expect(res.status).toBe(200);
    });
});

describe('POST /api/auth/logout-all', () => {
    test('ends the sessions of every device and clears the cookie', async () => {
        const { user, password } = await createUser();
        const laptop = await loginAs(user.email, password);
        const phone = await loginAs(user.email, password);

        const res = await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${laptop.token}`);
        const laptopRefresh = await request(app).post('/api/auth/refresh-token').set('Cookie', laptop.cookie);
        const phoneRefresh = await request(app).post('/api/auth/refresh-token').set('Cookie', phone.cookie);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ success: true, message: 'Logged out from all devices successfully', data: null });
        expect(res.headers['set-cookie'][0]).toMatch(/^refreshToken=;/);
        expect(laptopRefresh.status).toBe(401);
        expect(phoneRefresh.status).toBe(401);
        expect(await Session.countDocuments({ user: user._id })).toBe(0);
    });

    test('does not touch the sessions of other users', async () => {
        const first = await createUser();
        const second = await createUser();
        const firstLogin = await loginAs(first.user.email, first.password);
        const secondLogin = await loginAs(second.user.email, second.password);

        await request(app).post('/api/auth/logout-all').set('Authorization', `Bearer ${firstLogin.token}`);
        const secondRefresh = await request(app).post('/api/auth/refresh-token').set('Cookie', secondLogin.cookie);

        expect(secondRefresh.status).toBe(200);
    });

    test('no access token -> 401', async () => {
        const res = await request(app).post('/api/auth/logout-all');

        expect(res.status).toBe(401);
    });
});

describe('multiple devices', () => {
    test('each login gets its own session and both can refresh', async () => {
        const { user, password } = await createUser();
        const laptop = await loginAs(user.email, password);
        const phone = await loginAs(user.email, password);

        const laptopRefresh = await request(app).post('/api/auth/refresh-token').set('Cookie', laptop.cookie);
        const phoneRefresh = await request(app).post('/api/auth/refresh-token').set('Cookie', phone.cookie);

        expect(laptopRefresh.status).toBe(200);
        expect(phoneRefresh.status).toBe(200);
        expect(await Session.countDocuments({ user: user._id })).toBe(2);
    });

    test('logging out on one device keeps the other logged in', async () => {
        const { user, password } = await createUser();
        const laptop = await loginAs(user.email, password);
        const phone = await loginAs(user.email, password);

        await request(app).post('/api/auth/logout').set('Cookie', laptop.cookie);
        const laptopRefresh = await request(app).post('/api/auth/refresh-token').set('Cookie', laptop.cookie);
        const phoneRefresh = await request(app).post('/api/auth/refresh-token').set('Cookie', phone.cookie);

        expect(laptopRefresh.status).toBe(401);
        expect(phoneRefresh.status).toBe(200);
    });

    test('the raw refresh token is never stored', async () => {
        const { user, password } = await createUser();
        const { cookie } = await loginAs(user.email, password);
        const rawToken = cookie[0].split(';')[0].split('=')[1];

        const session = await Session.findOne({ user: user._id }).lean();

        expect(session.tokenHash).not.toBe(rawToken);
        expect(JSON.stringify(session)).not.toContain(rawToken);
    });
});

const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const User = require('../../src/models/user.model');
const { createUser } = require('../helpers/user.factory');
const { loginAs } = require('../helpers/auth.helper');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('GET /api/users/me', () => {
    test('returns the logged-in user without private fields', async () => {
        const { user, password } = await createUser();
        const { token } = await loginAs(user.email, password);

        const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: 'User fetched successfully',
            data: { user: { name: user.name, username: user.username, email: user.email, role: 'user' } },
        });
    });

    test('no token -> 401', async () => {
        const res = await request(app).get('/api/users/me');

        expect(res.status).toBe(401);
    });

    test('invalid token -> 401', async () => {
        const res = await request(app).get('/api/users/me').set('Authorization', 'Bearer invalid');

        expect(res.status).toBe(401);
    });

    test('valid token of a deleted user -> 404', async () => {
        const { user, password } = await createUser();
        const { token } = await loginAs(user.email, password);
        await User.deleteOne({ _id: user._id });

        const res = await request(app).get('/api/users/me').set('Authorization', `Bearer ${token}`);

        expect(res.status).toBe(404);
        expect(res.body).toEqual({ success: false, message: 'User not found!' });
    });
});

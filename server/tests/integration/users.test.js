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

describe('PATCH /api/users/me', () => {
    const patchMe = (token, body) => request(app).patch('/api/users/me').set('Authorization', `Bearer ${token}`).send(body);

    test('changes the name and email and returns the updated user', async () => {
        const { user, password } = await createUser();
        const { token } = await loginAs(user.email, password);

        const res = await patchMe(token, { name: '  Grace Hopper ', email: 'Grace@Example.com' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({
            success: true,
            message: 'Profile updated successfully',
            data: { user: { name: 'Grace Hopper', username: user.username, email: 'grace@example.com', role: 'user' } },
        });
        expect(await User.findById(user._id)).toMatchObject({ name: 'Grace Hopper', email: 'grace@example.com' });
    });

    test('keeping your own email is fine', async () => {
        const { user, password } = await createUser();
        const { token } = await loginAs(user.email, password);

        const res = await patchMe(token, { name: 'Same Email', email: user.email });

        expect(res.status).toBe(200);
    });

    test('an email another account uses -> 409', async () => {
        const { user, password } = await createUser();
        const { user: other } = await createUser();
        const { token } = await loginAs(user.email, password);

        const res = await patchMe(token, { email: other.email });

        expect(res.status).toBe(409);
        expect(res.body).toEqual({ success: false, message: 'A user with that email has already been registered!' });
    });

    test('invalid values -> 400 with a message per field', async () => {
        const { user, password } = await createUser();
        const { token } = await loginAs(user.email, password);

        const res = await patchMe(token, { name: 'A', email: 'not-an-email' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual({ name: 'Name must be at least 2 characters', email: 'Enter a valid email address' });
    });

    test('the role (or any other field) cannot be changed this way -> 400', async () => {
        const { user, password } = await createUser();
        const { token } = await loginAs(user.email, password);

        const res = await patchMe(token, { name: 'Sneaky', role: 'admin' });

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual({ unknownFields: ['role'] });
        expect(await User.findById(user._id)).toMatchObject({ role: 'user' });
    });

    test('no token -> 401', async () => {
        const res = await request(app).patch('/api/users/me').send({ name: 'Nobody' });

        expect(res.status).toBe(401);
    });
});

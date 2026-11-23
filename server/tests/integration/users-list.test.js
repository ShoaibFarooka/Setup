const request = require('supertest');
const app = require('../../src/app');
const db = require('../helpers/db');
const { createUser } = require('../helpers/user.factory');
const { loginAs } = require('../helpers/auth.helper');

beforeAll(db.connect);
afterEach(db.clear);
afterAll(db.close);

describe('GET /api/users (admins only, paginated)', () => {
    let token;

    // An admin plus users with known names, created one after another (so creation order is known)
    beforeEach(async () => {
        const { user: admin, password } = await createUser({ name: 'Zed Admin', username: 'zed-admin', email: 'zed@example.com' }, 'admin');
        for (const name of ['Ada Lovelace', 'Grace Hopper', 'Alan Turing', 'Katherine Johnson']) {
            await createUser({ name });
        }
        ({ token } = await loginAs(admin.email, password));
    });

    const list = (query = '') => request(app).get(`/api/users${query}`).set('Authorization', `Bearer ${token}`);

    test('the first page, newest first, with the pagination totals', async () => {
        const res = await list('?limit=2');

        expect(res.status).toBe(200);
        expect(res.body.message).toBe('Users fetched successfully');
        expect(res.body.data.pagination).toEqual({ page: 1, limit: 2, totalItems: 5, totalPages: 3 });
        expect(res.body.data.items.map((user) => user.name)).toEqual(['Katherine Johnson', 'Alan Turing']);
    });

    test('each item has a string id and the public fields only', async () => {
        const res = await list('?limit=1');
        const [user] = res.body.data.items;

        expect(Object.keys(user).sort()).toEqual(['createdAt', 'email', 'id', 'name', 'role', 'username']);
        expect(user.id).toMatch(/^[a-f\d]{24}$/);
    });

    test('later pages continue without repeating anyone', async () => {
        const pages = await Promise.all([1, 2, 3].map((page) => list(`?limit=2&page=${page}`)));
        const names = pages.flatMap((res) => res.body.data.items.map((user) => user.name));

        expect(names).toHaveLength(5);
        expect(new Set(names).size).toBe(5);
    });

    test('a page after the last one is an empty list, not an error', async () => {
        const res = await list('?page=10');

        expect(res.status).toBe(200);
        expect(res.body.data.items).toEqual([]);
        expect(res.body.data.pagination.totalItems).toBe(5);
    });

    test('search matches name, username or email, case-insensitively', async () => {
        const byName = await list('?search=GRACE');
        const byEmail = await list('?search=zed@');

        expect(byName.body.data.items.map((user) => user.name)).toEqual(['Grace Hopper']);
        expect(byEmail.body.data.items.map((user) => user.name)).toEqual(['Zed Admin']);
    });

    test('search treats special characters literally', async () => {
        const res = await list(`?search=${encodeURIComponent('.*')}`);

        expect(res.status).toBe(200);
        expect(res.body.data.items).toEqual([]);
    });

    test('sort by name', async () => {
        const res = await list('?sort=name&limit=3');

        expect(res.body.data.items.map((user) => user.name)).toEqual(['Ada Lovelace', 'Alan Turing', 'Grace Hopper']);
    });

    test('invalid query values -> 400 with a message per field', async () => {
        const res = await list('?page=0&limit=500&sort=password');

        expect(res.status).toBe(400);
        expect(res.body.errors).toEqual({
            page: 'page must be at least 1',
            limit: 'limit must be at most 100',
            sort: 'sort must be one of: name, -name, createdAt, -createdAt',
        });
    });

    test('a normal user -> 403', async () => {
        const { user, password } = await createUser();
        const { token: userToken } = await loginAs(user.email, password);

        const res = await request(app).get('/api/users').set('Authorization', `Bearer ${userToken}`);

        expect(res.status).toBe(403);
    });

    test('no token -> 401', async () => {
        const res = await request(app).get('/api/users');

        expect(res.status).toBe(401);
    });
});

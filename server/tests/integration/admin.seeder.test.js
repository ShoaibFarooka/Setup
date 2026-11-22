// The seeder connects and disconnects by itself; here the in-memory database is used instead
jest.mock('../../src/database/connection');

const mongoose = require('mongoose');
const db = require('../helpers/db');
const config = require('../../src/configs/app.config');
const User = require('../../src/models/user.model');
const seedAdmin = require('../../src/seeders/admin.seeder');
const { loginAs } = require('../helpers/auth.helper');

beforeAll(db.connect);
beforeEach(() => {
    config.admin = { name: 'Admin', username: 'admin', email: 'admin@example.com', password: 'Admin123!' };
    // Keeps the in-memory database connected for the next test
    jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
});
afterEach(async () => {
    jest.restoreAllMocks();
    await db.clear();
});
afterAll(db.close);

describe('admin.seeder with a real database', () => {
    test('creates an admin who can log in', async () => {
        await seedAdmin();

        const { res } = await loginAs('admin', 'Admin123!');
        const admin = await User.findOne({ username: 'admin' });

        expect(res.status).toBe(200);
        expect(admin.role).toBe('admin');
    });

    test('running it twice still leaves one admin', async () => {
        await seedAdmin();
        await seedAdmin();

        expect(await User.countDocuments({ username: 'admin' })).toBe(1);
    });
});

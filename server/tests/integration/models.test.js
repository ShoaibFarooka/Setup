const mongoose = require('mongoose');
const db = require('../helpers/db');
const User = require('../../src/models/user.model');
const Session = require('../../src/models/session.model');
const userRepository = require('../../src/repositories/user.repository');
const { createUser } = require('../helpers/user.factory');

beforeAll(async () => {
    await db.connect();
    // Builds the unique and TTL indexes before the tests rely on them
    await Promise.all([User.init(), Session.init()]);
});
afterEach(db.clear);
afterAll(db.close);

const validUser = (overrides = {}) => ({
    name: 'Test',
    username: 'tester',
    email: 'tester@example.com',
    password: 'hash',
    ...overrides,
});

describe('user model', () => {
    test('rejects an invalid username', async () => {
        await expect(User.create(validUser({ username: 'has space' }))).rejects.toMatchObject({ name: 'ValidationError' });
    });

    test('rejects an unknown role', async () => {
        await expect(User.create(validUser({ role: 'superuser' }))).rejects.toMatchObject({ name: 'ValidationError' });
    });

    test('defaults role to user and stores email and username in lowercase', async () => {
        const user = await User.create(validUser({ username: 'Tester', email: 'Tester@Example.com' }));

        expect(user).toMatchObject({ role: 'user', username: 'tester', email: 'tester@example.com' });
    });

    test('email must be unique', async () => {
        await User.create(validUser());

        await expect(User.create(validUser({ username: 'other' }))).rejects.toMatchObject({ code: 11000 });
    });

    test('password is not returned unless asked for', async () => {
        const { user } = await createUser();

        const found = await User.findById(user._id);

        expect(found.password).toBeUndefined();
    });
});

describe('NoSQL injection protection (sanitizeFilter)', () => {
    // Loading the connection module applies the global Mongoose settings, as it does when the app starts
    beforeAll(() => require('../../src/database/connection'));

    test('is enabled globally', () => {
        expect(mongoose.get('sanitizeFilter')).toBe(true);
    });

    test('an operator coming from user input is not executed', async () => {
        await createUser();
        const userInput = { $ne: null }; // what ?email[$ne]= or a JSON body could produce

        // Without the protection this would match every user; with it, the object is a plain value
        // that cannot be an email, so the query is rejected (answered as 400 by the error handler)
        await expect(User.findOne({ email: userInput })).rejects.toMatchObject({ name: 'CastError' });
    });

    test('operators from your own code still work when marked as trusted', async () => {
        const { user } = await createUser();

        const found = await User.findOne({ email: mongoose.trusted({ $ne: null }) });

        expect(found._id).toEqual(user._id);
    });
});

describe('session model', () => {
    test('has a TTL index on expiresAt, a unique tokenHash and an index on user', async () => {
        const indexes = await Session.collection.indexes();
        const byKey = (field) => indexes.find((index) => Object.keys(index.key).join() === field);

        expect(byKey('expiresAt')).toMatchObject({ expireAfterSeconds: 0 });
        expect(byKey('tokenHash')).toMatchObject({ unique: true });
        expect(byKey('user')).toBeDefined();
    });
});

describe('user repository', () => {
    test('findUserByLoginWithPassword finds by email or username, ignoring case and spaces, with the password', async () => {
        const { user } = await createUser();

        const byEmail = await userRepository.findUserByLoginWithPassword(`  ${user.email.toUpperCase()} `);
        const byUsername = await userRepository.findUserByLoginWithPassword(user.username.toUpperCase());

        expect(byEmail._id).toEqual(user._id);
        expect(byEmail.password).toBeDefined();
        expect(byUsername._id).toEqual(user._id);
    });

    test('updateUserById runs the schema validators', async () => {
        const { user } = await createUser();

        await expect(userRepository.updateUserById(user._id, { username: 'has space' }))
            .rejects.toMatchObject({ name: 'ValidationError' });
    });

    test('updateUserById returns the updated document', async () => {
        const { user } = await createUser();

        const updated = await userRepository.updateUserById(user._id, { name: 'New Name' });

        expect(updated.name).toBe('New Name');
    });
});

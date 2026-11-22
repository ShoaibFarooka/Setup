const mongoose = require('mongoose');
const db = require('../helpers/db');
const { disconnectDB } = require('../../src/database/connection');

beforeAll(db.connect);
afterAll(db.close);

describe('disconnectDB with a real database', () => {
    test('closes an open connection', async () => {
        expect(mongoose.connection.readyState).toBe(mongoose.ConnectionStates.connected);

        await expect(disconnectDB()).resolves.toBe(true);

        expect(mongoose.connection.readyState).toBe(mongoose.ConnectionStates.disconnected);
    });

    test('does nothing when there is no connection', async () => {
        await expect(disconnectDB()).resolves.toBe(false);
    });
});

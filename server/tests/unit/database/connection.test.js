const mongoose = require('mongoose');
const connectDB = require('../../../src/database/connection');
const { isDatabaseUnavailableError, disconnectDB } = require('../../../src/database/connection');
const logger = require('../../../src/utils/logger.util');

describe('database connection isDatabaseUnavailableError', () => {
    test.each([
        'MongooseServerSelectionError',
        'MongoServerSelectionError',
        'MongoNetworkError',
        'MongoNetworkTimeoutError',
        'MongoNotConnectedError',
        'MongoTopologyClosedError',
        'MongoPoolClearedError',
    ])('%s -> true', (name) => {
        expect(isDatabaseUnavailableError(Object.assign(new Error('x'), { name }))).toBe(true);
    });

    test('Mongoose buffering timeout -> true', () => {
        expect(isDatabaseUnavailableError(new Error('Operation `users.findOne()` buffering timed out after 5000ms'))).toBe(true);
    });

    test('other errors and missing values -> false', () => {
        expect(isDatabaseUnavailableError(new Error('Something else'))).toBe(false);
        expect(isDatabaseUnavailableError(undefined)).toBe(false);
    });
});

// Thrown instead of exiting, so a test can see the process would have stopped
const mockExit = () => jest.spyOn(process, 'exit').mockImplementation(() => {
    throw new Error('process.exit');
});

describe('database connection connectDB', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    test('connects and logs the host', async () => {
        jest.spyOn(mongoose, 'connect').mockResolvedValue({ connection: { host: 'db-host' } });

        await connectDB('mongodb://db-host/test');

        expect(mongoose.connect).toHaveBeenCalledWith('mongodb://db-host/test', expect.objectContaining({ serverSelectionTimeoutMS: 5000 }));
        expect(logger.info).toHaveBeenCalledWith({ host: 'db-host' }, 'MongoDB connected');
    });

    test('without retry, logs a short error and exits the process on failure', async () => {
        jest.spyOn(mongoose, 'connect').mockRejectedValue(Object.assign(new Error('down'), { name: 'MongoNetworkError' }));
        mockExit();

        await expect(connectDB('mongodb://db-host/test')).rejects.toThrow('process.exit');
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(logger.error).toHaveBeenCalledWith({ error: { type: 'MongoNetworkError', message: 'down' } }, 'Could not connect to MongoDB');
    });

    test('with retry, logs one short line per failed attempt and tries again after 5 seconds', async () => {
        jest.useFakeTimers();
        // A failure with the full Mongoose detail; only its type and message may reach the logs
        const failure = Object.assign(new Error('connect ECONNREFUSED'), {
            name: 'MongooseServerSelectionError',
            reason: { servers: { db: 'large state' } },
        });
        jest.spyOn(mongoose, 'connect')
            .mockRejectedValueOnce(failure)
            .mockResolvedValueOnce({ connection: { host: 'db-host' } });

        const connecting = connectDB('mongodb://db-host/test', { retry: true });
        await jest.advanceTimersByTimeAsync(5000);
        await connecting;

        expect(mongoose.connect).toHaveBeenCalledTimes(2);
        expect(logger.warn).toHaveBeenCalledTimes(1);
        expect(logger.warn).toHaveBeenCalledWith(
            { error: { type: 'MongooseServerSelectionError', message: 'connect ECONNREFUSED' }, attempt: 1, retryInMs: 5000 },
            'Could not connect to MongoDB, retrying',
        );
        expect(logger.error).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith({ host: 'db-host' }, 'MongoDB connected');
    });

    test('connection events fired by a failed attempt are not logged a second time', async () => {
        mockExit();
        jest.spyOn(mongoose, 'connect').mockImplementation(async () => {
            mongoose.connection.emit('error', new Error('down'));
            mongoose.connection.emit('disconnected');
            throw new Error('down');
        });

        await expect(connectDB('mongodb://db-host/test')).rejects.toThrow('process.exit');

        expect(logger.error).toHaveBeenCalledTimes(1);
        expect(logger.warn).not.toHaveBeenCalled();
    });

    test('after connecting, a lost connection and errors are logged (short)', async () => {
        jest.spyOn(mongoose, 'connect').mockResolvedValue({ connection: { host: 'db-host' } });
        await connectDB('mongodb://db-host/test');

        mongoose.connection.emit('disconnected');
        mongoose.connection.emit('error', Object.assign(new Error('timeout'), { name: 'MongoNetworkTimeoutError', reason: 'large' }));
        mongoose.connection.emit('reconnected');

        expect(logger.warn).toHaveBeenCalledWith('MongoDB disconnected. Requests will fail until the connection is back.');
        expect(logger.error).toHaveBeenCalledWith({ error: { type: 'MongoNetworkTimeoutError', message: 'timeout' } }, 'MongoDB connection error');
        expect(logger.info).toHaveBeenCalledWith('MongoDB reconnected');
    });
});

describe('database connection disconnectDB', () => {
    afterEach(() => {
        jest.restoreAllMocks();
        jest.useRealTimers();
    });

    // Closing a real connection is tested in tests/integration/database-connection.test.js

    test('stops further connection attempts', async () => {
        jest.useFakeTimers();
        jest.spyOn(mongoose, 'connect').mockRejectedValue(new Error('down'));

        const connecting = connectDB('mongodb://db-host/test', { retry: true });
        await jest.advanceTimersByTimeAsync(0);
        await disconnectDB();
        await jest.advanceTimersByTimeAsync(5000);
        await connecting;

        expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });

    test('a shutdown during an attempt ends the attempt quietly', async () => {
        let failAttempt;
        jest.spyOn(mongoose, 'connect').mockImplementation(() => new Promise((resolve, reject) => {
            failAttempt = reject;
        }));

        const connecting = connectDB('mongodb://db-host/test', { retry: true });
        await disconnectDB();
        failAttempt(new Error('closed'));
        await connecting;

        expect(logger.warn).not.toHaveBeenCalled();
        expect(mongoose.connect).toHaveBeenCalledTimes(1);
    });
});

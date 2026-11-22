const mongoose = require('mongoose');
const connectDB = require('../../../src/database/connection');
const { isDatabaseUnavailableError } = require('../../../src/database/connection');
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

    test('without retry, exits the process on failure', async () => {
        jest.spyOn(mongoose, 'connect').mockRejectedValue(new Error('down'));
        // Thrown so the retry loop stops, like a real process.exit would
        jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

        await expect(connectDB('mongodb://db-host/test')).rejects.toThrow('process.exit');
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('with retry, tries again after 5 seconds until it connects', async () => {
        jest.useFakeTimers();
        jest.spyOn(mongoose, 'connect')
            .mockRejectedValueOnce(new Error('down'))
            .mockResolvedValueOnce({ connection: { host: 'db-host' } });

        const connecting = connectDB('mongodb://db-host/test', { retry: true });
        await jest.advanceTimersByTimeAsync(5000);
        await connecting;

        expect(mongoose.connect).toHaveBeenCalledTimes(2);
        expect(logger.warn).toHaveBeenCalledWith({ attempt: 1, retryInMs: 5000 }, 'Retrying MongoDB connection');
        expect(logger.info).toHaveBeenCalledWith({ host: 'db-host' }, 'MongoDB connected');
    });
});

jest.mock('../../src/database/connection');

const mongoose = require('mongoose');
const config = require('../../src/configs/app.config');
const connectDB = require('../../src/database/connection');
const logger = require('../../src/utils/logger.util');
const app = require('../../src/app');

// Port 0 = any free port, so the test never clashes with a running dev server
config.port = 0;
const { startServer, shutdown, registerProcessHandlers } = require('../../index');

// Resolves when the code under test calls process.exit, with the exit code
const waitForExit = () => new Promise((resolve) => {
    jest.spyOn(process, 'exit').mockImplementation(resolve);
});

describe('index', () => {
    afterEach(() => jest.restoreAllMocks());

    test('requiring the file does not start a server or connect to the database', () => {
        expect(connectDB).not.toHaveBeenCalled();
    });

    test('startServer listens and connects to the database with retry', async () => {
        const server = startServer();
        await new Promise((resolve) => server.on('listening', resolve));

        expect(server.listening).toBe(true);
        expect(connectDB).toHaveBeenCalledWith(config.databaseUri, { retry: true });
        expect(logger.info).toHaveBeenCalledWith({ host: config.host, port: server.address().port }, 'Server listening');

        server.close();
    });

    test('startServer throws when the server cannot start (e.g. port in use)', () => {
        jest.spyOn(app, 'listen').mockImplementation((port, host, callback) => callback(new Error('EADDRINUSE')));

        expect(() => startServer()).toThrow('EADDRINUSE');
    });

    test('shutdown closes the server, then the database connection, then exits with 0', async () => {
        const server = startServer();
        await new Promise((resolve) => server.on('listening', resolve));
        jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
        const exited = waitForExit();

        shutdown('SIGTERM');
        const code = await exited;

        expect(code).toBe(0);
        expect(server.listening).toBe(false);
        expect(mongoose.disconnect).toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith({ signal: 'SIGTERM' }, 'Shutting down gracefully');
        expect(logger.info).toHaveBeenCalledWith('Database connection closed');
    });
});

describe('index registerProcessHandlers', () => {
    let handlers;

    beforeEach(() => {
        handlers = {};
        // Captured instead of really registered, so the test process is not affected
        jest.spyOn(process, 'on').mockImplementation((event, handler) => {
            handlers[event] = handler;
        });
        registerProcessHandlers();
    });

    afterEach(() => jest.restoreAllMocks());

    test('registers handlers for crashes and stop signals', () => {
        expect(Object.keys(handlers).sort()).toEqual(['SIGINT', 'SIGTERM', 'uncaughtException', 'unhandledRejection']);
    });

    test.each([
        ['uncaughtException', 'Uncaught Exception'],
        ['unhandledRejection', 'Unhandled Promise Rejection'],
    ])('%s logs the error as fatal and exits with 1', (event, label) => {
        jest.spyOn(process, 'exit').mockImplementation(() => {});

        handlers[event](new Error('boom'));

        expect(logger.fatal).toHaveBeenCalledWith({ err: expect.objectContaining({ message: 'boom' }) }, label);
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test('an unhandled rejection without an Error object is still logged', () => {
        jest.spyOn(process, 'exit').mockImplementation(() => {});

        handlers.unhandledRejection(undefined);

        expect(logger.fatal).toHaveBeenCalledWith({ err: undefined }, 'Unhandled Promise Rejection');
        expect(process.exit).toHaveBeenCalledWith(1);
    });

    test.each(['SIGTERM', 'SIGINT'])('%s shuts the server down gracefully', async (signal) => {
        const server = startServer();
        await new Promise((resolve) => server.on('listening', resolve));
        jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
        const exited = waitForExit();

        handlers[signal]();

        expect(await exited).toBe(0);
        expect(logger.info).toHaveBeenCalledWith({ signal }, 'Shutting down gracefully');
    });
});

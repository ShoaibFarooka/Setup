const logger = require('../../../src/utils/logger.util');
const { createCapturingLogger } = require('../../helpers/log-capture');

describe('logger.util createLogger', () => {
    test('writes one JSON object per line with level, ISO time and message', () => {
        const { log, lines } = createCapturingLogger();

        log.info({ userId: '1' }, 'User logged in');

        expect(lines()).toEqual([
            expect.objectContaining({
                level: 'info',
                time: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/),
                userId: '1',
                msg: 'User logged in',
            }),
        ]);
    });

    test('skips lines below the configured level', () => {
        const { log, lines } = createCapturingLogger('info');

        log.debug('details');
        log.warn('careful');

        expect(lines().map((line) => line.level)).toEqual(['warn']);
    });

    test('writes errors under err with type, message and stack', () => {
        const { log, lines } = createCapturingLogger();

        log.error({ err: new TypeError('boom') }, 'Something failed');

        expect(lines()[0].err).toEqual(expect.objectContaining({ type: 'TypeError', message: 'boom', stack: expect.any(String) }));
    });

    test('a short error summary under `error` is written as it is (not reformatted like `err`)', () => {
        const { log, lines } = createCapturingLogger();

        log.warn({ error: { type: 'MongoNetworkError', message: 'down' } }, 'Could not connect');

        expect(lines()[0].error).toEqual({ type: 'MongoNetworkError', message: 'down' });
    });

    test('never writes tokens, cookies or passwords', () => {
        const { log, lines } = createCapturingLogger();

        log.info({
            req: { headers: { authorization: 'Bearer secret-token', cookie: 'refreshToken=secret' } },
            body: { password: 'secret', token: 'secret', refreshToken: 'secret' },
        }, 'Request');

        const line = JSON.stringify(lines()[0]);
        expect(line).not.toContain('secret');
        expect(line).toContain('[REDACTED]');
    });
});

describe('logger.util buildOptions', () => {
    test('development uses pino-pretty for readable output', () => {
        expect(logger.buildOptions({ level: 'debug', pretty: true }).transport).toMatchObject({ target: 'pino-pretty' });
    });

    test('production writes plain JSON', () => {
        expect(logger.buildOptions({ level: 'info', pretty: false })).not.toHaveProperty('transport');
    });

    test('uses the level from config by default (silent in tests)', () => {
        expect(logger.buildOptions().level).toBe('silent');
    });
});

describe('logger.util methods', () => {
    test.each(['fatal', 'error', 'warn', 'info', 'debug', 'trace'])('%s passes its arguments to pino', (level) => {
        const spy = jest.spyOn(logger.pino, level);

        logger[level]({ id: '1' }, 'message');

        expect(spy).toHaveBeenCalledWith({ id: '1' }, 'message');
        spy.mockRestore();
    });
});

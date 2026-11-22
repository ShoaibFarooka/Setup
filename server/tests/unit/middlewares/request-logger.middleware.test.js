const express = require('express');
const request = require('supertest');
const { createRequestLogger } = require('../../../src/middlewares/request-logger.middleware');
const { createCapturingLogger } = require('../../helpers/log-capture');

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

// A tiny app with only the request logger, so the log lines can be read back
const setup = () => {
    const capture = createCapturingLogger();
    const app = express();
    app.use(createRequestLogger(capture.log));
    app.get('/ok', (req, res) => {
        req.log.info('inside the handler');
        res.json({});
    });
    app.get('/missing', (req, res) => res.status(404).json({}));
    app.get('/broken', (req, res) => res.status(500).json({}));
    app.get('/api/health', (req, res) => res.json({}));

    // The request line is written when the response finishes; wait a tick so it is there
    const lines = async () => {
        await new Promise((resolve) => setImmediate(resolve));
        return capture.lines();
    };
    return { app, lines };
};

describe('request-logger.middleware', () => {
    test('logs one line per request with id, method, url, status and duration', async () => {
        const { app, lines } = setup();

        const res = await request(app).get('/ok');

        const line = (await lines()).find((entry) => entry.msg === 'request completed');
        expect(line).toMatchObject({
            level: 'info',
            req: { id: res.headers['x-request-id'], method: 'GET', url: '/ok' },
            res: { statusCode: 200 },
            responseTime: expect.any(Number),
        });
    });

    test('lines written with req.log inside a handler carry the same request id', async () => {
        const { app, lines } = setup();

        const res = await request(app).get('/ok');

        const line = (await lines()).find((entry) => entry.msg === 'inside the handler');
        expect(line.reqId).toBe(res.headers['x-request-id']);
    });

    test('returns a new UUID as X-Request-Id', async () => {
        const { app } = setup();

        const res = await request(app).get('/ok');

        expect(res.headers['x-request-id']).toMatch(UUID);
    });

    test('reuses a safe incoming X-Request-Id', async () => {
        const { app } = setup();

        const res = await request(app).get('/ok').set('X-Request-Id', 'from-proxy_123');

        expect(res.headers['x-request-id']).toBe('from-proxy_123');
    });

    test('replaces an unsafe incoming X-Request-Id', async () => {
        const { app } = setup();

        const res = await request(app).get('/ok').set('X-Request-Id', 'bad id\twith "quotes"');

        expect(res.headers['x-request-id']).toMatch(UUID);
    });

    test.each([
        ['/missing', 'warn'],
        ['/broken', 'error'],
    ])('%s is logged at %s level', async (url, level) => {
        const { app, lines } = setup();

        await request(app).get(url);

        expect((await lines()).find((entry) => entry.res).level).toBe(level);
    });

    test('does not log headers, so tokens and cookies never reach the logs', async () => {
        const { app, lines } = setup();

        await request(app).get('/ok').set('Authorization', 'Bearer secret-token').set('Cookie', 'refreshToken=secret');

        expect(JSON.stringify(await lines())).not.toContain('secret');
    });

    test('health checks are not logged', async () => {
        const { app, lines } = setup();

        await request(app).get('/api/health');

        expect(await lines()).toEqual([]);
    });
});

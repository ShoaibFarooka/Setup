const { randomUUID } = require('crypto');
const pinoHttp = require('pino-http');
const config = require('../configs/app.config');
const logger = require('../utils/logger.util');

// An incoming X-Request-Id (e.g. from a proxy or the client) is reused only if it is safe to write to the logs
const REQUEST_ID_PATTERN = /^[\w-]{1,100}$/;

// Every request gets an id: it is on every log line of that request (req.log) and returned in X-Request-Id,
// so one id finds everything that happened in a request
const genReqId = (req, res) => {
    const incoming = req.headers['x-request-id'];
    const id = typeof incoming === 'string' && REQUEST_ID_PATTERN.test(incoming) ? incoming : randomUUID();
    res.setHeader('X-Request-Id', id);
    return id;
};

const createRequestLogger = (baseLogger = logger.pino) => pinoHttp({
    logger: baseLogger,
    genReqId,
    // Lines written with req.log in handlers get just { reqId } instead of the whole request
    quietReqLogger: true,
    // One line per finished request: info for success, warn for client errors, error for server errors
    customLogLevel: (req, res, err) => {
        if (err || res.statusCode >= 500) {
            return 'error';
        }
        return res.statusCode >= 400 ? 'warn' : 'info';
    },
    // Only what is useful; headers (with tokens and cookies) are left out
    serializers: {
        req: (req) => ({ id: req.id, method: req.method, url: req.url, remoteAddress: req.remoteAddress }),
        res: (res) => ({ statusCode: res.statusCode }),
    },
    // Health checks are called every few seconds by load balancers and would flood the logs
    autoLogging: { ignore: (req) => req.url === `${config.apiPrefix}/health` },
});

module.exports = {
    requestLogger: createRequestLogger(),
    createRequestLogger,
};

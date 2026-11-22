// Structured logging with pino: one JSON object per line on stdout (production), readable coloured lines in development.
// Call style: logger.info('Message') or logger.info({ some: 'fields' }, 'Message'); errors go in `err`:
// logger.error({ err: error }, 'What failed')
const pino = require('pino');
const config = require('../configs/app.config');

// Never written to the logs, wherever they appear
const REDACTED_PATHS = [
    'req.headers.authorization',
    'req.headers.cookie',
    'res.headers["set-cookie"]',
    '*.password',
    '*.token',
    '*.refreshToken',
];

const buildOptions = ({ level = config.logLevel, pretty = config.env === 'development' } = {}) => ({
    level,
    timestamp: pino.stdTimeFunctions.isoTime,
    // "level":"info" instead of pino's numeric "level":30
    formatters: { level: (label) => ({ level: label }) },
    redact: { paths: REDACTED_PATHS, censor: '[REDACTED]' },
    // Development: readable coloured lines instead of JSON (pino-pretty is a dev dependency)
    ...(pretty && {
        transport: {
            target: 'pino-pretty',
            options: { colorize: true, translateTime: 'SYS:yyyy-mm-dd HH:MM:ss.l', ignore: 'pid,hostname' },
        },
    }),
});

// destination: where to write (default stdout); tests pass a stream to read the lines back
const createLogger = ({ level, pretty, destination } = {}) => (destination
    ? pino(buildOptions({ level, pretty: false }), destination)
    : pino(buildOptions({ level, pretty })));

const baseLogger = createLogger();

// Plain methods (instead of the pino instance itself) so tests can spy on them
const logger = {
    fatal: (...args) => baseLogger.fatal(...args),
    error: (...args) => baseLogger.error(...args),
    warn: (...args) => baseLogger.warn(...args),
    info: (...args) => baseLogger.info(...args),
    debug: (...args) => baseLogger.debug(...args),
    trace: (...args) => baseLogger.trace(...args),
    // The pino instance, for libraries that need it (pino-http)
    pino: baseLogger,
    createLogger,
    buildOptions,
};

module.exports = logger;

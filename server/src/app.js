const express = require('express');
const mongoose = require('mongoose');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');
const config = require('./configs/app.config');
const { AppError } = require('./utils/app-error.util');
const { successBody, errorBody } = require('./utils/response.util');
const routes = require('./routes/index.routes');
const trimMiddleware = require('./middlewares/trim.middleware');
const { requestLogger } = require('./middlewares/request-logger.middleware');
const { apiLimiter } = require('./middlewares/rate-limit.middleware');
const errorHandlerMiddleware = require('./middlewares/error-handler.middleware');

const app = express();
// Same query string parsing as Express 4 (Express 5 defaults to the simpler parser)
app.set('query parser', 'extended');
// Behind a proxy, req.ip (used by rate limiting) must come from X-Forwarded-For instead of the proxy's address
if (config.trustProxy) {
    app.set('trust proxy', config.trustProxy);
}

// Allowed: requests without an Origin, same-origin requests and the origins in CORS_ORIGINS
const corsOptionsDelegate = (req, callback) => {
    const origin = req.header('Origin');
    const sameOrigin = origin === `${req.protocol}://${req.get('host')}`;

    if (!origin || sameOrigin || config.allowedOrigins.includes(origin)) {
        return callback(null, {
            origin: true,
            methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
            allowedHeaders: ['Content-Type', 'Authorization'],
            // Lets the browser app read the request id (to show or report it); hidden from it otherwise
            exposedHeaders: ['X-Request-Id'],
            credentials: true,
        });
    }

    callback(new AppError('Not allowed by CORS', 403));
};

// First, so every request (even one rejected later, e.g. by CORS or malformed JSON) is logged with its id
app.use(requestLogger);
// Explicit limit for JSON bodies (larger ones get 413); files go through the upload middleware, not JSON
app.use(express.json({ limit: '100kb' }));
// Express 5 leaves req.body undefined when a request has no JSON body; validation and controllers expect {}
app.use((req, res, next) => {
    req.body ??= {};
    next();
});
app.use(cookieParser());
app.use(cors(corsOptionsDelegate));
app.use(helmet());
app.use(compression());
app.use(trimMiddleware);

// Status check; ok only when the database is connected
app.get(`${config.apiPrefix}/health`, (req, res) => {
    const connected = mongoose.connection.readyState === 1;
    const data = { status: connected ? 'ok' : 'error', database: connected ? 'connected' : 'disconnected' };

    res.status(connected ? 200 : 503).json(connected
        ? successBody('Server is healthy', data)
        : errorBody('Database is disconnected', { data }));
});

// API answers are personal or change often: browsers and proxies must not store them
app.use(config.apiPrefix, (req, res, next) => {
    res.set('Cache-Control', 'no-store');
    next();
});
app.use(config.apiPrefix, apiLimiter);
app.use(config.apiPrefix, routes);

app.get('/', (req, res) => {
    res.status(200).json(successBody('Server is up!'));
});

// 404 Handler
app.use((req, res) => {
    res.status(404).json(errorBody('Route not found'));
});

app.use(errorHandlerMiddleware);

module.exports = app;

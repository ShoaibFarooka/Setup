// The only place that reads process.env: everything else gets its settings from this config
const path = require('path');
const yup = require('yup');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });

// An empty value in .env (e.g. PORT=) counts as not set, so the default applies
const emptyToUndefined = (value, originalValue) => (originalValue === '' ? undefined : value);
const number = () => yup.number().transform(emptyToUndefined);
const boolean = () => yup.boolean().transform(emptyToUndefined);
const string = () => yup.string().transform(emptyToUndefined);
// Comma-separated origins, e.g. https://app.example.com,https://admin.example.com
const ORIGIN_PATTERN = /^https?:\/\/[^/\s]+$/;
const splitList = (value) => (value ? value.split(',').map((item) => item.trim()).filter(Boolean) : []);
const DEFAULT_DEV_ORIGINS = 'http://localhost:5200';

const requiredWhenEmailEnabled = (schema) =>
    schema.when('EMAIL_ENABLED', { is: true, then: (s) => s.required('is required when EMAIL_ENABLED=true') });

const envSchema = yup.object({
    NODE_ENV: string().oneOf(['development', 'production', 'test']).default('development'),
    PORT: number().integer().positive().default(5000),
    HOST: string().default('127.0.0.1'),
    // Number of proxies in front of the server (e.g. 1 behind Nginx or a load balancer); 0 = none
    TRUST_PROXY: number().integer().min(0).default(0),
    // Not set: debug in development, info in production, silent in tests
    LOG_LEVEL: string().oneOf(['fatal', 'error', 'warn', 'info', 'debug', 'trace', 'silent']),
    // Not set: the local client in development, nothing in production
    CORS_ORIGINS: string().test(
        'origins',
        'must be comma-separated origins like https://app.example.com (no path or trailing slash)',
        (value) => splitList(value).every((origin) => ORIGIN_PATTERN.test(origin)),
    ),

    DB_URI: string().required('is required'),

    // Short secrets can be guessed by brute force, which would let anyone create valid tokens
    ACCESS_TOKEN_SECRET: string().required('is required').min(32, 'must be at least 32 characters'),
    REFRESH_TOKEN_SECRET: string().required('is required').min(32, 'must be at least 32 characters')
        .notOneOf([yup.ref('ACCESS_TOKEN_SECRET')], 'must be different from ACCESS_TOKEN_SECRET'),
    ACCESS_TOKEN_EXPIRY_TIME: string().default('5m'),
    REFRESH_TOKEN_EXPIRY_TIME: string().default('7d'),

    ADMIN_NAME: string().default('Admin'),
    ADMIN_USERNAME: string(),
    ADMIN_EMAIL: string().email('must be a valid email'),
    ADMIN_PASSWORD: string(),

    // Email is optional: its settings are only required when it is enabled
    EMAIL_ENABLED: boolean().default(false),
    EMAIL_HOST: requiredWhenEmailEnabled(string()),
    EMAIL_PORT: number().integer().positive().default(587),
    EMAIL_SECURE: boolean().default(false),
    SENDER_EMAIL: requiredWhenEmailEnabled(string().email('must be a valid email')),
    SENDER_EMAIL_PASSWORD: requiredWhenEmailEnabled(string()),
});

let env;
try {
    env = envSchema.validateSync(process.env, { abortEarly: false, stripUnknown: true });
} catch (error) {
    const problems = error.inner.map((err) => `  - ${err.path} ${err.message}`).join('\n');
    // console instead of the logger: the logger needs this config, which failed to load
    console.error(`Invalid environment variables:\n${problems}`);
    process.exit(1);
}

const isProduction = env.NODE_ENV === 'production';
const DEFAULT_LOG_LEVELS = { development: 'debug', production: 'info', test: 'silent' };

const config = {
    env: env.NODE_ENV,
    isProduction,
    port: env.PORT,
    host: env.HOST,
    trustProxy: env.TRUST_PROXY,
    logLevel: env.LOG_LEVEL ?? DEFAULT_LOG_LEVELS[env.NODE_ENV],
    apiPrefix: '/api',
    databaseUri: env.DB_URI,
    allowedOrigins: splitList(env.CORS_ORIGINS ?? (isProduction ? '' : DEFAULT_DEV_ORIGINS)),
    rateLimit: {
        windowMs: 15 * 60 * 1000,
        max: 1000,
        // Failed login attempts per IP; successful logins do not count
        login: {
            windowMs: 15 * 60 * 1000,
            max: 10,
        },
    },
    auth: {
        // bcrypt cost: each +1 doubles the time to hash (and to guess) a password; 12 takes about 250ms
        saltRounds: 12,
        accessTokenSecret: env.ACCESS_TOKEN_SECRET,
        accessTokenExpiryTime: env.ACCESS_TOKEN_EXPIRY_TIME,
        refreshTokenSecret: env.REFRESH_TOKEN_SECRET,
        refreshTokenExpiryTime: env.REFRESH_TOKEN_EXPIRY_TIME,
    },
    admin: {
        name: env.ADMIN_NAME,
        username: env.ADMIN_USERNAME,
        email: env.ADMIN_EMAIL,
        password: env.ADMIN_PASSWORD,
    },
    email: {
        enabled: env.EMAIL_ENABLED,
        host: env.EMAIL_HOST,
        port: env.EMAIL_PORT,
        secure: env.EMAIL_SECURE,
        user: env.SENDER_EMAIL,
        password: env.SENDER_EMAIL_PASSWORD,
        from: env.SENDER_EMAIL,
    },
};

module.exports = config;

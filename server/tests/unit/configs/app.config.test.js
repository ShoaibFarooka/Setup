const CONFIG_PATH = '../../../src/configs/app.config';

// Loads a fresh copy of the config with the given environment; dotenv is mocked so server/.env cannot fill the gaps
const loadConfig = (env) => {
    const original = { ...process.env };
    Object.entries(env).forEach(([key, value]) => {
        if (value === undefined) {
            delete process.env[key];
        } else {
            process.env[key] = value;
        }
    });

    try {
        let config;
        jest.isolateModules(() => {
            jest.doMock('dotenv', () => ({ config: jest.fn() }));
            config = require(CONFIG_PATH);
        });
        return config;
    } finally {
        process.env = original;
    }
};

// process.exit is replaced by a throw so the config stops loading, like a real exit would
const expectExit = (env) => {
    jest.spyOn(process, 'exit').mockImplementation(() => {
        throw new Error('process.exit');
    });
    // Printed with console.error: the logger itself depends on the config that failed
    jest.spyOn(console, 'error').mockImplementation(() => {});

    expect(() => loadConfig(env)).toThrow('process.exit');
    expect(process.exit).toHaveBeenCalledWith(1);
    return console.error.mock.calls.at(-1)[0];
};

describe('app.config', () => {
    afterEach(() => jest.restoreAllMocks());

    test('exits and names the variable when a required one is missing', () => {
        expect(expectExit({ ACCESS_TOKEN_SECRET: undefined })).toContain('ACCESS_TOKEN_SECRET');
    });

    test('exits when a value has the wrong type', () => {
        expect(expectExit({ PORT: 'abc' })).toContain('PORT');
    });

    test('exits when email is enabled but its settings are missing', () => {
        const message = expectExit({ EMAIL_ENABLED: 'true', EMAIL_HOST: undefined, SENDER_EMAIL: undefined, SENDER_EMAIL_PASSWORD: undefined });

        expect(message).toContain('EMAIL_HOST');
        expect(message).toContain('SENDER_EMAIL');
        expect(message).toContain('SENDER_EMAIL_PASSWORD');
    });

    test('email settings are not required while email is disabled', () => {
        const config = loadConfig({ EMAIL_ENABLED: undefined, EMAIL_HOST: undefined });

        expect(config.email.enabled).toBe(false);
    });

    test('uses defaults for optional variables, and empty values count as not set', () => {
        const config = loadConfig({ PORT: '', HOST: undefined, TRUST_PROXY: undefined, ACCESS_TOKEN_EXPIRY_TIME: undefined, REFRESH_TOKEN_EXPIRY_TIME: undefined });

        expect(config).toMatchObject({
            port: 5000,
            host: '127.0.0.1',
            trustProxy: 0,
            apiPrefix: '/api',
            isProduction: false,
            auth: { accessTokenExpiryTime: '5m', refreshTokenExpiryTime: '7d' },
            email: { enabled: false, port: 587, secure: false },
        });
    });

    test('empty text values count as not set, like in .env.example', () => {
        const config = loadConfig({ NODE_ENV: 'development', LOG_LEVEL: '', CORS_ORIGINS: '', HOST: '', ACCESS_TOKEN_EXPIRY_TIME: '' });

        expect(config).toMatchObject({
            logLevel: 'debug',
            allowedOrigins: ['http://localhost:5200'],
            host: '127.0.0.1',
            auth: { accessTokenExpiryTime: '5m' },
        });
    });

    test('an empty required value is reported as missing', () => {
        expect(expectExit({ DB_URI: '' })).toContain('DB_URI is required');
    });

    test('converts values to their types', () => {
        const config = loadConfig({ PORT: '8080', TRUST_PROXY: '1', EMAIL_SECURE: 'true' });

        expect(config.port).toBe(8080);
        expect(config.trustProxy).toBe(1);
        expect(config.email.secure).toBe(true);
    });

    test('exits when a token secret is shorter than 32 characters', () => {
        expect(expectExit({ ACCESS_TOKEN_SECRET: 'short' })).toContain('ACCESS_TOKEN_SECRET must be at least 32 characters');
    });

    test('exits when both token secrets are the same', () => {
        const secret = 'x'.repeat(40);

        expect(expectExit({ ACCESS_TOKEN_SECRET: secret, REFRESH_TOKEN_SECRET: secret }))
            .toContain('REFRESH_TOKEN_SECRET must be different from ACCESS_TOKEN_SECRET');
    });

    test('CORS_ORIGINS is split into a list, ignoring spaces and empty entries', () => {
        const config = loadConfig({ CORS_ORIGINS: 'https://app.example.com, https://admin.example.com,' });

        expect(config.allowedOrigins).toEqual(['https://app.example.com', 'https://admin.example.com']);
    });

    test.each([
        'https://app.example.com/',
        'https://app.example.com/path',
        'app.example.com',
    ])('exits when CORS_ORIGINS contains an invalid origin (%s)', (origin) => {
        expect(expectExit({ CORS_ORIGINS: origin })).toContain('CORS_ORIGINS');
    });

    test.each([
        ['development', 'debug'],
        ['production', 'info'],
        ['test', 'silent'],
    ])('without LOG_LEVEL, %s logs at %s', (nodeEnv, level) => {
        expect(loadConfig({ NODE_ENV: nodeEnv, LOG_LEVEL: undefined }).logLevel).toBe(level);
    });

    test('LOG_LEVEL overrides the default', () => {
        expect(loadConfig({ NODE_ENV: 'production', LOG_LEVEL: 'warn' }).logLevel).toBe('warn');
    });

    test('exits when LOG_LEVEL is not a valid level', () => {
        expect(expectExit({ LOG_LEVEL: 'loud' })).toContain('LOG_LEVEL');
    });

    test('without CORS_ORIGINS, development allows the local client', () => {
        const config = loadConfig({ NODE_ENV: 'development', CORS_ORIGINS: undefined });

        expect(config.allowedOrigins).toEqual(['http://localhost:5200']);
    });

    test('without CORS_ORIGINS, production allows no other origin', () => {
        const config = loadConfig({ NODE_ENV: 'production', CORS_ORIGINS: undefined });

        expect(config.isProduction).toBe(true);
        expect(config.allowedOrigins).toEqual([]);
    });
});

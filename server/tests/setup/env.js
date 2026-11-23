// Tests never read server/.env: results must not depend on each developer's settings (for example
// EMAIL_ENABLED=true there would change what the email and config tests see). dotenv is replaced with a no-op,
// and the values the config requires are set here.
jest.mock('dotenv', () => ({ config: jest.fn() }));

process.env.NODE_ENV = 'test';
process.env.DB_URI = 'mongodb://127.0.0.1:27017/test'; // replaced by the in-memory database in integration tests
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-at-least-32-characters-long';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-at-least-32-characters-long';
process.env.CORS_ORIGINS = 'http://localhost:5200';
// Silent unless set on the command line (LOG_LEVEL=debug npm test)
process.env.LOG_LEVEL ??= 'silent';

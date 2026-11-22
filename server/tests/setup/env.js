// dotenv does not overwrite variables that are already set, so these win over server/.env
process.env.NODE_ENV = 'test';
process.env.DOTENV_CONFIG_QUIET = 'true'; // hides dotenv's "injected env" line
process.env.DB_URI = 'mongodb://127.0.0.1:27017/test'; // replaced by the in-memory database in integration tests
process.env.ACCESS_TOKEN_SECRET = 'test-access-secret-at-least-32-characters-long';
process.env.REFRESH_TOKEN_SECRET = 'test-refresh-secret-at-least-32-characters-long';
process.env.CORS_ORIGINS = 'http://localhost:5200';
// Silent unless set on the command line (LOG_LEVEL=debug npm test); a LOG_LEVEL in server/.env is ignored
process.env.LOG_LEVEL ??= 'silent';

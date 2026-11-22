module.exports = {
    testEnvironment: 'node',
    // src is listed so coverage also reports files no test loads; tests are only looked for in tests/
    roots: ['<rootDir>/src', '<rootDir>/tests'],
    testMatch: ['<rootDir>/tests/**/*.test.js'],
    // Runs before each test file loads the app, so the config finds its required variables
    setupFiles: ['<rootDir>/tests/setup/env.js'],
    setupFilesAfterEnv: ['<rootDir>/tests/setup/spy-logger.js'],
    // The in-memory MongoDB can take a while to start (it downloads its binary on the first run)
    testTimeout: 30000,
    // Coverage of the app code only, including files no test loads
    collectCoverageFrom: ['src/**/*.js', 'index.js'],
};

// The logger is silent in tests (LOG_LEVEL defaults to silent when NODE_ENV=test). Its methods are spied on
// before every test, so tests can check what was logged: expect(logger.error).toHaveBeenCalledWith(...)
// To see the logs while debugging, run with LOG_LEVEL=debug.
const logger = require('../../src/utils/logger.util');

const LEVELS = ['fatal', 'error', 'warn', 'info', 'debug', 'trace'];

beforeEach(() => {
    // mockClear: spying on an already-spied method returns the same spy, so earlier calls are cleared
    LEVELS.forEach((level) => jest.spyOn(logger, level).mockClear());
});

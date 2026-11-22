const { Writable } = require('stream');
const logger = require('../../src/utils/logger.util');

// A real pino logger that writes into memory instead of stdout; lines() returns what was logged, parsed from JSON
const createCapturingLogger = (level = 'trace') => {
    const chunks = [];
    const destination = new Writable({
        write(chunk, encoding, callback) {
            chunks.push(chunk.toString());
            callback();
        },
    });

    return {
        log: logger.createLogger({ level, destination }),
        lines: () => chunks.join('').split('\n').filter(Boolean).map((line) => JSON.parse(line)),
    };
};

module.exports = { createCapturingLogger };

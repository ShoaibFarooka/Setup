const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');

// mongodb-memory-server keeps each in-memory database in <system temp>/mongo-mem-*. A normal stop() deletes it,
// but a run that is cancelled (Ctrl+C), crashes or is killed never gets there and leaves about 300MB behind.
const PREFIX = 'mongo-mem-';
const ONE_DAY = 24 * 60 * 60 * 1000;

// Deletes those leftovers when they are older than maxAgeMs and nothing is using them; returns how many.
// "In use" check: the folder is renamed first, which fails on Windows while a running MongoDB holds its files,
// so a database in use is never half-deleted. The age limit protects running databases elsewhere.
const removeStaleMongoDirs = ({ dir = os.tmpdir(), maxAgeMs = ONE_DAY, now = Date.now() } = {}) => {
    let removed = 0;

    for (const name of fs.readdirSync(dir)) {
        if (!name.startsWith(PREFIX)) {
            continue;
        }
        const folder = path.join(dir, name);
        try {
            const stats = fs.statSync(folder);
            if (!stats.isDirectory() || now - stats.mtimeMs < maxAgeMs) {
                continue;
            }
            const renamed = `${folder}-deleting`;
            fs.renameSync(folder, renamed);
            fs.rmSync(renamed, { recursive: true, force: true, maxRetries: 3 });
            removed += 1;
        } catch {
            // In use, or removed by another process meanwhile: leave it
        }
    }

    return removed;
};

module.exports = { removeStaleMongoDirs, PREFIX };

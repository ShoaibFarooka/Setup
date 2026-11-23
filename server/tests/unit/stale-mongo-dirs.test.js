const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { removeStaleMongoDirs } = require('../helpers/stale-mongo-dirs');

const DAY = 24 * 60 * 60 * 1000;

describe('removeStaleMongoDirs', () => {
    let dir;

    // A folder of its own instead of the real temp folder, with entries of a chosen age
    const make = (name, ageMs, { file = false } = {}) => {
        const entry = path.join(dir, name);
        if (file) {
            fs.writeFileSync(entry, 'x');
        } else {
            fs.mkdirSync(entry);
            fs.writeFileSync(path.join(entry, 'collection.wt'), 'data');
        }
        const time = new Date(Date.now() - ageMs);
        fs.utimesSync(entry, time, time);
        return entry;
    };

    beforeEach(() => {
        dir = fs.mkdtempSync(path.join(os.tmpdir(), 'stale-mongo-test-'));
    });

    afterEach(() => {
        fs.rmSync(dir, { recursive: true, force: true });
    });

    test('deletes in-memory database folders older than a day', () => {
        const old = make('mongo-mem-old', 2 * DAY);

        expect(removeStaleMongoDirs({ dir })).toBe(1);
        expect(fs.existsSync(old)).toBe(false);
    });

    test('keeps recent ones (a run may be using them)', () => {
        const recent = make('mongo-mem-recent', 60 * 1000);

        expect(removeStaleMongoDirs({ dir })).toBe(0);
        expect(fs.existsSync(recent)).toBe(true);
    });

    test('never touches anything else in the folder', () => {
        const other = make('other-tool-old', 10 * DAY);
        const file = make('mongo-mem-file', 10 * DAY, { file: true });

        expect(removeStaleMongoDirs({ dir })).toBe(0);
        expect(fs.existsSync(other)).toBe(true);
        expect(fs.existsSync(file)).toBe(true);
    });

    test('the age limit can be changed', () => {
        make('mongo-mem-hour', 2 * 60 * 60 * 1000);

        expect(removeStaleMongoDirs({ dir, maxAgeMs: 60 * 60 * 1000 })).toBe(1);
    });

    test('a folder that cannot be moved (in use) is left alone', () => {
        const busy = make('mongo-mem-busy', 2 * DAY);
        const rename = jest.spyOn(fs, 'renameSync').mockImplementation(() => {
            throw new Error('EBUSY: resource busy or locked');
        });

        expect(removeStaleMongoDirs({ dir })).toBe(0);
        expect(fs.existsSync(busy)).toBe(true);
        rename.mockRestore();
    });
});

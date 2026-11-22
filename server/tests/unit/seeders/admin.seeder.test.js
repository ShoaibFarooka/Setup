jest.mock('../../../src/database/connection');
jest.mock('../../../src/repositories/user.repository');
jest.mock('../../../src/services/user.service');

const mongoose = require('mongoose');
const config = require('../../../src/configs/app.config');
const connectDB = require('../../../src/database/connection');
const userRepository = require('../../../src/repositories/user.repository');
const userService = require('../../../src/services/user.service');
const logger = require('../../../src/utils/logger.util');
const seedAdmin = require('../../../src/seeders/admin.seeder');

const admin = { name: 'Admin', username: 'Admin', email: 'Admin@Example.com', password: 'secret' };

describe('admin.seeder', () => {
    beforeEach(() => {
        config.admin = { ...admin };
        jest.spyOn(mongoose, 'disconnect').mockResolvedValue();
    });

    afterEach(() => {
        jest.restoreAllMocks();
        jest.resetAllMocks();
        process.exitCode = undefined;
    });

    test('requiring the file does not seed', () => {
        expect(connectDB).not.toHaveBeenCalled();
    });

    test.each(['username', 'email', 'password'])('missing admin %s -> exits without touching the database', async (field) => {
        config.admin[field] = undefined;
        jest.spyOn(process, 'exit').mockImplementation(() => { throw new Error('process.exit'); });

        await expect(seedAdmin()).rejects.toThrow('process.exit');
        expect(process.exit).toHaveBeenCalledWith(1);
        expect(logger.error).toHaveBeenCalled();
        expect(connectDB).not.toHaveBeenCalled();
    });

    test('creates the admin when no matching user exists', async () => {
        userRepository.userExists.mockResolvedValue(null);

        await seedAdmin();

        expect(connectDB).toHaveBeenCalledWith(config.databaseUri);
        expect(userService.createUser).toHaveBeenCalledWith(admin, 'admin');
        expect(mongoose.disconnect).toHaveBeenCalled();
    });

    test('looks for an existing user by lowercase email or username', async () => {
        userRepository.userExists.mockResolvedValue(null);

        await seedAdmin();

        expect(userRepository.userExists).toHaveBeenCalledWith({
            $or: [{ email: 'admin@example.com' }, { username: 'admin' }],
        });
    });

    test('skips when the admin already exists', async () => {
        userRepository.userExists.mockResolvedValue({ _id: '1' });

        await seedAdmin();

        expect(userService.createUser).not.toHaveBeenCalled();
        expect(logger.info).toHaveBeenCalledWith({ username: 'Admin', email: 'Admin@Example.com' }, expect.stringContaining('already exists'));
        expect(mongoose.disconnect).toHaveBeenCalled();
    });

    test('a failure is logged, sets a failing exit code and still disconnects', async () => {
        userRepository.userExists.mockResolvedValue(null);
        userService.createUser.mockRejectedValue(new Error('boom'));

        await seedAdmin();

        expect(logger.error).toHaveBeenCalledWith({ err: expect.objectContaining({ message: 'boom' }) }, 'Seeding failed');
        expect(process.exitCode).toBe(1);
        expect(mongoose.disconnect).toHaveBeenCalled();
    });
});

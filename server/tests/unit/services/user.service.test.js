jest.mock('../../../src/repositories/user.repository');

const userRepository = require('../../../src/repositories/user.repository');
const userService = require('../../../src/services/user.service');

describe('user.service', () => {
    afterEach(() => jest.resetAllMocks());

    test('createUser rejects a taken email with 409', async () => {
        userRepository.userExists.mockResolvedValueOnce(true);

        await expect(userService.createUser({ name: 'A', username: 'a', email: 'a@b.com', password: 'x' }))
            .rejects.toMatchObject({ statusCode: 409, message: 'A user with that email has already been registered!' });
        expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    test('createUser rejects a taken username with 409', async () => {
        userRepository.userExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

        await expect(userService.createUser({ name: 'A', username: 'a', email: 'a@b.com', password: 'x' }))
            .rejects.toMatchObject({ statusCode: 409, message: 'A user with that username has already been registered!' });
        expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    test('createUser stores a hashed password and lowercase email', async () => {
        userRepository.userExists.mockResolvedValue(false);
        userRepository.createUser.mockImplementation(async (data) => data);

        const user = await userService.createUser({ name: 'A', username: 'Admin', email: 'A@B.com', password: 'secret' });

        expect(user).toMatchObject({ username: 'admin', email: 'a@b.com', role: 'user' });
        expect(user.password).not.toBe('secret');
    });

    test('createUser uses the given role', async () => {
        userRepository.userExists.mockResolvedValue(false);
        userRepository.createUser.mockImplementation(async (data) => data);

        const user = await userService.createUser({ name: 'A', username: 'a', email: 'a@b.com', password: 'x' }, 'admin');

        expect(user.role).toBe('admin');
    });

    test('fetchUser returns the user', async () => {
        userRepository.findUserById.mockResolvedValue({ name: 'A' });

        await expect(userService.fetchUser('1')).resolves.toEqual({ name: 'A' });
    });

    test('fetchUser rejects a missing user with 404', async () => {
        userRepository.findUserById.mockResolvedValue(null);

        await expect(userService.fetchUser('1')).rejects.toMatchObject({ statusCode: 404 });
    });
});

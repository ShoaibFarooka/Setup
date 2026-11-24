jest.mock('../../../src/repositories/user.repository');

const userRepository = require('../../../src/repositories/user.repository');
const userService = require('../../../src/services/user.service');

describe('user.service', () => {
    afterEach(() => jest.resetAllMocks());

    test('createUser rejects a taken email with 409', async () => {
        userRepository.userExists.mockResolvedValueOnce(true);

        await expect(userService.createUser({ name: 'A', username: 'a', email: 'a@b.com', password: 'x' }))
            .rejects.toMatchObject({ statusCode: 409, message: 'users.emailTaken' });
        expect(userRepository.createUser).not.toHaveBeenCalled();
    });

    test('createUser rejects a taken username with 409', async () => {
        userRepository.userExists.mockResolvedValueOnce(false).mockResolvedValueOnce(true);

        await expect(userService.createUser({ name: 'A', username: 'a', email: 'a@b.com', password: 'x' }))
            .rejects.toMatchObject({ statusCode: 409, message: 'users.usernameTaken' });
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

describe('user.service updateProfile', () => {
    afterEach(() => jest.resetAllMocks());

    test('changes the name and returns the updated user', async () => {
        userRepository.updateUserById.mockResolvedValue({ name: 'New Name' });

        const user = await userService.updateProfile('user-1', { name: 'New Name' });

        expect(user).toEqual({ name: 'New Name' });
        expect(userRepository.updateUserById).toHaveBeenCalledWith('user-1', { name: 'New Name' }, expect.objectContaining({ runValidators: true }), { name: 1, username: 1, email: 1, role: 1, _id: 0 });
        expect(userRepository.userExists).not.toHaveBeenCalled();
    });

    test('stores the email in lowercase after checking nobody else has it', async () => {
        userRepository.userExists.mockResolvedValue(false);
        userRepository.updateUserById.mockResolvedValue({ email: 'new@b.com' });

        await userService.updateProfile('user-1', { email: ' New@B.com ' });

        expect(userRepository.updateUserById).toHaveBeenCalledWith('user-1', { email: 'new@b.com' }, expect.any(Object), expect.any(Object));
    });

    test('rejects an email another account has with 409', async () => {
        userRepository.userExists.mockResolvedValue(true);

        await expect(userService.updateProfile('user-1', { email: 'taken@b.com' }))
            .rejects.toMatchObject({ statusCode: 409, message: 'users.emailTaken' });
        expect(userRepository.updateUserById).not.toHaveBeenCalled();
    });

    test('a user that no longer exists -> 404', async () => {
        userRepository.updateUserById.mockResolvedValue(null);

        await expect(userService.updateProfile('gone', { name: 'X' })).rejects.toMatchObject({ statusCode: 404 });
    });
});

describe('user.service listUsers', () => {
    afterEach(() => jest.resetAllMocks());

    test('passes the query on and gives each user a string id instead of _id', async () => {
        const objectId = { toString: () => '6b041fac255aad3f681a41a1' };
        userRepository.listUsers.mockResolvedValue({
            items: [{ _id: objectId, name: 'Ada', username: 'ada', email: 'ada@b.com', role: 'user' }],
            pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
        });

        const result = await userService.listUsers({ page: 1, limit: 20, sort: '-createdAt' });

        expect(userRepository.listUsers).toHaveBeenCalledWith({ page: 1, limit: 20, sort: '-createdAt' });
        expect(result).toEqual({
            items: [{ id: '6b041fac255aad3f681a41a1', name: 'Ada', username: 'ada', email: 'ada@b.com', role: 'user' }],
            pagination: { page: 1, limit: 20, totalItems: 1, totalPages: 1 },
        });
    });
});

const { idParams, paginationQuery } = require('../../../src/validations/common.validation');

describe('paginationQuery', () => {
    const schema = paginationQuery({ sort: ['name', '-name'], defaultSort: '-name' });

    test('defaults: page 1, 20 per page, the endpoint\'s default sort', async () => {
        expect(await schema.validate({})).toEqual({ page: 1, limit: 20, sort: '-name' });
    });

    test('query strings are converted to numbers and the search is trimmed', async () => {
        expect(await schema.validate({ page: '3', limit: '50', search: '  ada ' })).toEqual({ page: 3, limit: 50, sort: '-name', search: 'ada' });
    });

    test.each([
        [{ page: '0' }, 'page must be at least 1'],
        [{ page: '1.5' }, 'page must be a whole number'],
        [{ page: 'abc' }, 'page must be a number'],
        [{ limit: '101' }, 'limit must be at most 100'],
        [{ limit: '0' }, 'limit must be at least 1'],
        [{ sort: 'password' }, 'sort must be one of: name, -name'],
    ])('%o is refused: %s', async (query, message) => {
        await expect(schema.validate(query)).rejects.toThrow(message);
    });
});

describe('idParams', () => {
    test('a MongoDB id is accepted', async () => {
        await expect(idParams.validate({ id: '6b041fac255aad3f681a41a1' })).resolves.toBeTruthy();
    });

    test.each(['123', 'not-an-id', 'aaaaaaaaaaaa'])('%s is refused', async (id) => {
        await expect(idParams.validate({ id })).rejects.toThrow('id is not a valid id');
    });
});

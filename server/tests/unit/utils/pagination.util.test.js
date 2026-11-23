const { searchFilter, toSort } = require('../../../src/utils/pagination.util');

describe('toSort', () => {
    test('ascending and descending, with _id as a tie-breaker for a stable order', () => {
        expect(toSort('name')).toEqual({ name: 1, _id: 1 });
        expect(toSort('-createdAt')).toEqual({ createdAt: -1, _id: -1 });
    });

    test('sorting by _id needs no tie-breaker', () => {
        expect(toSort('-_id')).toEqual({ _id: -1 });
    });
});

describe('searchFilter', () => {
    test('no text: no filter', () => {
        expect(searchFilter('', ['name'])).toEqual({});
        expect(searchFilter(undefined, ['name'])).toEqual({});
    });

    test('a case-insensitive "contains" match on any of the fields', () => {
        const filter = searchFilter('ada', ['name', 'email']);

        expect(filter.$or).toHaveLength(2);
        expect(filter.$or[0].name).toMatchObject({ $regex: 'ada', $options: 'i' });
        expect(filter.$or[1].email).toMatchObject({ $regex: 'ada', $options: 'i' });
    });

    test('special characters are matched literally (no regular expression tricks)', () => {
        const filter = searchFilter('a.b*(c)', ['name']);

        expect(filter.$or[0].name.$regex).toBe('a\\.b\\*\\(c\\)');
    });
});

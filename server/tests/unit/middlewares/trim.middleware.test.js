const trimMiddleware = require('../../../src/middlewares/trim.middleware');

describe('trim.middleware', () => {
    test('trims strings in body, query and params, including nested values and arrays', () => {
        const req = {
            body: { name: '  John ', address: { city: ' Lahore ' }, tags: [' a ', 1] },
            query: { search: ' term ' },
            params: { id: ' 42 ' },
        };
        const next = jest.fn();

        trimMiddleware(req, {}, next);

        expect(req.body).toEqual({ name: 'John', address: { city: 'Lahore' }, tags: ['a', 1] });
        expect(req.query).toEqual({ search: 'term' });
        expect(req.params).toEqual({ id: '42' });
        expect(next).toHaveBeenCalled();
    });
});

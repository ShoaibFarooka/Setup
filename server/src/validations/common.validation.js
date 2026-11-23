const yup = require('yup');
const mongoose = require('mongoose');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Query of every list endpoint (the pagination contract in ../CLAUDE.md): ?page=1&limit=20&sort=-createdAt&search=ada
// sort: the values this endpoint allows ('-' prefix = descending); anything else is refused, so nobody can sort
// by an unindexed or private field. Use with validateQuery(paginationQuery({ sort: [...], defaultSort })).
const paginationQuery = ({ sort = [], defaultSort } = {}) => yup.object({
    page: yup.number().typeError('page must be a number').integer('page must be a whole number')
        .min(1, 'page must be at least 1').default(1),
    limit: yup.number().typeError('limit must be a number').integer('limit must be a whole number')
        .min(1, 'limit must be at least 1').max(MAX_LIMIT, `limit must be at most ${MAX_LIMIT}`).default(DEFAULT_LIMIT),
    sort: yup.string().oneOf(sort, `sort must be one of: ${sort.join(', ')}`).default(defaultSort),
    search: yup.string().trim().max(100, 'search must be at most 100 characters'),
});

// A MongoDB id in the URL (/api/products/:id): a malformed id gets a clear 400 instead of reaching the database.
// Use with validateParams(idParams).
const idParams = yup.object({
    id: yup.string().required('id is required')
        .test('object-id', 'id is not a valid id', (value) => mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value)),
});

module.exports = {
    paginationQuery,
    idParams,
    DEFAULT_LIMIT,
    MAX_LIMIT,
};

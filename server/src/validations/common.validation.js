const yup = require('yup');
const mongoose = require('mongoose');

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

// Query of every list endpoint (the pagination contract in ../CLAUDE.md): ?page=1&limit=20&sort=-createdAt&search=ada
// sort: the values this endpoint allows ('-' prefix = descending); anything else is refused, so nobody can sort
// by an unindexed or private field. Use with validateQuery(paginationQuery({ sort: [...], defaultSort })).
// Messages are keys in src/locales/*.json; Yup's params fill their placeholders ({max}, {values}).
const paginationQuery = ({ sort = [], defaultSort } = {}) => yup.object({
    page: yup.number().typeError('validation.pageNumber').integer('validation.pageInteger')
        .min(1, 'validation.pageMin').default(1),
    limit: yup.number().typeError('validation.limitNumber').integer('validation.limitInteger')
        .min(1, 'validation.limitMin').max(MAX_LIMIT, 'validation.limitMax').default(DEFAULT_LIMIT),
    sort: yup.string().oneOf(sort, 'validation.sortOneOf').default(defaultSort),
    search: yup.string().trim().max(100, 'validation.searchMax'),
});

// A MongoDB id in the URL (/api/products/:id): a malformed id gets a clear 400 instead of reaching the database.
// Use with validateParams(idParams).
const idParams = yup.object({
    id: yup.string().required('validation.idRequired')
        .test('object-id', 'validation.idInvalid', (value) => mongoose.isValidObjectId(value) && /^[a-f\d]{24}$/i.test(value)),
});

module.exports = {
    paginationQuery,
    idParams,
    DEFAULT_LIMIT,
    MAX_LIMIT,
};

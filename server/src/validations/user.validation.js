const yup = require('yup');
const { paginationQuery } = require('./common.validation');

// PATCH /api/users/me: the fields people may change about themselves. Role, username and password are not here,
// so the validation middleware rejects them as unknown fields (nobody can make themselves an admin this way).
// Messages are keys in src/locales/*.json.
const updateProfileSchema = yup.object().shape({
    name: yup.string().trim().min(2, 'validation.nameMin').max(60, 'validation.nameMax'),
    email: yup.string().trim().lowercase().max(254, 'validation.emailTooLong').email('validation.emailInvalid'),
});

// GET /api/users: the pagination contract, sortable by name or creation date (both indexed)
const listUsersQuery = paginationQuery({ sort: ['name', '-name', 'createdAt', '-createdAt'], defaultSort: '-createdAt' });

module.exports = {
    updateProfileSchema,
    listUsersQuery,
};

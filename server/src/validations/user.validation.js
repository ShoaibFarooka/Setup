const yup = require('yup');
const { paginationQuery } = require('./common.validation');

// PATCH /api/users/me: the fields people may change about themselves. Role, username and password are not here,
// so the validation middleware rejects them as unknown fields (nobody can make themselves an admin this way).
const updateProfileSchema = yup.object().shape({
    name: yup.string().trim().min(2, 'Name must be at least 2 characters').max(60, 'Name must be at most 60 characters'),
    email: yup.string().trim().lowercase().max(254, 'Email is too long').email('Enter a valid email address'),
});

// GET /api/users: the pagination contract, sortable by name or creation date (both indexed)
const listUsersQuery = paginationQuery({ sort: ['name', '-name', 'createdAt', '-createdAt'], defaultSort: '-createdAt' });

module.exports = {
    updateProfileSchema,
    listUsersQuery,
};

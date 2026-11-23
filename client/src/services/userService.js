import { api } from '@/lib/axiosInstance';

// ?search= with nothing in it would still be validated by the server; leave empty values out of the URL
const withoutEmpty = (params = {}) => Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

// Server routes /api/users/* (server/src/routes/user.routes.js)
export const userService = {
    // The logged-in user -> { name, username, email, role }
    getMe: () => api.get('/api/users/me').then((data) => data.user),
    // Changes your own name and / or email -> the updated user (same shape as getMe)
    updateMe: (changes) => api.patch('/api/users/me', changes).then((data) => data.user),
    // Admins: one page of users -> { items, pagination: { page, limit, totalItems, totalPages } }
    // params: { page, limit, sort, search } (the pagination contract in ../CLAUDE.md); empty values are left out
    list: (params) => api.get('/api/users', { params: withoutEmpty(params) }),
};

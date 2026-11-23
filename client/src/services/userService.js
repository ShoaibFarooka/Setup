import { api } from '@/lib/axiosInstance';

// Server routes /api/users/* (server/src/routes/user.routes.js)
export const userService = {
    // The logged-in user -> { name, username, email, role }
    getMe: () => api.get('/api/users/me').then((data) => data.user),
    // Changes your own name and / or email -> the updated user (same shape as getMe)
    updateMe: (changes) => api.patch('/api/users/me', changes).then((data) => data.user),
};

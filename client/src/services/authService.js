import { api, refreshSession } from '@/lib/axiosInstance';

// Server routes /api/auth/* (server/src/routes/auth.routes.js). Each function returns the response's `data`
// and throws an ApiError on failure. Components use them through hooks (hooks/useLogin.js, hooks/useLogout.js).
export const authService = {
    // { identifier, password } -> { token, sessionExpiresAt }; the refresh token arrives as an httpOnly cookie
    login: (credentials) => api.post('/api/auth/login', credentials, { skipAuth: true, skipRefresh: true }),

    // Uses the refresh token cookie; starts the session with the new access token
    refresh: () => refreshSession(),

    // Ends this device's session (uses the refresh token cookie)
    logout: () => api.post('/api/auth/logout', null, { skipAuth: true, skipRefresh: true }),

    // Ends the sessions of every device
    logoutAll: () => api.post('/api/auth/logout-all'),
};

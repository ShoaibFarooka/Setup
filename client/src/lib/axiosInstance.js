import axios from 'axios';
import { appConfig } from '@/config/appConfig';
import { session } from './session';
import { toApiError } from './apiError';

// Request options used by the services:
//   skipAuth: send no access token (login, refresh)
//   skipRefresh: a 401 is final, do not try to refresh the session first
const client = axios.create({
    baseURL: appConfig.apiUrl,
    // Sends and receives the refresh token cookie
    withCredentials: true,
});

client.interceptors.request.use((request) => {
    const { accessToken } = session.getState();
    if (accessToken && !request.skipAuth) {
        request.headers.Authorization = `Bearer ${accessToken}`;
        // Remembered so a 401 can tell whether the token has been replaced since (see below)
        request.sentToken = accessToken;
    }
    return request;
});

// Only one refresh at a time: the server replaces the refresh token on every refresh, so a second refresh
// sent with the old cookie would fail and log the user out
let refreshing = null;

// New access token from the refresh token cookie. Ends the session when that fails.
export const refreshSession = () => {
    refreshing ??= client.post('/api/auth/refresh-token', null, { skipAuth: true, skipRefresh: true })
        .then((response) => {
            const { token } = response.data.data;
            session.start(token);
            return token;
        })
        .catch((error) => {
            session.end();
            throw toApiError(error);
        })
        .finally(() => {
            refreshing = null;
        });

    return refreshing;
};

// An expired access token (401) is refreshed once and the request sent again.
// Every failure leaves here as an ApiError.
client.interceptors.response.use(undefined, async (error) => {
    const request = error.config;

    if (error.response?.status === 401 && request && !request.skipRefresh && !request.retried) {
        request.retried = true;
        try {
            // A request sent before another one refreshed the session only needs the new token, not another refresh
            const { accessToken } = session.getState();
            const token = accessToken && accessToken !== request.sentToken ? accessToken : await refreshSession();
            request.headers.Authorization = `Bearer ${token}`;
            return await client(request);
        } catch (retryError) {
            throw toApiError(retryError);
        }
    }

    throw toApiError(error);
});

// Successful responses are { success: true, message, data }; these return `data`
const unwrap = (response) => response.data.data;

export const api = {
    get: (url, options) => client.get(url, options).then(unwrap),
    post: (url, body, options) => client.post(url, body, options).then(unwrap),
    put: (url, body, options) => client.put(url, body, options).then(unwrap),
    patch: (url, body, options) => client.patch(url, body, options).then(unwrap),
    delete: (url, options) => client.delete(url, options).then(unwrap),
};

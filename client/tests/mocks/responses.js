import { HttpResponse } from 'msw';

// The server's address in tests (vite.config.js test.env)
export const API = 'http://api.test';

// The test page runs at the dev client's address (vite.config.js environmentOptions). The browser in the tests
// (jsdom) enforces CORS like a real one, so every answer carries the headers the real server sends for it.
export const CLIENT_ORIGIN = 'http://localhost:5200';

export const corsHeaders = {
    'Access-Control-Allow-Origin': CLIENT_ORIGIN,
    'Access-Control-Allow-Credentials': 'true',
    // Without this the browser hides X-Request-Id from the app
    'Access-Control-Expose-Headers': 'X-Request-Id',
};

// Responses in the server's contract (server/src/utils/response.util.js)
export const success = (data = null, message = 'OK', { status = 200, headers } = {}) =>
    HttpResponse.json({ success: true, message, data }, { status, headers: { ...corsHeaders, ...headers } });

export const failure = (status, message, { errors, data, headers } = {}) =>
    HttpResponse.json(
        { success: false, message, ...(errors && { errors }), ...(data && { data }) },
        { status, headers: { ...corsHeaders, ...headers } },
    );

// The browser's CORS pre-flight before a JSON request or one with an Authorization header
export const preflight = () => new HttpResponse(null, {
    status: 204,
    headers: {
        ...corsHeaders,
        'Access-Control-Allow-Methods': 'GET, POST, PUT, PATCH, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
});

export const testUser = { name: 'Test Admin', username: 'admin', email: 'admin@example.com', role: 'admin' };

export const VALID_CREDENTIALS = { identifier: 'admin', password: 'Admin123!' };

// The token of a working reset link (the server's are 64 hex characters)
export const VALID_RESET_TOKEN = 'a'.repeat(64);

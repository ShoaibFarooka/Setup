// The session lives in memory only: the access token is never stored where a script could read it.
// After a page reload it is restored with the refresh token cookie (httpOnly), see AuthProvider.
// React reads it through AuthContext; the axios instance reads it directly.
//
// status: 'checking' (restoring after a page load), 'authenticated' or 'anonymous'
// endedByUser: the user logged out themselves (the login page then does not offer to return to the last page)
const INITIAL_STATE = { status: 'checking', accessToken: null, endedByUser: false };

let state = INITIAL_STATE;
const listeners = new Set();

const setState = (next) => {
    state = next;
    listeners.forEach((listener) => listener());
};

export const session = {
    getState: () => state,

    subscribe: (listener) => {
        listeners.add(listener);
        return () => listeners.delete(listener);
    },

    start: (accessToken) => setState({ status: 'authenticated', accessToken, endedByUser: false }),

    end: ({ byUser = false } = {}) => setState({ status: 'anonymous', accessToken: null, endedByUser: byUser }),

    // Back to the state of a fresh page load (tests)
    reset: () => setState(INITIAL_STATE),
};

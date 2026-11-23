import { useEffect, useMemo, useSyncExternalStore } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AuthContext } from './authContext';
import { session } from '@/lib/session';
import { refreshSession } from '@/lib/axiosInstance';

// Holds the session (who is logged in), not data: data from the server lives in the TanStack Query cache
const AuthProvider = ({ children }) => {
    const queryClient = useQueryClient();
    const state = useSyncExternalStore(session.subscribe, session.getState);

    // After a page load the access token is gone (it is only in memory): get a new one with the refresh
    // token cookie. No cookie or an expired one simply means nobody is logged in.
    useEffect(() => {
        if (session.getState().status === 'checking') {
            refreshSession().catch(() => {});
        }
    }, []);

    // Cached server data belongs to the user who was logged in; clear it so the next user never sees it
    useEffect(() => {
        if (state.status === 'anonymous') {
            queryClient.clear();
        }
    }, [state.status, queryClient]);

    const value = useMemo(() => ({
        status: state.status,
        isAuthenticated: state.status === 'authenticated',
        endedByUser: state.endedByUser,
        startSession: session.start,
        endSession: session.end,
    }), [state]);

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export default AuthProvider;

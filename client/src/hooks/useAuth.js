import { useContext } from 'react';
import { AuthContext } from '@/contexts/authContext';

// { status, isAuthenticated, endedByUser, startSession(token), endSession({ byUser }) }
// status: 'checking' (restoring after a page load), 'authenticated' or 'anonymous'
const useAuth = () => {
    const auth = useContext(AuthContext);
    if (!auth) {
        throw new Error('useAuth must be used inside <AuthProvider>');
    }
    return auth;
};

export default useAuth;

import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import useMe from '@/hooks/useMe';
import Loader from '@/components/Loader/Loader';
import ConnectionError from '@/components/ConnectionError/ConnectionError';

// Layout route for logged-in users: waits for the session and the user, sends visitors to login, then renders
// the matched page (<Outlet />). It stays mounted while moving between its pages, so the check runs once.
// Roles are checked per page by RequireRole.
const ProtectedRoute = () => {
    const { status, endedByUser, endSession } = useAuth();
    const location = useLocation();
    const me = useMe();

    if (status === 'checking') {
        return <Loader page />;
    }

    if (status === 'anonymous') {
        // After logging in, return to the page they wanted, unless they logged out themselves
        return <Navigate to="/login" replace state={endedByUser ? undefined : { from: location }} />;
    }

    if (me.isPending) {
        return <Loader page />;
    }

    if (me.isError) {
        return <ConnectionError error={me.error} onRetry={() => me.refetch()} onBackToLogin={() => endSession({ byUser: true })} />;
    }

    return <Outlet />;
};

export default ProtectedRoute;

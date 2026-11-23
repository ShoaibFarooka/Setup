import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '@/hooks/useAuth';
import Loader from '@/components/Loader/Loader';

// Layout route for visitors only (login): someone already logged in goes on to the page they wanted,
// or the start page
const GuestRoute = () => {
    const { status } = useAuth();
    const location = useLocation();

    if (status === 'checking') {
        return <Loader page />;
    }

    if (status === 'authenticated') {
        return <Navigate to={location.state?.from?.pathname || '/'} replace />;
    }

    return <Outlet />;
};

export default GuestRoute;

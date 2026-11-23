import { Navigate } from 'react-router-dom';
import useMe from '@/hooks/useMe';
import { getLandingPage } from '@/utils/accessUtils';
import Unauthorized from '@/pages/errors/Unauthorized/Unauthorized';

// '/': sends the user to their role's start page (ProtectedRoute has already loaded the user).
// A role with no pages in constants/menuItems.jsx gets the access-denied page instead of a redirect loop.
const LandingRedirect = () => {
    const { data: user } = useMe();
    const landingPage = getLandingPage(user?.role);

    return landingPage ? <Navigate to={landingPage} replace /> : <Unauthorized />;
};

export default LandingRedirect;

import useMe from '@/hooks/useMe';
import { canAccess } from '@/utils/accessUtils';
import Unauthorized from '@/pages/errors/Unauthorized/Unauthorized';

// A page only for the route's roles; others see "Access denied" inside the layout.
// Rendered under ProtectedRoute, so the user is already loaded.
const RequireRole = ({ roles, children }) => {
    const { data: user } = useMe();

    return canAccess(user?.role, roles) ? children : <Unauthorized />;
};

export default RequireRole;

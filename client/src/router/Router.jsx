import { Route, Routes } from 'react-router-dom';
import ProtectedRoute from './ProtectedRoute';
import GuestRoute from './GuestRoute';
import RequireRole from './RequireRole';
import PageFrame from './PageFrame';
import AppLayout from '@/components/layout/AppLayout/AppLayout';
import routes from './RouteConfig';

// Layout routes: the session check (ProtectedRoute / GuestRoute) and the layout (AppLayout) render once and
// stay mounted while moving between their pages; only the page inside (<Outlet />) changes.
const renderPage = (route) => <PageFrame path={route.path}>{route.element}</PageFrame>;

const pageRoutes = (list, wrap = renderPage) => list.map((route) => (
    <Route key={route.path} path={route.path} element={wrap(route)} />
));

const withRole = (route) => <RequireRole roles={route.roles}>{renderPage(route)}</RequireRole>;

const Router = () => {
    const protectedRoutes = routes.filter((route) => route.protected);

    return (
        <Routes>
            <Route element={<GuestRoute />}>
                {pageRoutes(routes.filter((route) => route.guestOnly))}
            </Route>

            <Route element={<ProtectedRoute />}>
                <Route element={<AppLayout showSidebar />}>
                    {pageRoutes(protectedRoutes.filter((route) => route.showSidebar), withRole)}
                </Route>
                <Route element={<AppLayout />}>
                    {pageRoutes(protectedRoutes.filter((route) => !route.showSidebar), withRole)}
                </Route>
            </Route>

            {pageRoutes(routes.filter((route) => !route.protected && !route.guestOnly))}
        </Routes>
    );
};

export default Router;

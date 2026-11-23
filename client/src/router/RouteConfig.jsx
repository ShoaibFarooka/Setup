import { lazy } from 'react';
import { ALL_ROLES } from '@/constants/appConstants';
import LandingRedirect from './LandingRedirect';

// Each page is downloaded the first time it is opened, not with the app.
// This file only lists routes, so hot reload of it does not matter.
/* eslint-disable react-refresh/only-export-components */
const Login = lazy(() => import('@/pages/auth/Login/Login'));
const NotFound = lazy(() => import('@/pages/errors/NotFound/NotFound'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard/Dashboard'));
const Profile = lazy(() => import('@/pages/profile/Profile/Profile'));

// protected: logged-in users only; roles: the roles that may open it (required, e.g. [ROLES.admin])
// guestOnly: visitors only (logged-in users are sent on)
// showSidebar: page layout with the sidebar
const routes = [
    // dashboard
    { path: '/dashboard', element: <Dashboard />, protected: true, roles: ALL_ROLES, showSidebar: true },

    // profile
    { path: '/profile', element: <Profile />, protected: true, roles: ALL_ROLES, showSidebar: true },

    // auth
    { path: '/login', element: <Login />, guestOnly: true },

    // landing and errors
    { path: '/', element: <LandingRedirect />, protected: true, roles: ALL_ROLES, showSidebar: false },
    { path: '*', element: <NotFound /> },
];

export default routes;

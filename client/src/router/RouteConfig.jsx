import { lazy } from 'react';
import { ALL_ROLES, ROLES } from '@/constants/appConstants';
import LandingRedirect from './LandingRedirect';

// Each page is downloaded the first time it is opened, not with the app.
// This file only lists routes, so hot reload of it does not matter.
/* eslint-disable react-refresh/only-export-components */
const Login = lazy(() => import('@/pages/auth/Login/Login'));
const ForgotPassword = lazy(() => import('@/pages/auth/ForgotPassword/ForgotPassword'));
const ResetPassword = lazy(() => import('@/pages/auth/ResetPassword/ResetPassword'));
const NotFound = lazy(() => import('@/pages/errors/NotFound/NotFound'));
const Dashboard = lazy(() => import('@/pages/dashboard/Dashboard/Dashboard'));
const Profile = lazy(() => import('@/pages/profile/Profile/Profile'));
const Users = lazy(() => import('@/pages/users/Users/Users'));

// protected: logged-in users only; roles: the roles that may open it (required, e.g. [ROLES.admin])
// guestOnly: visitors only (logged-in users are sent on); neither protected nor guestOnly: open to everyone
// showSidebar: page layout with the sidebar
const routes = [
    // dashboard
    { path: '/dashboard', element: <Dashboard />, protected: true, roles: ALL_ROLES, showSidebar: true },

    // profile
    { path: '/profile', element: <Profile />, protected: true, roles: ALL_ROLES, showSidebar: true },

    // users (admins only)
    { path: '/users', element: <Users />, protected: true, roles: [ROLES.admin], showSidebar: true },

    // auth
    { path: '/login', element: <Login />, guestOnly: true },
    { path: '/forgot-password', element: <ForgotPassword />, guestOnly: true },
    // Open to everyone: the emailed link must work even in a browser where someone is logged in
    { path: '/reset-password', element: <ResetPassword /> },

    // landing and errors
    { path: '/', element: <LandingRedirect />, protected: true, roles: ALL_ROLES, showSidebar: false },
    { path: '*', element: <NotFound /> },
];

export default routes;

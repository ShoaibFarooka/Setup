import DashboardIcon from '@/assets/icons/dashboard_icon.svg?react';
import ProfileIcon from '@/assets/icons/profile_icon.svg?react';
import { ROLES } from '@/constants/appConstants';

const commonItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/profile', label: 'Profile', icon: <ProfileIcon /> },
];

// The sidebar of each role (navigation only: access is set per route in router/RouteConfig.jsx).
// The first item is the landing page after login.
export const menuItems = {
    [ROLES.admin]: [...commonItems],
    [ROLES.user]: [...commonItems],
};

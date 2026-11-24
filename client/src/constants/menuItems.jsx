import DashboardIcon from '@/assets/icons/dashboard_icon.svg?react';
import ProfileIcon from '@/assets/icons/profile_icon.svg?react';
import UsersIcon from '@/assets/icons/users_icon.svg?react';
import { ROLES } from '@/constants/appConstants';

const commonItems = [
    { path: '/dashboard', label: 'Dashboard', icon: <DashboardIcon /> },
    { path: '/profile', label: 'Profile', icon: <ProfileIcon /> },
];

// The sidebar of each role (navigation only: access is set per route in router/RouteConfig.jsx).
// The first page is the landing page after login.
// An entry is a page { path, label, icon } or, when a project has many pages, a group that folds them together:
//   { key: 'sales', label: 'Sales', icon: <SalesIcon />, items: [{ path: '/orders', label: 'Orders', icon: <OrdersIcon /> }, ...] }
// A role's list can be only pages (flat, as below), only groups, or both. Groups are one level deep, start folded
// and open by themselves when they hold the current page.
export const menuItems = {
    [ROLES.admin]: [...commonItems, { path: '/users', label: 'Users', icon: <UsersIcon /> }],
    [ROLES.user]: [...commonItems],
};

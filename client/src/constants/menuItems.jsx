import DashboardIcon from '@/assets/icons/dashboard_icon.svg?react';
import ProfileIcon from '@/assets/icons/profile_icon.svg?react';
import UsersIcon from '@/assets/icons/users_icon.svg?react';
import { ROLES } from '@/constants/appConstants';

const commonItems = [
    { path: '/dashboard', labelKey: 'nav.dashboard', icon: <DashboardIcon /> },
    { path: '/profile', labelKey: 'nav.profile', icon: <ProfileIcon /> },
];

// The sidebar of each role (navigation only: access is set per route in router/RouteConfig.jsx).
// labelKey: the text in src/locales/*.json.
// The first item is the landing page after login.
export const menuItems = {
    [ROLES.admin]: [...commonItems, { path: '/users', labelKey: 'nav.users', icon: <UsersIcon /> }],
    [ROLES.user]: [...commonItems],
};

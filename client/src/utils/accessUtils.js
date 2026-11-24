import { menuItems } from '@/constants/menuItems';
import { menuPages } from '@/utils/menuUtils';

// Whether a role may open a page, from the route's `roles` in router/RouteConfig.jsx.
// A protected route without `roles` is open to no one, so a forgotten list never exposes a page.
export const canAccess = (role, roles) => Boolean(role && roles?.includes(role));

// Where a role starts after login: the first page of its menu (inside a group if the menu starts with one),
// or null for a role without pages
export const getLandingPage = (role) => menuPages(menuItems[role])[0]?.path ?? null;

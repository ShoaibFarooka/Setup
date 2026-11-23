import { menuItems } from '@/constants/menuItems';

// Whether a role may open a page, from the route's `roles` in router/RouteConfig.jsx.
// A protected route without `roles` is open to no one, so a forgotten list never exposes a page.
export const canAccess = (role, roles) => Boolean(role && roles?.includes(role));

// Where a role starts after login: the first page of its menu, or null for a role without pages
export const getLandingPage = (role) => menuItems[role]?.[0]?.path ?? null;

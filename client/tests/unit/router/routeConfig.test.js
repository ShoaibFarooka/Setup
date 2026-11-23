import { matchPath } from 'react-router-dom';
import routes from '@/router/RouteConfig';
import { menuItems } from '@/constants/menuItems';
import { ALL_ROLES } from '@/constants/appConstants';
import { canAccess } from '@/utils/accessUtils';

describe('routes', () => {
    test('every protected route lists the roles that may open it', () => {
        routes.filter((route) => route.protected).forEach((route) => {
            expect(route.roles, route.path).toEqual(expect.any(Array));
            route.roles.forEach((role) => expect(ALL_ROLES, `${route.path}: ${role}`).toContain(role));
        });
    });

    // A menu link to a page the role may not open would only lead to "Access denied"
    test.each(Object.keys(menuItems))('every menu item of %s leads to a page the role may open', (role) => {
        menuItems[role].forEach(({ path }) => {
            const route = routes.find((candidate) => candidate.path !== '*' && matchPath(candidate.path, path));

            expect(route, path).toBeDefined();
            expect(canAccess(role, route.roles), path).toBe(true);
        });
    });
});

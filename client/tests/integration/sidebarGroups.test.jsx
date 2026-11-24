import { screen, within } from '@testing-library/react';
import { renderApp, loggedIn } from '../helpers/renderApp';
import sidebarStyles from '@/components/layout/Sidebar/Sidebar.module.css';

// A project that groups its pages (constants/menuItems.jsx allows pages, groups or both): the admin's menu here
// has a page and a group holding the profile and users pages (icons are optional; a hoisted mock cannot use JSX)
vi.mock('@/constants/menuItems', () => ({
    menuItems: {
        admin: [
            { path: '/dashboard', label: 'Dashboard' },
            { key: 'account', label: 'Account', items: [
                { path: '/profile', label: 'Profile' },
                { path: '/users', label: 'Users' },
            ] },
        ],
        user: [{ path: '/dashboard', label: 'Dashboard' }],
    },
}));

const sidebar = () => screen.getByRole('navigation');

describe('sidebar with menu groups', () => {
    beforeEach(() => loggedIn());

    test('a group starts folded when the current page is not in it', async () => {
        renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { level: 1, name: 'Dashboard' });

        const group = within(sidebar()).getByRole('button', { name: 'Account' });
        expect(group).toHaveAttribute('aria-expanded', 'false');
        expect(within(sidebar()).queryByRole('link', { name: 'Profile' })).not.toBeInTheDocument();
        expect(within(sidebar()).getByRole('link', { name: 'Dashboard' })).toHaveAttribute('aria-current', 'page');
    });

    test('the group button unfolds and folds its pages', async () => {
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { level: 1, name: 'Dashboard' });
        const group = within(sidebar()).getByRole('button', { name: 'Account' });

        await user.click(group);
        expect(group).toHaveAttribute('aria-expanded', 'true');
        expect(within(sidebar()).getByRole('link', { name: 'Profile' })).toBeVisible();
        expect(within(sidebar()).getByRole('link', { name: 'Users' })).toBeVisible();

        await user.click(group);
        expect(group).toHaveAttribute('aria-expanded', 'false');
        expect(within(sidebar()).queryByRole('link', { name: 'Users' })).not.toBeInTheDocument();
    });

    test('opening a page of a group shows the group open, with the page marked as current', async () => {
        renderApp({ route: '/profile' });
        await screen.findByRole('heading', { level: 1, name: 'Profile' });

        expect(within(sidebar()).getByRole('button', { name: 'Account' })).toHaveAttribute('aria-expanded', 'true');
        expect(within(sidebar()).getByRole('link', { name: 'Profile' })).toHaveAttribute('aria-current', 'page');
    });

    test('folding the group of the current page keeps the group marked, so the current place stays visible', async () => {
        const { user } = renderApp({ route: '/profile' });
        await screen.findByRole('heading', { level: 1, name: 'Profile' });
        const group = within(sidebar()).getByRole('button', { name: 'Account' });

        await user.click(group);

        expect(group).toHaveAttribute('aria-expanded', 'false');
        expect(group).toHaveClass(sidebarStyles.activeGroup);
    });

    test('with groups in the menu, the landing page is still its first page (group-first menus: accessUtils test)', async () => {
        renderApp({ route: '/' });

        expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    });
});

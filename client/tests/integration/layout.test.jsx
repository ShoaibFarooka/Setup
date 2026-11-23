import { screen, waitFor } from '@testing-library/react';
import { renderApp, loggedIn } from '../helpers/renderApp';
import sidebarStyles from '@/components/layout/Sidebar/Sidebar.module.css';

describe('layout', () => {
    beforeEach(() => loggedIn());

    test('stays mounted while moving between pages (only the page changes)', async () => {
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });
        const sidebar = screen.getByRole('navigation');
        const main = screen.getByRole('main');

        await user.click(screen.getByRole('link', { name: /Profile/ }));
        await screen.findByRole('heading', { name: 'Profile' });

        expect(screen.getByRole('navigation')).toBe(sidebar);
        expect(screen.getByRole('main')).toBe(main);
    });

    test('"Skip to content" is the first link and leads to the page content', async () => {
        renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });

        const skipLink = screen.getAllByRole('link')[0];

        expect(skipLink).toHaveTextContent('Skip to content');
        expect(skipLink).toHaveAttribute('href', '#main-content');
        expect(screen.getByRole('main')).toHaveAttribute('id', 'main-content');
    });

    test('after moving to another page, focus is on its heading (screen readers announce it)', async () => {
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });

        await user.click(screen.getByRole('link', { name: /Profile/ }));

        const heading = await screen.findByRole('heading', { name: 'Profile' });
        await waitFor(() => expect(heading).toHaveFocus());
    });

    test('the first page load leaves focus where the browser put it', async () => {
        renderApp({ route: '/dashboard' });

        const heading = await screen.findByRole('heading', { name: 'Dashboard' });

        expect(heading).not.toHaveFocus();
    });
});

describe('focus after a redirect (logged out)', () => {
    test('a page that focuses its own field keeps it (login\'s email field); the heading does not take it', async () => {
        renderApp({ route: '/' });
        // No session: / redirects to /login
        const heading = await screen.findByRole('heading', { name: 'Log into your Account' });

        await waitFor(() => expect(screen.getByLabelText('Email or Username')).toHaveFocus());
        expect(heading).not.toHaveFocus();
    });
});

describe('sidebar on small screens', () => {
    beforeEach(() => loggedIn());

    test('the top bar shows the brand next to the menu button', async () => {
        renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });

        expect(screen.getByRole('button', { name: 'Open menu' }).parentElement).toHaveTextContent('My App');
    });

    test('opens with the menu button and closes with the close button', async () => {
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });

        await user.click(screen.getByLabelText('Open menu'));
        expect(screen.getByRole('navigation')).toHaveClass(sidebarStyles.open);

        await user.click(screen.getByLabelText('Close menu'));
        expect(screen.getByRole('navigation')).toHaveClass(sidebarStyles.closed);
    });

    test('a click outside closes it', async () => {
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });
        await user.click(screen.getByLabelText('Open menu'));

        await user.click(screen.getByRole('heading', { name: 'Dashboard' }));

        expect(screen.getByRole('navigation')).toHaveClass(sidebarStyles.closed);
    });

    test('choosing a page closes it and opens the page', async () => {
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });
        await user.click(screen.getByLabelText('Open menu'));

        await user.click(screen.getByRole('link', { name: /Profile/ }));

        expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
        expect(screen.getByRole('navigation')).toHaveClass(sidebarStyles.closed);
    });
});

describe('login form', () => {
    test('the eye button shows and hides the password', async () => {
        const { user } = renderApp({ route: '/login' });
        const password = await screen.findByLabelText('Password');
        expect(password).toHaveAttribute('type', 'password');

        await user.click(screen.getByRole('button', { name: 'Show password' }));
        expect(password).toHaveAttribute('type', 'text');

        await user.click(screen.getByRole('button', { name: 'Hide password' }));
        expect(password).toHaveAttribute('type', 'password');
    });
});

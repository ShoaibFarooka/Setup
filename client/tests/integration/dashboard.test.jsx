import { screen, within } from '@testing-library/react';
import { delay, http } from 'msw';
import { renderApp, loggedIn } from '../helpers/renderApp';
import { server } from '../mocks/server';
import { API, failure, success, testUser } from '../mocks/responses';

describe('dashboard (static parts and data sections)', () => {
    beforeEach(() => loggedIn());

    test('a user sees their account and the static card; the admin-only card is not there', async () => {
        server.use(http.get(`${API}/api/users/me`, () => success({ user: { ...testUser, role: 'user' } })));
        renderApp({ route: '/dashboard' });

        expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByText('Getting started')).toBeInTheDocument();
        expect(await screen.findByText(testUser.email)).toBeInTheDocument();
        expect(screen.queryByText('Newest users')).not.toBeInTheDocument();
    });

    test('while the users load, the rest of the page is already there; then the newest users show', async () => {
        server.use(http.get(`${API}/api/users`, async () => {
            await delay(300);
            return success({ items: [{ id: '1', name: 'Grace Hopper', username: 'grace', email: 'g@example.com', role: 'user', createdAt: '2026-01-01T00:00:00.000Z' }], pagination: { page: 1, limit: 5, totalItems: 1, totalPages: 1 } });
        }));
        renderApp({ route: '/dashboard' });

        await screen.findByText('Newest users');
        // Not blocked: the heading, the account and the static card show while the users are still loading
        expect(screen.getByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByText('Getting started')).toBeInTheDocument();
        expect(screen.getByText(testUser.email)).toBeInTheDocument();
        expect(document.querySelector('[aria-busy="true"]')).toBeInTheDocument();

        expect(await screen.findByText('Grace Hopper')).toBeInTheDocument();
        // One user, not "1 users"
        expect(screen.getByText('1 user in total')).toBeInTheDocument();
        expect(document.querySelector('[aria-busy="true"]')).not.toBeInTheDocument();
    });

    test('a failing section shows its own error and retries alone; the others keep working', async () => {
        let calls = 0;
        server.use(http.get(`${API}/api/users`, () => {
            calls += 1;
            return calls === 1
                ? failure(500, 'Something broke')
                : success({ items: [], pagination: { page: 1, limit: 5, totalItems: 0, totalPages: 0 } });
        }));
        const { user } = renderApp({ route: '/dashboard' });

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('The users could not be loaded');
        expect(screen.getByText(testUser.email)).toBeInTheDocument();

        await user.click(within(alert).getByRole('button', { name: 'Try again' }));

        expect(await screen.findByText('No users yet')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });
});

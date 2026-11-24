import { screen, within } from '@testing-library/react';
import { http, HttpResponse } from 'msw';
import { renderApp, loggedIn } from '../helpers/renderApp';
import { server } from '../mocks/server';
import { API, failure, success, testUser } from '../mocks/responses';

describe('protected pages', () => {
    beforeEach(() => loggedIn());

    test('the start page sends the user to their role\'s first page', async () => {
        renderApp({ route: '/' });

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });

    test('the database being down shows a clear message, and Try again loads the page once it is back', async () => {
        server.use(http.get(`${API}/api/users/me`, () => failure(503, 'Database is unavailable, please try again later.')));
        const { user } = renderApp({ route: '/dashboard' });

        expect(await screen.findByText('Cannot reach the database')).toBeInTheDocument();

        server.use(http.get(`${API}/api/users/me`, () => success({ user: testUser })));
        await user.click(screen.getByRole('button', { name: 'Try again' }));

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });

    test('a server that cannot be reached shows a connection message', async () => {
        server.use(http.get(`${API}/api/users/me`, () => HttpResponse.error()));

        renderApp({ route: '/dashboard' });

        expect(await screen.findByText('Cannot connect to the server')).toBeInTheDocument();
    });

    test('Back to login from the connection message opens the login page', async () => {
        server.use(http.get(`${API}/api/users/me`, () => HttpResponse.error()));
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByText('Cannot connect to the server');

        await user.click(screen.getByRole('button', { name: 'Back to login' }));

        expect(await screen.findByText('Log into your Account')).toBeInTheDocument();
    });

    test('a role without access to the page sees the access-denied page', async () => {
        server.use(http.get(`${API}/api/users/me`, () => success({ user: { ...testUser, role: 'guest' } })));

        renderApp({ route: '/dashboard' });

        expect(await screen.findByText('Access denied')).toBeInTheDocument();
    });

    test('a role without any pages gets the access-denied page instead of a redirect loop', async () => {
        server.use(http.get(`${API}/api/users/me`, () => success({ user: { ...testUser, role: 'guest' } })));

        renderApp({ route: '/' });

        expect(await screen.findByText('Access denied')).toBeInTheDocument();
    });

    test('the sidebar shows the menu of the role and the user', async () => {
        renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });

        expect(screen.getByRole('link', { name: /Dashboard/ })).toBeInTheDocument();
        expect(screen.getByRole('link', { name: /Profile/ })).toBeInTheDocument();
        // The role in the sidebar's user card (the dashboard shows it too)
        expect(within(screen.getByRole('navigation')).getByText('Admin')).toBeInTheDocument();
    });
});

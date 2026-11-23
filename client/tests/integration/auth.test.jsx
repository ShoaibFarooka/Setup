import { screen } from '@testing-library/react';
import { http } from 'msw';
import { renderApp, loggedIn } from '../helpers/renderApp';
import { server } from '../mocks/server';
import { API, VALID_CREDENTIALS, failure, success } from '../mocks/responses';

const fillLogin = async (user, { identifier, password }) => {
    if (identifier) {
        await user.type(screen.getByLabelText('Email or Username'), identifier);
    }
    if (password) {
        await user.type(screen.getByLabelText('Password'), password);
    }
    await user.click(screen.getByRole('button', { name: 'Log In' }));
};

describe('login', () => {
    test('a visitor opening a protected page is sent to login', async () => {
        renderApp({ route: '/dashboard' });

        expect(await screen.findByText('Log into your Account')).toBeInTheDocument();
    });

    test('empty fields are reported without asking the server', async () => {
        let loginCalls = 0;
        server.use(http.post(`${API}/api/auth/login`, () => {
            loginCalls += 1;
            return success({});
        }));
        const { user } = renderApp({ route: '/login' });
        await screen.findByText('Log into your Account');

        await fillLogin(user, {});

        expect(screen.getByText('Email or username is required!')).toBeInTheDocument();
        expect(screen.getByText('Password is required!')).toBeInTheDocument();
        expect(loginCalls).toBe(0);
    });

    test('wrong credentials show the server\'s message', async () => {
        const { user } = renderApp({ route: '/login' });
        await screen.findByText('Log into your Account');

        await fillLogin(user, { identifier: 'admin', password: 'wrong' });

        expect(await screen.findByText('Invalid credentials!')).toBeInTheDocument();
    });

    test('a validation failure shows the server\'s message with the field error', async () => {
        server.use(http.post(`${API}/api/auth/login`, () => failure(400, 'Request validation failed', {
            errors: { identifier: 'Email or username is too long' },
        })));
        const { user } = renderApp({ route: '/login' });
        await screen.findByText('Log into your Account');

        await fillLogin(user, VALID_CREDENTIALS);

        expect(await screen.findByText('Request validation failed: Email or username is too long')).toBeInTheDocument();
    });

    test('a successful login opens the start page with the user from the server', async () => {
        const { user } = renderApp({ route: '/login' });
        await screen.findByText('Log into your Account');

        await fillLogin(user, VALID_CREDENTIALS);

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
        expect(screen.getByText('Welcome, Test Admin')).toBeInTheDocument();
    });

    test('after logging in, the user returns to the page they wanted', async () => {
        const { user } = renderApp({ route: '/profile' });
        await screen.findByText('Log into your Account');

        await fillLogin(user, VALID_CREDENTIALS);

        expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });

    test('a logged-in user opening the login page is sent on', async () => {
        loggedIn();

        renderApp({ route: '/login' });

        expect(await screen.findByRole('heading', { name: 'Dashboard' })).toBeInTheDocument();
    });
});

describe('session after a page load', () => {
    test('a valid refresh cookie restores the session without logging in again', async () => {
        loggedIn();

        renderApp({ route: '/profile' });

        expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });
});

describe('logout', () => {
    test('logging out from the sidebar returns to the login page', async () => {
        loggedIn();
        let logoutCalls = 0;
        server.use(http.post(`${API}/api/auth/logout`, () => {
            logoutCalls += 1;
            return success(null, 'Logged out successfully');
        }));
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });

        await user.click(screen.getByRole('button', { name: 'Log out' }));

        expect(await screen.findByText('Log into your Account')).toBeInTheDocument();
        expect(logoutCalls).toBe(1);
    });

    test('the user is logged out on this device even if the server call fails', async () => {
        loggedIn();
        server.use(http.post(`${API}/api/auth/logout`, () => failure(503, 'Database is unavailable, please try again later.')));
        const { user } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });

        await user.click(screen.getByRole('button', { name: 'Log out' }));

        expect(await screen.findByText('Log into your Account')).toBeInTheDocument();
        expect(await screen.findByText('Database is unavailable, please try again later.')).toBeInTheDocument();
    });

    test('cached data of the user is cleared on logout', async () => {
        loggedIn();
        const { user, queryClient } = renderApp({ route: '/dashboard' });
        await screen.findByRole('heading', { name: 'Dashboard' });

        await user.click(screen.getByRole('button', { name: 'Log out' }));
        await screen.findByText('Log into your Account');

        expect(queryClient.getQueryCache().getAll()).toHaveLength(0);
    });
});

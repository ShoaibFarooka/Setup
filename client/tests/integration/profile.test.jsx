import { screen, within } from '@testing-library/react';
import { http } from 'msw';
import { renderApp, loggedIn } from '../helpers/renderApp';
import { server } from '../mocks/server';
import { API, failure, success, testUser } from '../mocks/responses';

describe('profile page', () => {
    beforeEach(() => loggedIn());

    test('shows the user\'s details from the server', async () => {
        renderApp({ route: '/profile' });

        expect(await screen.findByRole('heading', { name: 'Profile' })).toBeInTheDocument();
        expect(screen.getByText(testUser.email)).toBeInTheDocument();
        expect(screen.getByText(testUser.username)).toBeInTheDocument();
    });

    test('Log out of all devices asks first, then ends every session and returns to login', async () => {
        let logoutAllCalls = 0;
        server.use(http.post(`${API}/api/auth/logout-all`, () => {
            logoutAllCalls += 1;
            return success(null, 'Logged out from all devices successfully');
        }));
        const { user } = renderApp({ route: '/profile' });
        await screen.findByRole('heading', { name: 'Profile' });

        await user.click(screen.getByRole('button', { name: 'Log out of all devices' }));
        const dialog = await screen.findByRole('dialog');
        expect(logoutAllCalls).toBe(0);

        await user.click(within(dialog).getByRole('button', { name: 'Log out everywhere' }));

        expect(await screen.findByText('Log into your Account')).toBeInTheDocument();
        expect(logoutAllCalls).toBe(1);
    });

    test('cancelling the dialog keeps the user logged in', async () => {
        const { user } = renderApp({ route: '/profile' });
        await screen.findByRole('heading', { name: 'Profile' });

        await user.click(screen.getByRole('button', { name: 'Log out of all devices' }));
        const dialog = await screen.findByRole('dialog');
        await user.click(within(dialog).getByRole('button', { name: 'Cancel' }));

        expect(screen.getByRole('heading', { name: 'Profile' })).toBeInTheDocument();
    });
});

describe('editing the profile', () => {
    beforeEach(() => loggedIn());

    const openEditor = async (user) => {
        await screen.findByRole('heading', { name: 'Profile' });
        await user.click(screen.getByRole('button', { name: 'Edit' }));
        return screen.findByRole('dialog', { name: 'Edit profile' });
    };

    test('starts with the current details', async () => {
        const { user } = renderApp({ route: '/profile' });

        const dialog = await openEditor(user);

        expect(within(dialog).getByRole('textbox', { name: 'Name' })).toHaveValue(testUser.name);
        expect(within(dialog).getByRole('textbox', { name: 'Email' })).toHaveValue(testUser.email);
    });

    test('saving sends the changes, updates every view of the user and confirms', async () => {
        let sent;
        server.use(http.patch(`${API}/api/users/me`, async ({ request }) => {
            sent = await request.json();
            return success({ user: { ...testUser, ...sent } }, 'Profile updated successfully');
        }));
        const { user } = renderApp({ route: '/profile' });
        const dialog = await openEditor(user);

        const name = within(dialog).getByRole('textbox', { name: 'Name' });
        await user.clear(name);
        await user.type(name, 'Grace Hopper');
        await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

        expect(await screen.findByText('Profile updated')).toBeInTheDocument();
        expect(sent).toEqual({ name: 'Grace Hopper', email: testUser.email });
        // The profile details and the sidebar both show the new name, without another request
        expect(screen.getAllByText('Grace Hopper').length).toBeGreaterThanOrEqual(2);
    });

    test('invalid values are reported in the form without asking the server', async () => {
        let calls = 0;
        server.use(http.patch(`${API}/api/users/me`, () => {
            calls += 1;
            return success({ user: testUser });
        }));
        const { user } = renderApp({ route: '/profile' });
        const dialog = await openEditor(user);

        await user.clear(within(dialog).getByRole('textbox', { name: 'Name' }));
        const email = within(dialog).getByRole('textbox', { name: 'Email' });
        await user.clear(email);
        await user.type(email, 'not-an-email');
        await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

        expect(within(dialog).getByText('Name is required!')).toBeInTheDocument();
        expect(within(dialog).getByText('Enter a valid email address!')).toBeInTheDocument();
        expect(within(dialog).getByRole('textbox', { name: 'Email' })).toBeInvalid();
        expect(calls).toBe(0);
    });

    test('a server refusal (email taken) shows its message and keeps the form open', async () => {
        server.use(http.patch(`${API}/api/users/me`, () => failure(409, 'A user with that email has already been registered!')));
        const { user } = renderApp({ route: '/profile' });
        const dialog = await openEditor(user);

        await user.click(within(dialog).getByRole('button', { name: 'Save changes' }));

        expect(await screen.findByText('A user with that email has already been registered!')).toBeInTheDocument();
        expect(screen.getByRole('dialog', { name: 'Edit profile' })).toBeInTheDocument();
    });
});

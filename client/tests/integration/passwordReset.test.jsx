import { screen } from '@testing-library/react';
import { http } from 'msw';
import { renderApp, loggedIn } from '../helpers/renderApp';
import { server } from '../mocks/server';
import { API, VALID_RESET_TOKEN, failure, success } from '../mocks/responses';

// Records the bodies sent to a route (and still answers like the default handler)
const recordRequests = (path, answer) => {
    const bodies = [];
    server.use(http.post(`${API}${path}`, async ({ request }) => {
        bodies.push(await request.json());
        return answer();
    }));
    return bodies;
};

describe('forgot password', () => {
    test('the login page links to it', async () => {
        const { user } = renderApp({ route: '/login' });
        await screen.findByText('Log into your Account');

        await user.click(screen.getByRole('link', { name: 'Forgot password?' }));

        expect(await screen.findByRole('heading', { level: 1, name: 'Reset your password' })).toBeInTheDocument();
    });

    test('an invalid email is reported without asking the server', async () => {
        const bodies = recordRequests('/api/auth/forgot-password', () => success());
        const { user } = renderApp({ route: '/forgot-password' });
        await screen.findByText('Reset your password');

        await user.click(screen.getByRole('button', { name: 'Send reset link' }));
        expect(screen.getByText('Email is required!')).toBeInTheDocument();

        await user.type(screen.getByLabelText('Email'), 'not-an-email');
        await user.click(screen.getByRole('button', { name: 'Send reset link' }));
        expect(screen.getByText('Enter a valid email address!')).toBeInTheDocument();
        expect(bodies).toEqual([]);
    });

    test('sends the email and shows the same message for every address', async () => {
        const bodies = recordRequests('/api/auth/forgot-password', () => success());
        const { user } = renderApp({ route: '/forgot-password' });
        await screen.findByText('Reset your password');

        await user.type(screen.getByLabelText('Email'), '  ada@example.com ');
        await user.click(screen.getByRole('button', { name: 'Send reset link' }));

        expect(await screen.findByText('Check your email')).toBeInTheDocument();
        expect(screen.getByRole('status')).toHaveTextContent('If an account exists for ada@example.com, we have sent a link');
        expect(screen.queryByRole('button', { name: 'Send reset link' })).not.toBeInTheDocument();
        expect(bodies).toEqual([{ email: 'ada@example.com' }]);
    });

    test('a server failure shows its message, and the form stays', async () => {
        server.use(http.post(`${API}/api/auth/forgot-password`, () => failure(500, 'Email is not configured!')));
        const { user } = renderApp({ route: '/forgot-password' });
        await screen.findByText('Reset your password');

        await user.type(screen.getByLabelText('Email'), 'ada@example.com');
        await user.click(screen.getByRole('button', { name: 'Send reset link' }));

        expect(await screen.findByText('Email is not configured!')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Send reset link' })).toBeInTheDocument();
    });

    test('someone logged in is sent on, like from the login page', async () => {
        loggedIn();
        renderApp({ route: '/forgot-password' });

        expect(await screen.findByRole('heading', { level: 1, name: 'Dashboard' })).toBeInTheDocument();
    });
});

describe('reset password', () => {
    const fill = async (user, password, confirmPassword = password) => {
        await user.type(screen.getByLabelText('New password'), password);
        await user.type(screen.getByLabelText('Repeat new password'), confirmPassword);
        await user.click(screen.getByRole('button', { name: 'Change password' }));
    };

    test('changes the password and goes to the login page', async () => {
        const bodies = recordRequests('/api/auth/reset-password', () => success());
        const { user } = renderApp({ route: `/reset-password?token=${VALID_RESET_TOKEN}` });
        await screen.findByText('Set a new password');

        await fill(user, 'NewPassword1');

        expect(await screen.findByText('Password changed. Log in with the new password.')).toBeInTheDocument();
        expect(await screen.findByText('Log into your Account')).toBeInTheDocument();
        // The confirmation stays in the browser
        expect(bodies).toEqual([{ token: VALID_RESET_TOKEN, password: 'NewPassword1' }]);
    });

    test('the password rules and the confirmation are checked without asking the server', async () => {
        const bodies = recordRequests('/api/auth/reset-password', () => success());
        const { user } = renderApp({ route: `/reset-password?token=${VALID_RESET_TOKEN}` });
        await screen.findByText('Set a new password');

        await fill(user, 'abcdefgh', 'abcdefgh');
        expect(screen.getByText('Password must contain a number!')).toBeInTheDocument();

        await user.clear(screen.getByLabelText('New password'));
        await user.clear(screen.getByLabelText('Repeat new password'));
        await fill(user, 'NewPassword1', 'NewPassword2');
        expect(screen.getByText('The passwords do not match!')).toBeInTheDocument();
        expect(bodies).toEqual([]);
    });

    test('an expired link shows why and offers a new one', async () => {
        const { user } = renderApp({ route: `/reset-password?token=${'b'.repeat(64)}` });
        await screen.findByText('Set a new password');

        await fill(user, 'NewPassword1');

        const alert = await screen.findByRole('alert');
        expect(alert).toHaveTextContent('The password was not changed');
        expect(alert).toHaveTextContent('This reset link is invalid or has expired');
        await user.click(screen.getByRole('link', { name: 'Request a new link' }));
        expect(await screen.findByRole('heading', { level: 1, name: 'Reset your password' })).toBeInTheDocument();
    });

    test('without a token it says the link is incomplete and shows no form', async () => {
        renderApp({ route: '/reset-password' });

        expect(await screen.findByText('This link is incomplete')).toBeInTheDocument();
        expect(screen.queryByLabelText('New password')).not.toBeInTheDocument();
        expect(screen.getByRole('link', { name: 'Request a new link' })).toBeInTheDocument();
    });

    test('works in a browser where someone is logged in, and ends that session', async () => {
        loggedIn();
        const { user } = renderApp({ route: `/reset-password?token=${VALID_RESET_TOKEN}` });
        await screen.findByText('Set a new password');

        await fill(user, 'NewPassword1');

        // Logged out: the login page shows instead of being skipped
        expect(await screen.findByText('Log into your Account')).toBeInTheDocument();
    });
});

describe('reset password form', () => {
    test('the password rules are announced with the new password field', async () => {
        renderApp({ route: `/reset-password?token=${VALID_RESET_TOKEN}` });

        expect(await screen.findByLabelText('New password')).toHaveAccessibleDescription('At least 8 characters, with a letter and a number');
    });
});

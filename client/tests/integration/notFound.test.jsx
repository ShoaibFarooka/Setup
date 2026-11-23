import { screen } from '@testing-library/react';
import { renderApp } from '../helpers/renderApp';

describe('unknown pages', () => {
    test('show the 404 page with a way back', async () => {
        const { user } = renderApp({ route: '/does-not-exist' });

        expect(await screen.findByText('Sorry, the page you visited does not exist.')).toBeInTheDocument();

        await user.click(screen.getByRole('button', { name: 'Back Home' }));

        // A visitor going home is sent to login
        expect(await screen.findByText('Log into your Account')).toBeInTheDocument();
    });
});

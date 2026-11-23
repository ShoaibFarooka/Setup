import { render } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { http } from 'msw';
import App from '@/App';
import AuthProvider from '@/contexts/AuthProvider';
import ThemeProvider from '@/contexts/ThemeProvider';
import { createQueryClient } from '@/lib/queryClient';
import { server } from '../mocks/server';
import { API, success } from '../mocks/responses';

// The app's query client, without retries so failures show at once
export const createTestQueryClient = () => {
    const queryClient = createQueryClient();
    queryClient.setDefaultOptions({
        ...queryClient.getDefaultOptions(),
        queries: { ...queryClient.getDefaultOptions().queries, retry: false },
    });
    return queryClient;
};

// The whole app opened at `route`, with the same providers as main.jsx
export const renderApp = ({ route = '/' } = {}) => {
    const queryClient = createTestQueryClient();
    const user = userEvent.setup();

    render(
        <ThemeProvider>
            <QueryClientProvider client={queryClient}>
                <AuthProvider>
                    <MemoryRouter initialEntries={[route]}>
                        <App />
                    </MemoryRouter>
                </AuthProvider>
            </QueryClientProvider>
        </ThemeProvider>,
    );

    return { user, queryClient };
};

// The browser has a valid refresh token cookie: the page load restores the session
export const loggedIn = () => {
    server.use(http.post(`${API}/api/auth/refresh-token`, () => success({ token: 'access-token-1', sessionExpiresAt: '2030-01-01T00:00:00.000Z' })));
};

import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import QueryBoundary from '@/components/QueryBoundary/QueryBoundary';
import LanguageProvider from '@/contexts/LanguageProvider';

// A TanStack Query result in a given state (only the fields QueryBoundary reads)
const query = (state) => ({ isPending: false, isError: false, data: undefined, error: null, refetch: vi.fn(), ...state });

const renderBoundary = (q, props = {}) => render(
    <LanguageProvider>
        <QueryBoundary query={q} {...props}>
            {(data) => <p>Loaded: {data.name}</p>}
        </QueryBoundary>
    </LanguageProvider>,
);

describe('QueryBoundary', () => {
    test('first load: the skeleton, marked busy for screen readers', () => {
        renderBoundary(query({ isPending: true }), { skeleton: <span>Placeholder shape</span> });

        expect(screen.getByText('Placeholder shape').parentElement).toHaveAttribute('aria-busy', 'true');
        expect(screen.queryByText(/Loaded/)).not.toBeInTheDocument();
    });

    test('without a skeleton: a default one', () => {
        const { container } = renderBoundary(query({ isPending: true }));

        expect(container.querySelector('[aria-busy="true"]')).toBeInTheDocument();
    });

    test('loaded: the content, with the data', () => {
        renderBoundary(query({ data: { name: 'Ada' } }));

        expect(screen.getByText('Loaded: Ada')).toBeInTheDocument();
    });

    test('failed: the error and Try again, which refetches only this query', async () => {
        const q = query({ isError: true, error: { message: 'Server unavailable' } });
        renderBoundary(q, { errorTitle: 'The users could not be loaded' });

        expect(screen.getByRole('alert')).toHaveTextContent('The users could not be loaded');
        expect(screen.getByRole('alert')).toHaveTextContent('Server unavailable');
        await userEvent.click(screen.getByRole('button', { name: 'Try again' }));
        expect(q.refetch).toHaveBeenCalledTimes(1);
    });

    test('a failed refresh keeps showing the data already loaded', () => {
        renderBoundary(query({ isError: true, error: { message: 'x' }, data: { name: 'Ada' } }));

        expect(screen.getByText('Loaded: Ada')).toBeInTheDocument();
        expect(screen.queryByRole('alert')).not.toBeInTheDocument();
    });

    test('loaded but empty: the empty message instead of the content', () => {
        renderBoundary(query({ data: { name: '' } }), { isEmpty: (data) => !data.name, empty: <p>Nothing yet</p> });

        expect(screen.getByText('Nothing yet')).toBeInTheDocument();
        expect(screen.queryByText(/Loaded/)).not.toBeInTheDocument();
    });
});

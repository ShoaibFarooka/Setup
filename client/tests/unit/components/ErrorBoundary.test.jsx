import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';

const Broken = () => {
    throw new Error('render failed');
};

describe('ErrorBoundary', () => {
    // React logs caught render errors; they are expected here
    beforeEach(() => vi.spyOn(console, 'error').mockImplementation(() => {}));

    test('shows its content when nothing fails', () => {
        render(<ErrorBoundary><p>Page content</p></ErrorBoundary>);

        expect(screen.getByText('Page content')).toBeInTheDocument();
    });

    test('a failing page shows a message instead of a blank screen', () => {
        render(<ErrorBoundary><Broken /></ErrorBoundary>);

        expect(screen.getByText('Something went wrong')).toBeInTheDocument();
    });

    test('Reload page reloads the app', async () => {
        const onReload = vi.fn();
        render(<ErrorBoundary onReload={onReload}><Broken /></ErrorBoundary>);

        await userEvent.click(screen.getByRole('button', { name: 'Reload page' }));

        expect(onReload).toHaveBeenCalledTimes(1);
    });

    test('a page that fails to download (e.g. after a new deploy) shows the same message', async () => {
        const { lazy, Suspense } = await import('react');
        const Missing = lazy(() => Promise.reject(new Error('Failed to fetch dynamically imported module')));

        render(<ErrorBoundary><Suspense fallback={null}><Missing /></Suspense></ErrorBoundary>);

        expect(await screen.findByText('Something went wrong')).toBeInTheDocument();
    });
});

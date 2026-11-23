import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { Button, IconButton, Spinner, TextLink } from '@/components/ui';

describe('Button', () => {
    test('is a plain button by default, so it never submits a form by accident', async () => {
        const onClick = vi.fn();
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(<form onSubmit={onSubmit}><Button onClick={onClick}>Save</Button></form>);

        await userEvent.click(screen.getByRole('button', { name: 'Save' }));

        expect(onClick).toHaveBeenCalledTimes(1);
        expect(onSubmit).not.toHaveBeenCalled();
    });

    test('type="submit" submits its form', async () => {
        const onSubmit = vi.fn((event) => event.preventDefault());
        render(<form onSubmit={onSubmit}><Button type="submit">Send</Button></form>);

        await userEvent.click(screen.getByRole('button', { name: 'Send' }));

        expect(onSubmit).toHaveBeenCalledTimes(1);
    });

    test('while loading it is disabled and tells screen readers it is busy', async () => {
        const onClick = vi.fn();
        render(<Button loading onClick={onClick}>Save</Button>);
        const button = screen.getByRole('button', { name: 'Save' });

        await userEvent.click(button);

        expect(button).toBeDisabled();
        expect(button).toHaveAttribute('aria-busy', 'true');
        expect(onClick).not.toHaveBeenCalled();
        // The spinner inside is decorative: the button itself already says it is busy
        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });

    test('shows an icon before the text', () => {
        render(<Button icon={<svg data-testid="icon" />}>Add</Button>);

        expect(screen.getByRole('button', { name: 'Add' })).toContainElement(screen.getByTestId('icon'));
    });
});

describe('IconButton', () => {
    test('is named by its label, for screen readers and tests', async () => {
        const onClick = vi.fn();
        render(<IconButton label="Delete row" icon={<svg />} onClick={onClick} />);

        await userEvent.click(screen.getByRole('button', { name: 'Delete row' }));

        expect(onClick).toHaveBeenCalledTimes(1);
    });
});

describe('Spinner', () => {
    test('announces loading', () => {
        render(<Spinner label="Loading orders" />);

        expect(screen.getByRole('status', { name: 'Loading orders' })).toBeInTheDocument();
    });

    test('a decorative spinner is hidden from screen readers', () => {
        render(<Spinner decorative />);

        expect(screen.queryByRole('status')).not.toBeInTheDocument();
    });
});

describe('TextLink', () => {
    test('with `to` it is a link inside the app', () => {
        render(<MemoryRouter><TextLink to="/forgot-password">Forgot password?</TextLink></MemoryRouter>);

        const link = screen.getByRole('link', { name: 'Forgot password?' });
        expect(link).toHaveAttribute('href', '/forgot-password');
        expect(link).not.toHaveAttribute('target');
    });

    test('with `href` it opens another site in a new tab without access to this one', () => {
        render(<TextLink href="https://example.com">Docs</TextLink>);

        const link = screen.getByRole('link', { name: 'Docs' });
        expect(link).toHaveAttribute('target', '_blank');
        expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });

    test('passes other props to the link', () => {
        render(<TextLink href="https://example.com" aria-describedby="hint">Docs</TextLink>);

        expect(screen.getByRole('link', { name: 'Docs' })).toHaveAttribute('aria-describedby', 'hint');
    });
});

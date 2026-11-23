import { render, screen } from '@testing-library/react';
import { Alert, Avatar, Badge, Card, DescriptionList, Divider, EmptyState, Skeleton } from '@/components/ui';

describe('Card', () => {
    test('shows its content, with an optional title and actions', () => {
        render(<Card title="Orders" actions={<button type="button">New</button>}>3 open orders</Card>);

        expect(screen.getByRole('heading', { name: 'Orders' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'New' })).toBeInTheDocument();
        expect(screen.getByText('3 open orders')).toBeInTheDocument();
    });

    test('without a title there is no header', () => {
        render(<Card padding="lg">Plain</Card>);

        expect(screen.queryByRole('heading')).not.toBeInTheDocument();
    });
});

describe('Alert', () => {
    test('errors and warnings are announced at once', () => {
        render(<Alert tone="danger" title="Payment failed">Try another card.</Alert>);

        expect(screen.getByRole('alert')).toHaveTextContent('Payment failed');
        expect(screen.getByRole('alert')).toHaveTextContent('Try another card.');
    });

    test('information is announced politely, with an optional action', () => {
        render(<Alert tone="success" action={<button type="button">Undo</button>}>Saved</Alert>);

        expect(screen.getByRole('status')).toHaveTextContent('Saved');
        expect(screen.getByRole('button', { name: 'Undo' })).toBeInTheDocument();
    });
});

describe('Avatar', () => {
    test('shows initials when there is no picture', () => {
        render(<Avatar name="Ada Lovelace" label="Ada Lovelace" />);

        expect(screen.getByRole('img', { name: 'Ada Lovelace' })).toHaveTextContent('AL');
    });

    test('one word gives one letter; no name gives none', () => {
        const { rerender } = render(<Avatar name="admin" label="admin" />);
        expect(screen.getByRole('img', { name: 'admin' })).toHaveTextContent('A');

        rerender(<Avatar label="Unknown" />);
        expect(screen.getByRole('img', { name: 'Unknown' })).toHaveTextContent('');
    });

    test('shows the picture when there is one', () => {
        const { container } = render(<Avatar name="Ada" src="/ada.png" />);

        expect(container.querySelector('img')).toHaveAttribute('src', '/ada.png');
    });

    test('is hidden from screen readers without a label (the name is shown next to it)', () => {
        render(<Avatar name="Ada" />);

        expect(screen.queryByRole('img')).not.toBeInTheDocument();
    });
});

describe('EmptyState', () => {
    test('shows a title at the chosen heading level, a description and actions', () => {
        render(<EmptyState title="No orders yet" titleAs="h1" description="Orders appear here." actions={<button type="button">Create</button>} icon={<svg />} />);

        expect(screen.getByRole('heading', { level: 1, name: 'No orders yet' })).toBeInTheDocument();
        expect(screen.getByText('Orders appear here.')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'Create' })).toBeInTheDocument();
    });
});

describe('small pieces', () => {
    test('Badge shows its text', () => {
        render(<Badge tone="success">Active</Badge>);

        expect(screen.getByText('Active')).toBeInTheDocument();
    });

    test('DescriptionList pairs labels with values, with a dash for missing ones', () => {
        render(<DescriptionList items={[{ key: 'name', label: 'Name', value: 'Ada' }, { key: 'phone', label: 'Phone', value: undefined }]} />);

        expect(screen.getAllByRole('term').map((term) => term.textContent)).toEqual(['Name', 'Phone']);
        expect(screen.getByText('Name')).toBeInTheDocument();
        expect(screen.getByText('Ada')).toBeInTheDocument();
        expect(screen.getByText('—')).toBeInTheDocument();
    });

    test('Divider is a separator, horizontal or vertical', () => {
        const { rerender } = render(<Divider />);
        expect(screen.getByRole('separator')).not.toHaveAttribute('aria-orientation');

        rerender(<Divider vertical />);
        expect(screen.getByRole('separator')).toHaveAttribute('aria-orientation', 'vertical');
    });

    test('Skeleton draws hidden placeholders, one per line', () => {
        const { container, rerender } = render(<Skeleton />);
        expect(container.querySelectorAll('[aria-hidden="true"]')).toHaveLength(1);

        rerender(<Skeleton lines={3} />);
        expect(container.firstChild.children).toHaveLength(3);
        expect(container.firstChild).toHaveAttribute('aria-hidden', 'true');
    });
});

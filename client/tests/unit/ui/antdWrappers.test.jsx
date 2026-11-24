import { useState } from 'react';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import AntdButton from 'antd/es/button';
import ThemeProvider from '@/contexts/ThemeProvider';
import { Button, DropdownMenu, Modal, PaginationHandler, PasswordInput, Spinner, Table, Tabs, Tooltip, UiProvider, confirm, toast } from '@/components/ui';

// The wrappers as the app uses them: inside the theme and UiProvider
const renderUi = (ui) => {
    render(<ThemeProvider><UiProvider>{ui}</UiProvider></ThemeProvider>);
    return userEvent.setup();
};

describe('Modal', () => {
    test('opens with a title and content', async () => {
        const Example = () => {
            const [open, setOpen] = useState(false);
            return (
                <>
                    <Button onClick={() => setOpen(true)}>Edit</Button>
                    <Modal open={open} onClose={() => setOpen(false)} title="Edit product">Form here</Modal>
                </>
            );
        };
        const user = renderUi(<Example />);

        await user.click(screen.getByRole('button', { name: 'Edit' }));

        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Edit product');
        expect(dialog).toHaveTextContent('Form here');
    });

    // (Closing animations never finish in jsdom, so the dialog itself stays in the page)
    test('the close button asks to close it', async () => {
        const onClose = vi.fn();
        const user = renderUi(<Modal open onClose={onClose} title="Edit product">Form here</Modal>);

        await user.click(within(await screen.findByRole('dialog')).getByRole('button', { name: 'Close' }));

        expect(onClose).toHaveBeenCalledTimes(1);
    });
});

describe('Table', () => {
    const columns = [{ key: 'name', title: 'Name', dataIndex: 'name' }];

    test('shows a row per item', async () => {
        renderUi(<Table label="Products" columns={columns} data={[{ id: 1, name: 'Chair' }, { id: 2, name: 'Desk' }]} />);

        expect(screen.getByRole('region', { name: 'Products' })).toHaveAttribute('tabindex', '0');

        // Ant Design's table downloads on first use
        expect(await screen.findByRole('columnheader', { name: 'Name' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Chair' })).toBeInTheDocument();
        expect(screen.getByRole('cell', { name: 'Desk' })).toBeInTheDocument();
    });

    test('says so when there are no rows', async () => {
        renderUi(<Table columns={columns} data={[]} emptyText="No products yet" />);

        expect(await screen.findByText('No products yet')).toBeInTheDocument();
    });

    // The table loads on demand from antd/es/table: it must still be inside UiProvider's theme (the same Ant Design
    // copy), not a second, unthemed one
    test('the table that loads on demand gets the same theme as Ant Design parts loaded up front', async () => {
        renderUi(<><AntdButton>Up front</AntdButton><Table label="Products" columns={columns} data={[]} /></>);
        await screen.findByRole('table');

        const themeClass = (element) => [...element.classList].find((name) => name.startsWith('css-var-'));
        const tableWrapper = screen.getByRole('region', { name: 'Products' }).firstElementChild;
        expect(themeClass(tableWrapper)).toBe(themeClass(screen.getByRole('button', { name: 'Up front' })));
        expect(themeClass(tableWrapper)).not.toBe('css-var-root');
    });
});

describe('Tabs', () => {
    test('switches between views', async () => {
        const user = renderUi(<Tabs items={[{ key: 'a', label: 'Details', children: 'Details view' }, { key: 'b', label: 'History', children: 'History view' }]} />);

        await user.click(await screen.findByRole('tab', { name: 'History' }));

        expect(screen.getByRole('tab', { name: 'History' })).toHaveAttribute('aria-selected', 'true');
        expect(await screen.findByText('History view')).toBeVisible();
    });
});

describe('Tooltip', () => {
    test('shows its hint on hover', async () => {
        const user = renderUi(<Tooltip title="Copies the link"><Button>Share</Button></Tooltip>);

        await user.hover(screen.getByRole('button', { name: 'Share' }));

        expect(await screen.findByRole('tooltip')).toHaveTextContent('Copies the link');
    });
});

describe('DropdownMenu', () => {
    test('opens on click and runs the chosen item', async () => {
        const onEdit = vi.fn();
        const onDelete = vi.fn();
        const user = renderUi(
            <DropdownMenu items={[{ key: 'edit', label: 'Edit', onClick: onEdit }, { key: 'delete', label: 'Delete', danger: true, onClick: onDelete }]}>
                <Button>More</Button>
            </DropdownMenu>,
        );

        await user.click(screen.getByRole('button', { name: 'More' }));
        await user.click(await screen.findByRole('menuitem', { name: 'Delete' }));

        expect(onDelete).toHaveBeenCalledTimes(1);
        expect(onEdit).not.toHaveBeenCalled();
    });
});

describe('toast and confirm', () => {
    test('toast shows a short notice', async () => {
        renderUi(<span />);

        toast.success('Saved');
        toast.error('Failed');
        toast.warning('Careful');
        toast.info('Heads up');

        expect(await screen.findByText('Saved')).toBeInTheDocument();
        expect(await screen.findByText('Failed')).toBeInTheDocument();
        expect(await screen.findByText('Careful')).toBeInTheDocument();
        expect(await screen.findByText('Heads up')).toBeInTheDocument();
    });

    test('confirm asks first and runs the action only when confirmed', async () => {
        const onConfirm = vi.fn();
        const user = renderUi(<Button onClick={() => confirm({ title: 'Delete product?', confirmText: 'Delete', danger: true, onConfirm })}>Remove</Button>);

        await user.click(screen.getByRole('button', { name: 'Remove' }));
        const dialog = await screen.findByRole('dialog');
        expect(dialog).toHaveTextContent('Delete product?');

        await user.click(within(dialog).getByRole('button', { name: 'Delete' }));

        expect(onConfirm).toHaveBeenCalledTimes(1);
    });
});

describe('UiProvider texts and direction', () => {
    const arabicTexts = {
        loading: 'جارٍ التحميل',
        confirm: 'تأكيد',
        cancel: 'إلغاء',
        showPassword: 'إظهار كلمة المرور',
        pagination: { next: 'الصفحة التالية', summary: ({ count, total }) => `عرض ${count} من ${total}` },
    };
    const renderWithTexts = (ui) => render(<ThemeProvider><UiProvider direction="rtl" texts={arabicTexts}>{ui}</UiProvider></ThemeProvider>);

    test('the ui components use the texts the app passes; the ones it leaves out stay English', () => {
        renderWithTexts(
            <>
                <Spinner />
                <PasswordInput aria-label="Password" />
                <PaginationHandler count={20} totalCount={28} pageIndex={1} totalPages={2} handlePageChange={() => {}} />
            </>,
        );

        expect(screen.getByRole('status', { name: 'جارٍ التحميل' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'إظهار كلمة المرور' })).toBeInTheDocument();
        expect(screen.getByText('عرض 20 من 28')).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'الصفحة التالية' })).toBeInTheDocument();
        // Not passed: the English default
        expect(screen.getByRole('button', { name: 'Previous page' })).toBeInTheDocument();
    });

    test('confirm() buttons default to the passed texts', async () => {
        renderWithTexts(<Button onClick={() => confirm({ title: 'حذف؟' })}>Open</Button>);

        await userEvent.click(screen.getByRole('button', { name: 'Open' }));

        expect(await screen.findByRole('button', { name: 'تأكيد' })).toBeInTheDocument();
        expect(screen.getByRole('button', { name: 'إلغاء' })).toBeInTheDocument();
    });

    test('Ant Design parts follow the direction', async () => {
        renderWithTexts(<Table label="Users" columns={[{ key: 'name', title: 'Name', dataIndex: 'name' }]} data={[]} />);

        // The table loads on first use
        await waitFor(() => expect(document.querySelector('.ant-table-wrapper-rtl')).toBeInTheDocument());
    });
});

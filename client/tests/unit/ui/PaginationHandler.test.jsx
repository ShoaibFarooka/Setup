import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import PaginationHandler from '@/components/ui/PaginationHandler/PaginationHandler';

const renderPager = (props) => {
    const handlePageChange = vi.fn();
    render(<PaginationHandler count={10} totalCount={95} totalPages={10} handlePageChange={handlePageChange} {...props} />);
    return { handlePageChange, user: userEvent.setup() };
};

// The page numbers shown, in order
const pageNumbers = () => within(screen.getByRole('navigation', { name: 'Pagination' }))
    .getAllByRole('button', { name: /^Page \d+$/ })
    .map((button) => Number(button.textContent));

// The left-out pages between numbers, shown as "..."
const gaps = () => screen.queryAllByText('...');

describe('PaginationHandler', () => {
    test('shows a summary of the page', () => {
        renderPager({ pageIndex: 3 });

        expect(screen.getByText('Showing 10 / 95 (Page 3 of 10)')).toBeInTheDocument();
    });

    test('shows the pages around the current one, with gaps to the first and last', () => {
        renderPager({ pageIndex: 5 });

        expect(pageNumbers()).toEqual([1, 3, 4, 5, 6, 7, 10]);
        expect(gaps()).toHaveLength(2);
    });

    test('near the start it shows the first pages, a gap and the last page', () => {
        renderPager({ pageIndex: 2 });

        expect(pageNumbers()).toEqual([1, 2, 3, 4, 5, 10]);
        expect(gaps()).toHaveLength(1);
    });

    test('near the end it shows the first page, a gap and the last pages', () => {
        renderPager({ pageIndex: 9 });

        expect(pageNumbers()).toEqual([1, 6, 7, 8, 9, 10]);
        expect(gaps()).toHaveLength(1);
    });

    test('a few pages are all shown, without gaps', () => {
        renderPager({ pageIndex: 2, totalPages: 4 });

        expect(pageNumbers()).toEqual([1, 2, 3, 4]);
        expect(gaps()).toHaveLength(0);
    });

    test('no page numbers for a page outside the range', () => {
        renderPager({ pageIndex: 0, totalPages: 0 });

        expect(screen.queryByRole('button', { name: /^Page \d+$/ })).not.toBeInTheDocument();
    });

    test('the current page is marked for screen readers', () => {
        renderPager({ pageIndex: 3 });

        expect(screen.getByRole('button', { name: 'Page 3' })).toHaveAttribute('aria-current', 'page');
        expect(screen.getByRole('button', { name: 'Page 4' })).not.toHaveAttribute('aria-current');
    });

    test('clicking a page number asks for that page', async () => {
        const { handlePageChange, user } = renderPager({ pageIndex: 1 });

        await user.click(screen.getByRole('button', { name: 'Page 3' }));

        expect(handlePageChange).toHaveBeenCalledWith(3);
    });

    test('the arrows ask for the previous and next page', async () => {
        const { handlePageChange, user } = renderPager({ pageIndex: 5 });

        await user.click(screen.getByRole('button', { name: 'Previous page' }));
        await user.click(screen.getByRole('button', { name: 'Next page' }));

        expect(handlePageChange.mock.calls).toEqual([[4], [6]]);
    });

    test('the pages work with the keyboard', async () => {
        const { handlePageChange, user } = renderPager({ pageIndex: 5 });

        screen.getByRole('button', { name: 'Page 6' }).focus();
        await user.keyboard('{Enter}');

        expect(handlePageChange).toHaveBeenCalledWith(6);
    });

    test('"previous" on the first page and "next" on the last are disabled', () => {
        renderPager({ pageIndex: 1, totalPages: 1 });

        expect(screen.getByRole('button', { name: 'Previous page' })).toBeDisabled();
        expect(screen.getByRole('button', { name: 'Next page' })).toBeDisabled();
    });

    test('clicking the current page does nothing', async () => {
        const { handlePageChange, user } = renderPager({ pageIndex: 1, totalPages: 3 });

        await user.click(screen.getByRole('button', { name: 'Page 1' }));

        expect(handlePageChange).not.toHaveBeenCalled();
    });
});

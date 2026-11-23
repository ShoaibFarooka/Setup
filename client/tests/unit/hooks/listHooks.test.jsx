import { act, renderHook } from '@testing-library/react';
import { MemoryRouter, useLocation } from 'react-router-dom';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useListParams from '@/hooks/useListParams';

describe('useDebouncedValue', () => {
    beforeEach(() => vi.useFakeTimers());
    afterEach(() => vi.useRealTimers());

    test('changes only after the value stopped changing for the delay', () => {
        const { result, rerender } = renderHook(({ value }) => useDebouncedValue(value, 300), { initialProps: { value: 'a' } });

        rerender({ value: 'ab' });
        act(() => vi.advanceTimersByTime(200));
        rerender({ value: 'abc' });
        act(() => vi.advanceTimersByTime(200));
        expect(result.current).toBe('a');

        act(() => vi.advanceTimersByTime(100));
        expect(result.current).toBe('abc');
    });
});

describe('useListParams', () => {
    // The hook plus the current address, inside a router starting at `url`
    const renderParams = (url = '/users') => renderHook(() => ({ list: useListParams({ defaultSort: '-createdAt' }), location: useLocation() }), {
        wrapper: ({ children }) => <MemoryRouter initialEntries={[url]}>{children}</MemoryRouter>,
    });

    test('defaults when the address has nothing: page 1, no search, the default sort', () => {
        const { result } = renderParams();

        expect(result.current.list).toMatchObject({ page: 1, search: '', sort: '-createdAt' });
    });

    test('reads the address; a broken page number counts as page 1', () => {
        expect(renderParams('/users?page=3&search=ada&sort=name').result.current.list).toMatchObject({ page: 3, search: 'ada', sort: 'name' });
        expect(renderParams('/users?page=abc').result.current.list.page).toBe(1);
        expect(renderParams('/users?page=-2').result.current.list.page).toBe(1);
    });

    test('changing the page writes it to the address', () => {
        const { result } = renderParams();

        act(() => result.current.list.setPage(2));

        expect(result.current.location.search).toBe('?page=2');
    });

    test('a new search or sort goes back to page 1; defaults are left out of the address', () => {
        const { result } = renderParams('/users?page=3');

        act(() => result.current.list.setSearch('ada'));
        expect(result.current.location.search).toBe('?search=ada');

        act(() => result.current.list.setSort('name'));
        expect(result.current.location.search).toBe('?search=ada&sort=name');

        act(() => result.current.list.setSort('-createdAt'));
        act(() => result.current.list.setSearch(''));
        expect(result.current.location.search).toBe('');
    });
});

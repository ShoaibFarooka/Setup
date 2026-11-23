import { useSearchParams } from 'react-router-dom';

// The page, search and sort of a list page, kept in the URL (?page=2&search=ada&sort=name): reloading, the back
// button and sharing a link all show the same list. Changing the search or the sort goes back to page 1.
// Values that equal the default are left out of the URL, so a fresh list has a clean address.
const useListParams = ({ defaultSort = '' } = {}) => {
    const [searchParams, setSearchParams] = useSearchParams();

    const page = Math.max(1, Number.parseInt(searchParams.get('page'), 10) || 1);
    const search = searchParams.get('search') ?? '';
    const sort = searchParams.get('sort') || defaultSort;

    // replace: no new browser history entry (typing a search would otherwise add one per pause)
    const update = (changes, { replace = false } = {}) => {
        setSearchParams((current) => {
            const next = new URLSearchParams(current);
            Object.entries(changes).forEach(([key, value]) => {
                const isDefault = value === '' || value === null || value === undefined || (key === 'page' && value === 1) || (key === 'sort' && value === defaultSort);
                if (isDefault) {
                    next.delete(key);
                } else {
                    next.set(key, String(value));
                }
            });
            return next;
        }, { replace });
    };

    // Page and sort changes are history steps (the back button returns to the previous page); search is not
    return {
        page,
        search,
        sort,
        setPage: (value) => update({ page: value }),
        setSearch: (value) => update({ search: value, page: 1 }, { replace: true }),
        setSort: (value) => update({ sort: value, page: 1 }),
    };
};

export default useListParams;

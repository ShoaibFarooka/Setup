import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { queryKeys } from './queryKeys';

// Admins: one page of users ({ items, pagination }). params: { page, limit, sort, search }.
// keepPreviousData keeps showing the current page while the next one loads (isPlaceholderData is true then),
// so the table does not flash empty on every page change.
const useUsers = (params) => useQuery({
    queryKey: queryKeys.users.list(params),
    queryFn: () => userService.list(params),
    placeholderData: keepPreviousData,
});

export default useUsers;

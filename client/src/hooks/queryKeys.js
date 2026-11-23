// Every TanStack Query key in one place, so data can be refetched or cleared reliably
// (e.g. queryClient.invalidateQueries({ queryKey: queryKeys.users.all }) refreshes every users query).
// List keys include their parameters: each page / search / sort is cached separately.
export const queryKeys = {
    users: {
        all: ['users'],
        me: ['users', 'me'],
        list: (params) => ['users', 'list', params],
    },
};

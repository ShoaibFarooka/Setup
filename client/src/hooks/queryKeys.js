// Every TanStack Query key in one place, so data can be refetched or cleared reliably
// (e.g. queryClient.invalidateQueries({ queryKey: queryKeys.users.all }))
export const queryKeys = {
    users: {
        all: ['users'],
        me: ['users', 'me'],
    },
};

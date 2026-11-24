import { useMutation, useQueryClient } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { queryKeys } from './queryKeys';
import { toast } from '@/components/ui';
import { t } from '@/lib/i18n';

// updateMe.mutate({ name, email }): saves the logged-in user's own details.
// The server answers with the updated user, so it goes straight into the cache: every component showing the user
// (sidebar, profile, dashboard greeting) updates at once, without another request. When a server answer does not
// contain the new data, invalidate the keys instead: queryClient.invalidateQueries({ queryKey: queryKeys.users.all }).
// A failure (e.g. 409, email taken) shows the server's message automatically (lib/queryClient.js).
const useUpdateMe = () => {
    const queryClient = useQueryClient();

    return useMutation({
        mutationFn: userService.updateMe,
        onSuccess: (user) => {
            queryClient.setQueryData(queryKeys.users.me, user);
            toast.success(t('profile.updated'));
        },
    });
};

export default useUpdateMe;

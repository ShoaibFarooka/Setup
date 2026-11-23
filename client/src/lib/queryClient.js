import { MutationCache, QueryClient } from '@tanstack/react-query';
import { toast } from '@/components/ui';
import { getErrorMessage } from '@/utils/errorUtils';

// Worth trying again: the server could not be reached (0) or failed on its side (5xx).
// Client errors (4xx) would only fail the same way again.
const isRetryable = (error) => error?.status === 0 || error?.status >= 500;

export const createQueryClient = () => new QueryClient({
    defaultOptions: {
        queries: {
            retry: (failureCount, error) => isRetryable(error) && failureCount < 2,
            // Data counts as fresh for 30s: screens opened within that time use the cache without a request
            staleTime: 30 * 1000,
        },
        mutations: {
            retry: false,
        },
    },
    // A failed action (login, save, delete, ...) shows the server's message, unless the mutation sets
    // meta: { silentError: true } to handle the error itself
    mutationCache: new MutationCache({
        onError: (error, _variables, _onMutateResult, mutation) => {
            if (!mutation.meta?.silentError) {
                toast.error(getErrorMessage(error));
            }
        },
    }),
});

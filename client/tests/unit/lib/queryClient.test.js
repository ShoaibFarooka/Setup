import { message } from 'antd';
import { createQueryClient } from '@/lib/queryClient';
import { ApiError } from '@/lib/apiError';

const retryRule = () => createQueryClient().getDefaultOptions().queries.retry;

describe('queryClient', () => {
    afterEach(() => vi.restoreAllMocks());

    test.each([
        [0, true],
        [500, true],
        [503, true],
        [400, false],
        [401, false],
        [404, false],
    ])('a query failing with status %s is retried: %s', (status, retried) => {
        expect(retryRule()(0, new ApiError({ status, message: 'x' }))).toBe(retried);
    });

    test('retryable failures are tried at most twice more', () => {
        const error = new ApiError({ status: 500, message: 'x' });

        expect(retryRule()(1, error)).toBe(true);
        expect(retryRule()(2, error)).toBe(false);
    });

    test('a failed mutation shows the server\'s message', async () => {
        const errorToast = vi.spyOn(message, 'error').mockImplementation(() => {});
        const queryClient = createQueryClient();
        const mutation = queryClient.getMutationCache().build(queryClient, {
            mutationFn: () => Promise.reject(new ApiError({ status: 400, message: 'Failed', errors: { name: 'Required' } })),
        });

        await mutation.execute().catch(() => {});

        expect(errorToast).toHaveBeenCalledWith('Failed: Required');
    });

    test('meta.silentError: the mutation handles its error itself, no message', async () => {
        const errorToast = vi.spyOn(message, 'error').mockImplementation(() => {});
        const queryClient = createQueryClient();
        const mutation = queryClient.getMutationCache().build(queryClient, {
            mutationFn: () => Promise.reject(new ApiError({ status: 400, message: 'Failed' })),
            meta: { silentError: true },
        });

        await mutation.execute().catch(() => {});

        expect(errorToast).not.toHaveBeenCalled();
    });
});

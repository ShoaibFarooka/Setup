import { ApiError, NETWORK_ERROR_MESSAGE, toApiError } from '@/lib/apiError';

describe('toApiError', () => {
    test('a server failure keeps its status, message, field errors, data and request id', () => {
        const error = toApiError({
            response: {
                status: 400,
                data: { success: false, message: 'Request validation failed', errors: { identifier: 'Required' }, data: { id: '1' } },
                headers: { 'x-request-id': 'req-1' },
            },
        });

        expect(error).toBeInstanceOf(ApiError);
        expect(error).toMatchObject({
            status: 400,
            message: 'Request validation failed',
            errors: { identifier: 'Required' },
            data: { id: '1' },
            requestId: 'req-1',
        });
    });

    test('no response (server down, no network) -> status 0 with a readable message', () => {
        expect(toApiError(new Error('Network Error'))).toMatchObject({ status: 0, message: NETWORK_ERROR_MESSAGE });
    });

    test('a response without the contract (e.g. a proxy error page) still gets a message', () => {
        expect(toApiError({ response: { status: 502, data: '<html>Bad Gateway</html>', headers: {} } }))
            .toMatchObject({ status: 502, message: 'Something went wrong!', errors: null, requestId: null });
    });

    test('an ApiError is returned as it is', () => {
        const error = new ApiError({ status: 404, message: 'Not found' });

        expect(toApiError(error)).toBe(error);
    });
});

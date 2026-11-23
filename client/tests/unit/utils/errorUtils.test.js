import { getErrorMessage } from '@/utils/errorUtils';
import { ApiError } from '@/lib/apiError';

describe('getErrorMessage', () => {
    test('the server\'s message', () => {
        expect(getErrorMessage(new ApiError({ status: 401, message: 'Invalid credentials!' }))).toBe('Invalid credentials!');
    });

    test('the message plus the first field error', () => {
        const error = new ApiError({ status: 400, message: 'Request validation failed', errors: { identifier: 'Email or username is required', password: 'Password is required' } });

        expect(getErrorMessage(error)).toBe('Request validation failed: Email or username is required');
    });

    test('non-text field errors (e.g. a list of unknown fields) are skipped', () => {
        const error = new ApiError({ status: 400, message: 'Unknown fields present in request body', errors: { unknownFields: ['extra'] } });

        expect(getErrorMessage(error)).toBe('Unknown fields present in request body');
    });

    test('the fallback when there is no message', () => {
        expect(getErrorMessage(undefined)).toBe('Something went wrong!');
        expect(getErrorMessage({}, 'Login failed!')).toBe('Login failed!');
    });
});

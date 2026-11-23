import { renderHook } from '@testing-library/react';
import useAuth from '@/hooks/useAuth';

describe('useAuth', () => {
    test('outside <AuthProvider> it fails with a clear message', () => {
        // React logs the thrown error; it is expected here
        vi.spyOn(console, 'error').mockImplementation(() => {});

        expect(() => renderHook(() => useAuth())).toThrow('useAuth must be used inside <AuthProvider>');

        vi.restoreAllMocks();
    });
});

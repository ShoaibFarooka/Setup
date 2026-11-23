import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import useAuth from './useAuth';

// resetPassword.mutate({ token, password }): sets a new password with the token from the emailed link.
// The server ends every session of the account, so a session open in this browser ends too.
// silentError: the page shows the failure itself (an expired link needs a way to ask for a new one).
const useResetPassword = () => {
    const { endSession } = useAuth();

    return useMutation({
        mutationFn: authService.resetPassword,
        onSuccess: () => endSession({ byUser: true }),
        meta: { silentError: true },
    });
};

export default useResetPassword;

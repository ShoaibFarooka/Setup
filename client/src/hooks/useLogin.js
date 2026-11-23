import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import useAuth from './useAuth';

// login.mutate({ identifier, password }). On success the session starts; a failure shows the server's message.
const useLogin = () => {
    const { startSession } = useAuth();

    return useMutation({
        mutationFn: authService.login,
        onSuccess: ({ token }) => startSession(token),
    });
};

export default useLogin;

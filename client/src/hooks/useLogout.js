import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';
import useAuth from './useAuth';

// logout.mutate() ends this device's session, logout.mutate({ allDevices: true }) every device's.
// This device is logged out even if the server call fails, so the user is never stuck logged in.
const useLogout = () => {
    const { endSession } = useAuth();

    return useMutation({
        mutationFn: ({ allDevices = false } = {}) => (allDevices ? authService.logoutAll() : authService.logout()),
        onSettled: () => endSession({ byUser: true }),
    });
};

export default useLogout;

import { useQuery } from '@tanstack/react-query';
import { userService } from '@/services/userService';
import { queryKeys } from './queryKeys';
import useAuth from './useAuth';

// The logged-in user ({ name, username, email, role }). Every component calling it shares one cached request.
const useMe = () => {
    const { isAuthenticated } = useAuth();

    return useQuery({
        queryKey: queryKeys.users.me,
        queryFn: userService.getMe,
        enabled: isAuthenticated,
    });
};

export default useMe;

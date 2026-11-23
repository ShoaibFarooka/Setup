import { useMutation } from '@tanstack/react-query';
import { authService } from '@/services/authService';

// forgotPassword.mutate({ email }): asks the server to email a reset link. The page shows the same message
// whether the account exists or not (so does the server). A failure shows the server's message automatically.
const useForgotPassword = () => useMutation({ mutationFn: authService.forgotPassword });

export default useForgotPassword;

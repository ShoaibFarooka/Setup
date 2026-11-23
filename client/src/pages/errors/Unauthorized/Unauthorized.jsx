import { FiLock } from 'react-icons/fi';
import { EmptyState } from '@/components/ui';

const Unauthorized = () => {
    return (
        <EmptyState
            icon={<FiLock />}
            tone="danger"
            title="Access denied"
            titleAs="h1"
            description="You don't have permission to open this page."
        />
    );
};

export default Unauthorized;

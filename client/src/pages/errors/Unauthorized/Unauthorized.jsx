import { FiLock } from 'react-icons/fi';
import { EmptyState } from '@/components/ui';
import useLanguage from '@/hooks/useLanguage';

const Unauthorized = () => {
    const { t } = useLanguage();

    return (
        <EmptyState
            icon={<FiLock />}
            tone="danger"
            title={t('errors.accessDeniedTitle')}
            titleAs="h1"
            description={t('errors.accessDeniedText')}
        />
    );
};

export default Unauthorized;

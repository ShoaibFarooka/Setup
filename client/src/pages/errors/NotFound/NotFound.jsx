import { useNavigate } from 'react-router-dom';
import { FiCompass } from 'react-icons/fi';
import styles from './NotFound.module.css';
import { Button, EmptyState } from '@/components/ui';
import useLanguage from '@/hooks/useLanguage';

const NotFound = () => {
    const navigate = useNavigate();
    const { t } = useLanguage();

    return (
        <div className={styles.page}>
            <EmptyState
                icon={<FiCompass />}
                title={t('errors.notFoundTitle')}
                titleAs="h1"
                description={t('errors.notFoundText')}
                actions={<Button onClick={() => navigate('/')}>{t('errors.backHome')}</Button>}
            />
        </div>
    );
};

export default NotFound;

import { FiAlertTriangle } from 'react-icons/fi';
import styles from './ConnectionError.module.css';
import { Button, Card, EmptyState } from '@/components/ui';
import useLanguage from '@/hooks/useLanguage';

// Full-page message when the account could not be loaded. `error` is an ApiError:
// 503 means the server is running but its database is not reachable; anything else, the server itself.
const ConnectionError = ({ error, onRetry, onBackToLogin }) => {
    const databaseDown = error?.status === 503;
    const { t } = useLanguage();

    return (
        <div className={styles.page} role="alert">
            <Card>
                <EmptyState
                    icon={<FiAlertTriangle />}
                    tone="warning"
                    title={t(databaseDown ? 'connection.databaseTitle' : 'connection.serverTitle')}
                    description={t(databaseDown ? 'connection.databaseText' : 'connection.serverText')}
                    actions={(
                        <>
                            <Button onClick={onRetry}>{t('connection.tryAgain')}</Button>
                            <Button variant="secondary" onClick={onBackToLogin}>{t('connection.backToLogin')}</Button>
                        </>
                    )}
                />
            </Card>
        </div>
    );
};

export default ConnectionError;

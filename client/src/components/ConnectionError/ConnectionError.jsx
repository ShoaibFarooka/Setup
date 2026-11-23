import { FiAlertTriangle } from 'react-icons/fi';
import styles from './ConnectionError.module.css';
import { Button, Card, EmptyState } from '@/components/ui';

// Full-page message when the account could not be loaded. `error` is an ApiError:
// 503 means the server is running but its database is not reachable; anything else, the server itself.
const ConnectionError = ({ error, onRetry, onBackToLogin }) => {
    const databaseDown = error?.status === 503;

    return (
        <div className={styles.page} role="alert">
            <Card>
                <EmptyState
                    icon={<FiAlertTriangle />}
                    tone="warning"
                    title={databaseDown ? 'Cannot reach the database' : 'Cannot connect to the server'}
                    description={databaseDown
                        ? 'The server is running but cannot reach its database. Please try again in a moment.'
                        : 'Your account could not be loaded. Make sure the server is running, then try again.'}
                    actions={(
                        <>
                            <Button onClick={onRetry}>Try again</Button>
                            <Button variant="secondary" onClick={onBackToLogin}>Back to login</Button>
                        </>
                    )}
                />
            </Card>
        </div>
    );
};

export default ConnectionError;

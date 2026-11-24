import styles from './NewestUsers.module.css';
import useUsers from '@/hooks/useUsers';
import useLanguage from '@/hooks/useLanguage';
import QueryBoundary from '@/components/QueryBoundary/QueryBoundary';
import { Avatar, Card, EmptyState, Skeleton } from '@/components/ui';

const NEWEST = { page: 1, limit: 5, sort: '-createdAt' };

// Admins: how many users there are and the five newest, loaded on their own (the rest of the dashboard does not wait)
const NewestUsers = () => {
    const users = useUsers(NEWEST);
    const { t, formatDate } = useLanguage();

    return (
        <Card title={t('dashboard.newestUsers')}>
            <QueryBoundary
                query={users}
                skeleton={<Skeleton height="1.5rem" lines={5} />}
                errorTitle={t('dashboard.usersFailed')}
                isEmpty={(data) => data.items.length === 0}
                empty={<EmptyState title={t('dashboard.noUsers')} titleAs="p" />}
            >
                {({ items, pagination }) => (
                    <>
                        <p className={styles.total}>{t('dashboard.usersTotal', { count: pagination.totalItems })}</p>
                        <ul className={styles.list}>
                            {items.map((user) => (
                                <li key={user.id} className={styles.row}>
                                    <Avatar name={user.name} size="sm" />
                                    <span className={styles.name}>{user.name}</span>
                                    <span className={styles.date}>{formatDate(user.createdAt)}</span>
                                </li>
                            ))}
                        </ul>
                    </>
                )}
            </QueryBoundary>
        </Card>
    );
};

export default NewestUsers;

import styles from './NewestUsers.module.css';
import useUsers from '@/hooks/useUsers';
import QueryBoundary from '@/components/QueryBoundary/QueryBoundary';
import { Avatar, Card, EmptyState, Skeleton } from '@/components/ui';

const NEWEST = { page: 1, limit: 5, sort: '-createdAt' };

const usersInTotal = (count) => `${count} ${count === 1 ? 'user' : 'users'} in total`;

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));

// Admins: how many users there are and the five newest, loaded on their own (the rest of the dashboard does not wait)
const NewestUsers = () => {
    const users = useUsers(NEWEST);

    return (
        <Card title="Newest users">
            <QueryBoundary
                query={users}
                skeleton={<Skeleton height="1.5rem" lines={5} />}
                errorTitle="The users could not be loaded"
                isEmpty={(data) => data.items.length === 0}
                empty={<EmptyState title="No users yet" titleAs="p" />}
            >
                {({ items, pagination }) => (
                    <>
                        <p className={styles.total}>{usersInTotal(pagination.totalItems)}</p>
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

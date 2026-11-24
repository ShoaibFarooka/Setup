import styles from './Dashboard.module.css';
import useMe from '@/hooks/useMe';
import { ROLE_LABELS, ROLES } from '@/constants/appConstants';
import PageHeader from '@/components/layout/PageHeader/PageHeader';
import QueryBoundary from '@/components/QueryBoundary/QueryBoundary';
import { Card, DescriptionList, Skeleton } from '@/components/ui';
import NewestUsers from './components/NewestUsers/NewestUsers';

// Placeholder home page after login: replace it with the app's own dashboard. It also shows how a page mixes
// static parts and data (README "Loading data"): the heading and the "Getting started" card render at once, and
// each card that needs data loads, fails and retries on its own (QueryBoundary), never blocking the rest.
const Dashboard = () => {
    const me = useMe();
    const isAdmin = me.data?.role === ROLES.admin;

    return (
        <>
            <PageHeader title="Dashboard" subtitle={`Welcome, ${me.data?.name}`} />
            <div className={styles.grid}>
                <Card title="Your account">
                    <QueryBoundary query={me} skeleton={<Skeleton height="1.25rem" lines={3} />} errorTitle="Your account could not be loaded">
                        {(user) => (
                            <DescriptionList items={[
                                { key: 'username', label: 'Username', value: user.username },
                                { key: 'email', label: 'Email', value: user.email },
                                { key: 'role', label: 'Role', value: ROLE_LABELS[user.role] || user.role },
                            ]}
                            />
                        )}
                    </QueryBoundary>
                </Card>
                {isAdmin && <NewestUsers />}
                <Card title="Getting started">
                    This is a placeholder page. Build your app&apos;s home page here.
                </Card>
            </div>
        </>
    );
};

export default Dashboard;

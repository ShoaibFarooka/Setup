import styles from './Dashboard.module.css';
import useMe from '@/hooks/useMe';
import useLanguage from '@/hooks/useLanguage';
import { ROLES } from '@/constants/appConstants';
import PageHeader from '@/components/layout/PageHeader/PageHeader';
import QueryBoundary from '@/components/QueryBoundary/QueryBoundary';
import { Card, DescriptionList, Skeleton } from '@/components/ui';
import NewestUsers from './components/NewestUsers/NewestUsers';

// Placeholder home page after login: replace it with the app's own dashboard. It also shows how a page mixes
// static parts and data (README "Loading data"): the heading and the "Getting started" card render at once, and
// each card that needs data loads, fails and retries on its own (QueryBoundary), never blocking the rest.
const Dashboard = () => {
    const me = useMe();
    const { t } = useLanguage();
    const isAdmin = me.data?.role === ROLES.admin;

    return (
        <>
            <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.welcome', { name: me.data?.name })} />
            <div className={styles.grid}>
                <Card title={t('dashboard.account')}>
                    <QueryBoundary query={me} skeleton={<Skeleton height="1.25rem" lines={3} />} errorTitle={t('dashboard.accountFailed')}>
                        {(user) => (
                            <DescriptionList items={[
                                { key: 'username', label: t('profile.username'), value: user.username },
                                { key: 'email', label: t('profile.email'), value: user.email },
                                { key: 'role', label: t('profile.role'), value: t(`roles.${user.role}`) },
                            ]}
                            />
                        )}
                    </QueryBoundary>
                </Card>
                {isAdmin && <NewestUsers />}
                <Card title={t('dashboard.gettingStarted')}>
                    {t('dashboard.placeholder')}
                </Card>
            </div>
        </>
    );
};

export default Dashboard;

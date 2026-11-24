import useMe from '@/hooks/useMe';
import PageHeader from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui';
import useLanguage from '@/hooks/useLanguage';

// Placeholder home page after login: replace it with the app's own dashboard
const Dashboard = () => {
    const { data: user } = useMe();
    const { t } = useLanguage();

    return (
        <>
            <PageHeader title={t('dashboard.title')} subtitle={t('dashboard.welcome', { name: user?.name })} />
            <Card>
                {t('dashboard.placeholder')}
            </Card>
        </>
    );
};

export default Dashboard;

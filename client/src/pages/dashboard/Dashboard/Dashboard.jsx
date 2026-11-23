import useMe from '@/hooks/useMe';
import PageHeader from '@/components/layout/PageHeader/PageHeader';
import { Card } from '@/components/ui';

// Placeholder home page after login: replace it with the app's own dashboard
const Dashboard = () => {
    const { data: user } = useMe();

    return (
        <>
            <PageHeader title="Dashboard" subtitle={`Welcome, ${user?.name}`} />
            <Card>
                This is a placeholder page. Build your app&apos;s home page here.
            </Card>
        </>
    );
};

export default Dashboard;

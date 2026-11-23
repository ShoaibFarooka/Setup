import { useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import styles from './Profile.module.css';
import { ROLE_LABELS } from '@/constants/appConstants';
import useMe from '@/hooks/useMe';
import useLogout from '@/hooks/useLogout';
import PageHeader from '@/components/layout/PageHeader/PageHeader';
import { Avatar, Button, Card, DescriptionList, Modal, confirm } from '@/components/ui';
import EditProfileForm from './components/EditProfileForm/EditProfileForm';

// Example page: reads server data through a query hook (useMe), changes it through a form and a mutation hook
// (EditProfileForm, useUpdateMe), and runs an action after asking first (useLogout with confirm)
const Profile = () => {
    const { data: user } = useMe();
    const logout = useLogout();
    const [editing, setEditing] = useState(false);

    const items = [
        { key: 'name', label: 'Name', value: user?.name },
        { key: 'username', label: 'Username', value: user?.username },
        { key: 'email', label: 'Email', value: user?.email },
        { key: 'role', label: 'Role', value: ROLE_LABELS[user?.role] || user?.role },
    ];

    const confirmLogoutAll = () => {
        confirm({
            title: 'Log out of all devices?',
            content: 'You will be logged out everywhere, including this device. Other devices are logged out within a few minutes.',
            confirmText: 'Log out everywhere',
            danger: true,
            // Returning the promise keeps the button loading until the server answers
            onConfirm: () => logout.mutateAsync({ allDevices: true }).catch(() => {}),
        });
    };

    return (
        <div className={styles.page}>
            <PageHeader title="Profile" subtitle="Your account details" />
            <Card
                title="Account"
                actions={(
                    <div className={styles.accountActions}>
                        <Avatar name={user?.name} />
                        <Button variant="secondary" size="sm" icon={<FiEdit2 aria-hidden="true" />} onClick={() => setEditing(true)}>
                            Edit
                        </Button>
                    </div>
                )}
            >
                <DescriptionList items={items} />
            </Card>
            <Modal open={editing} onClose={() => setEditing(false)} title="Edit profile">
                <EditProfileForm user={user} onDone={() => setEditing(false)} />
            </Modal>
            <Card className={styles.security}>
                <div>
                    <h2 className={styles.securityTitle}>Sessions</h2>
                    <p className={styles.securityText}>Logged in somewhere you no longer use, or lost a device? End every session.</p>
                </div>
                <Button variant="dangerOutline" onClick={confirmLogoutAll}>Log out of all devices</Button>
            </Card>
        </div>
    );
};

export default Profile;

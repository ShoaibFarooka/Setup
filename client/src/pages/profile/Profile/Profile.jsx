import { useState } from 'react';
import { FiEdit2 } from 'react-icons/fi';
import styles from './Profile.module.css';
import useMe from '@/hooks/useMe';
import useLogout from '@/hooks/useLogout';
import useLanguage from '@/hooks/useLanguage';
import PageHeader from '@/components/layout/PageHeader/PageHeader';
import { Avatar, Button, Card, DescriptionList, Modal, confirm } from '@/components/ui';
import EditProfileForm from './components/EditProfileForm/EditProfileForm';

// Example page: reads server data through a query hook (useMe), changes it through a form and a mutation hook
// (EditProfileForm, useUpdateMe), and runs an action after asking first (useLogout with confirm)
const Profile = () => {
    const { data: user } = useMe();
    const logout = useLogout();
    const [editing, setEditing] = useState(false);
    const { t } = useLanguage();

    const items = [
        { key: 'name', label: t('profile.name'), value: user?.name },
        { key: 'username', label: t('profile.username'), value: user?.username },
        { key: 'email', label: t('profile.email'), value: user?.email },
        { key: 'role', label: t('profile.role'), value: user?.role && t(`roles.${user.role}`) },
    ];

    const confirmLogoutAll = () => {
        confirm({
            title: t('profile.logoutAllTitle'),
            content: t('profile.logoutAllText'),
            confirmText: t('profile.logoutAllConfirm'),
            danger: true,
            // Returning the promise keeps the button loading until the server answers
            onConfirm: () => logout.mutateAsync({ allDevices: true }).catch(() => {}),
        });
    };

    return (
        <div className={styles.page}>
            <PageHeader title={t('profile.title')} subtitle={t('profile.subtitle')} />
            <Card
                title={t('profile.account')}
                actions={(
                    <div className={styles.accountActions}>
                        <Avatar name={user?.name} />
                        <Button variant="secondary" size="sm" icon={<FiEdit2 aria-hidden="true" />} onClick={() => setEditing(true)}>
                            {t('profile.edit')}
                        </Button>
                    </div>
                )}
            >
                <DescriptionList items={items} />
            </Card>
            <Modal open={editing} onClose={() => setEditing(false)} title={t('profile.editTitle')}>
                <EditProfileForm user={user} onDone={() => setEditing(false)} />
            </Modal>
            <Card className={styles.security}>
                <div>
                    <h2 className={styles.securityTitle}>{t('profile.sessionsTitle')}</h2>
                    <p className={styles.securityText}>{t('profile.sessionsText')}</p>
                </div>
                <Button variant="dangerOutline" onClick={confirmLogoutAll}>{t('profile.logoutAll')}</Button>
            </Card>
        </div>
    );
};

export default Profile;

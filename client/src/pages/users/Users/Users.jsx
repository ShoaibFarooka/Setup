import { useEffect, useState } from 'react';
import styles from './Users.module.css';
import { ROLES } from '@/constants/appConstants';
import useUsers from '@/hooks/useUsers';
import useListParams from '@/hooks/useListParams';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import useLanguage from '@/hooks/useLanguage';
import PageHeader from '@/components/layout/PageHeader/PageHeader';
import { Alert, Avatar, Badge, Button, Card, Input, PaginationHandler, Select, Skeleton, Table } from '@/components/ui';

const PAGE_SIZE = 20;

// label: a key in src/locales/*.json
const SORT_OPTIONS = [
    { value: '-createdAt', label: 'users.sortNewest' },
    { value: 'createdAt', label: 'users.sortOldest' },
    { value: 'name', label: 'users.sortNameAsc' },
    { value: '-name', label: 'users.sortNameDesc' },
];

// The columns in the current language (titles, role names, dates)
const getColumns = ({ t, formatDate }) => [
    {
        key: 'name',
        title: t('users.name'),
        dataIndex: 'name',
        render: (name) => (
            <span className={styles.nameCell}>
                <Avatar name={name} size="sm" />
                {name}
            </span>
        ),
    },
    { key: 'username', title: t('users.username'), dataIndex: 'username' },
    { key: 'email', title: t('users.email'), dataIndex: 'email' },
    {
        key: 'role',
        title: t('users.role'),
        dataIndex: 'role',
        render: (role) => <Badge tone={role === ROLES.admin ? 'primary' : 'neutral'}>{t(`roles.${role}`)}</Badge>,
    },
    { key: 'createdAt', title: t('users.joined'), dataIndex: 'createdAt', render: (value) => formatDate(value) },
];

// Example list page (admins): the pagination contract end to end. Page, search and sort live in the URL
// (useListParams), the search waits until typing stops (useDebouncedValue), every combination is cached
// separately (useUsers), and the current page stays visible while the next one loads.
const Users = () => {
    const { page, search, sort, setPage, setSearch, setSort } = useListParams({ defaultSort: '-createdAt' });
    const { t, formatDate } = useLanguage();
    const [searchText, setSearchText] = useState(search);
    const debouncedSearch = useDebouncedValue(searchText.trim());

    useEffect(() => {
        if (debouncedSearch !== search) {
            setSearch(debouncedSearch);
        }
    }, [debouncedSearch, search, setSearch]);

    const users = useUsers({ page, limit: PAGE_SIZE, sort, search });
    const { items = [], pagination } = users.data ?? {};

    return (
        <div className={styles.page}>
            <PageHeader title={t('users.title')} subtitle={t('users.subtitle')} />

            <div className={styles.toolbar}>
                <Input
                    type="search"
                    aria-label={t('users.search')}
                    placeholder={t('users.searchPlaceholder')}
                    className={styles.search}
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                />
                <Select aria-label={t('users.sort')} className={styles.sort} options={SORT_OPTIONS.map((option) => ({ ...option, label: t(option.label) }))} value={sort} onChange={(event) => setSort(event.target.value)} />
            </div>

            {users.isError && (
                <Alert tone="danger" title={t('users.loadFailed')} action={<Button size="sm" variant="secondary" onClick={() => users.refetch()}>{t('users.tryAgain')}</Button>}>
                    {users.error.message}
                </Alert>
            )}

            <Card padding="none">
                {users.isPending ? (
                    <div className={styles.loading} aria-busy="true">
                        <Skeleton height="1.25rem" lines={6} />
                    </div>
                ) : (
                    <>
                        <Table
                            label={t('users.table')}
                            columns={getColumns({ t, formatDate })}
                            data={items}
                            loading={users.isPlaceholderData}
                            emptyText={search ? t('users.noMatch', { search }) : t('users.empty')}
                        />
                        {pagination?.totalItems > 0 && (
                            <div className={styles.footer}>
                                <PaginationHandler
                                    count={items.length}
                                    totalCount={pagination.totalItems}
                                    pageIndex={pagination.page}
                                    totalPages={pagination.totalPages}
                                    handlePageChange={setPage}
                                />
                            </div>
                        )}
                    </>
                )}
            </Card>
        </div>
    );
};

export default Users;

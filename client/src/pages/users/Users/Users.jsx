import { useEffect, useState } from 'react';
import styles from './Users.module.css';
import { ROLE_LABELS, ROLES } from '@/constants/appConstants';
import useUsers from '@/hooks/useUsers';
import useListParams from '@/hooks/useListParams';
import useDebouncedValue from '@/hooks/useDebouncedValue';
import PageHeader from '@/components/layout/PageHeader/PageHeader';
import { Alert, Avatar, Badge, Button, Card, Input, PaginationHandler, Select, Skeleton, Table } from '@/components/ui';

const PAGE_SIZE = 20;

const SORT_OPTIONS = [
    { value: '-createdAt', label: 'Newest first' },
    { value: 'createdAt', label: 'Oldest first' },
    { value: 'name', label: 'Name A–Z' },
    { value: '-name', label: 'Name Z–A' },
];

const formatDate = (value) => new Intl.DateTimeFormat(undefined, { dateStyle: 'medium' }).format(new Date(value));

const columns = [
    {
        key: 'name',
        title: 'Name',
        dataIndex: 'name',
        render: (name) => (
            <span className={styles.nameCell}>
                <Avatar name={name} size="sm" />
                {name}
            </span>
        ),
    },
    { key: 'username', title: 'Username', dataIndex: 'username' },
    { key: 'email', title: 'Email', dataIndex: 'email' },
    {
        key: 'role',
        title: 'Role',
        dataIndex: 'role',
        render: (role) => <Badge tone={role === ROLES.admin ? 'primary' : 'neutral'}>{ROLE_LABELS[role] || role}</Badge>,
    },
    { key: 'createdAt', title: 'Joined', dataIndex: 'createdAt', render: formatDate },
];

// Example list page (admins): the pagination contract end to end. Page, search and sort live in the URL
// (useListParams), the search waits until typing stops (useDebouncedValue), every combination is cached
// separately (useUsers), and the current page stays visible while the next one loads.
const Users = () => {
    const { page, search, sort, setPage, setSearch, setSort } = useListParams({ defaultSort: '-createdAt' });
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
            <PageHeader title="Users" subtitle="Everyone who can log in" />

            <div className={styles.toolbar}>
                <Input
                    type="search"
                    aria-label="Search users"
                    placeholder="Search by name, username or email"
                    className={styles.search}
                    value={searchText}
                    onChange={(event) => setSearchText(event.target.value)}
                />
                <Select aria-label="Sort users" className={styles.sort} options={SORT_OPTIONS} value={sort} onChange={(event) => setSort(event.target.value)} />
            </div>

            {users.isError && (
                <Alert tone="danger" title="The users could not be loaded" action={<Button size="sm" variant="secondary" onClick={() => users.refetch()}>Try again</Button>}>
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
                            label="Users"
                            columns={columns}
                            data={items}
                            loading={users.isPlaceholderData}
                            emptyText={search ? `No users match "${search}"` : 'No users yet'}
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

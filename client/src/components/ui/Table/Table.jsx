import { lazy, Suspense } from 'react';
import styles from './Table.module.css';
import EmptyState from '../EmptyState/EmptyState';
import Skeleton from '../Skeleton/Skeleton';

// Ant Design's table downloads the first time a table is shown, not with the first page (README "Performance")
const AntdTable = lazy(() => import('antd/es/table'));

// A data table (Ant Design: sorting, fixed columns, row selection).
// columns: [{ key, title, dataIndex, render? }]; data: the rows; rowKey: the field that identifies a row.
// label names the table for screen readers (e.g. "Users").
// Wide tables scroll sideways inside their own box, which keyboard users can focus and scroll with the arrow keys.
// Paging is off: use PaginationHandler under the table with server-side pages (see README "Lists with pagination").
const Table = ({ columns, data, label, rowKey = 'id', loading = false, emptyText = 'Nothing here yet', ...rest }) => {
    return (
        // A focusable, named region: scrollable areas must be reachable by keyboard
        <div className={styles.scroll} role="region" aria-label={label} tabIndex={0}>
            <Suspense fallback={<div className={styles.loading}><Skeleton height="1.25rem" lines={6} /></div>}>
                <AntdTable
                    columns={columns}
                    dataSource={data}
                    rowKey={rowKey}
                    loading={loading}
                    pagination={false}
                    locale={{ emptyText: <EmptyState title={emptyText} titleAs="p" /> }}
                    {...rest}
                />
            </Suspense>
        </div>
    );
};

export default Table;

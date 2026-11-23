import { Table as AntdTable } from 'antd';
import EmptyState from '../EmptyState/EmptyState';

// A data table (Ant Design: sorting, fixed columns, row selection, scrolling).
// columns: [{ key, title, dataIndex, render? }]; data: the rows; rowKey: the field that identifies a row.
// Paging is off: use PaginationHandler under the table with server-side pages (see README "Lists with pagination").
const Table = ({ columns, data, rowKey = 'id', loading = false, emptyText = 'Nothing here yet', ...rest }) => {
    return (
        <AntdTable
            columns={columns}
            dataSource={data}
            rowKey={rowKey}
            loading={loading}
            pagination={false}
            scroll={{ x: 'max-content' }}
            locale={{ emptyText: <EmptyState title={emptyText} titleAs="p" /> }}
            {...rest}
        />
    );
};

export default Table;

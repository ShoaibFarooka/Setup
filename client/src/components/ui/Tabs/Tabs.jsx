import { lazy, Suspense } from 'react';
import Skeleton from '../Skeleton/Skeleton';

// Ant Design's tabs download the first time tabs are shown, not with the first page (README "Performance")
const AntdTabs = lazy(() => import('antd/es/tabs'));

// Switches between views of the same page. items: [{ key, label, children }].
// Leave activeKey / onChange out to let it manage itself, or pass both (e.g. to keep the tab in the URL).
const Tabs = ({ items, activeKey, defaultActiveKey, onChange }) => {
    return (
        <Suspense fallback={<Skeleton height="2.5rem" />}>
            <AntdTabs items={items} activeKey={activeKey} defaultActiveKey={defaultActiveKey} onChange={onChange} />
        </Suspense>
    );
};

export default Tabs;

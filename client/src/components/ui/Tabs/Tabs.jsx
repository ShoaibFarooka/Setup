import { Tabs as AntdTabs } from 'antd';

// Switches between views of the same page. items: [{ key, label, children }].
// Leave activeKey / onChange out to let it manage itself, or pass both (e.g. to keep the tab in the URL).
const Tabs = ({ items, activeKey, defaultActiveKey, onChange }) => {
    return <AntdTabs items={items} activeKey={activeKey} defaultActiveKey={defaultActiveKey} onChange={onChange} />;
};

export default Tabs;

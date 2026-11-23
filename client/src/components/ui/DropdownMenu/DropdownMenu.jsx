import { Dropdown } from 'antd';

// A menu that opens from a trigger (the child, e.g. an IconButton with a "more" icon).
// items: [{ key, label, icon?, danger?, disabled?, onClick }]; opens on click, works with the keyboard.
const DropdownMenu = ({ items, placement = 'bottomRight', children }) => {
    const menu = {
        items: items.map(({ key, label, icon, danger, disabled }) => ({ key, label, icon, danger, disabled })),
        onClick: ({ key }) => items.find((item) => item.key === key)?.onClick?.(),
    };

    return (
        <Dropdown menu={menu} trigger={['click']} placement={placement}>
            {children}
        </Dropdown>
    );
};

export default DropdownMenu;

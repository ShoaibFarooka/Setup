import { cloneElement, lazy, Suspense, useEffect, useState } from 'react';

// Ant Design's dropdown downloads the first time a menu is shown, not with the first page (README "Performance").
// Until it arrives the trigger shows on its own; a click on it in that moment is remembered and the menu opens as
// soon as the code is there, so no click is lost.
const Dropdown = lazy(() => import('antd/es/dropdown'));

// Rendered next to the dropdown once its code has loaded: opens the menu for a click that came before. It opens
// after the dropdown has mounted (an effect), through the same path as a normal click, so the popup is placed
// before anyone can click in it.
const OpenWhenReady = ({ pending, onReady }) => {
    useEffect(() => {
        if (pending) {
            onReady();
        }
    }, [pending, onReady]);
    return null;
};

// A menu that opens from a trigger (the child, e.g. an IconButton with a "more" icon).
// items: [{ key, label, icon?, danger?, disabled?, onClick }]; opens on click, works with the keyboard.
const DropdownMenu = ({ items, placement = 'bottomRight', children }) => {
    const [open, setOpen] = useState(false);
    const [pendingOpen, setPendingOpen] = useState(false);
    const menu = {
        items: items.map(({ key, label, icon, danger, disabled }) => ({ key, label, icon, danger, disabled })),
        onClick: ({ key }) => {
            setOpen(false);
            items.find((item) => item.key === key)?.onClick?.();
        },
    };

    return (
        <Suspense fallback={cloneElement(children, { onClick: () => setPendingOpen(true) })}>
            <Dropdown menu={menu} trigger={['click']} placement={placement} open={open} onOpenChange={setOpen}>
                {children}
            </Dropdown>
            <OpenWhenReady
                pending={pendingOpen}
                onReady={() => {
                    setPendingOpen(false);
                    setOpen(true);
                }}
            />
        </Suspense>
    );
};

export default DropdownMenu;

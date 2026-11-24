import { lazy, Suspense, useState } from 'react';

// Ant Design's dialog downloads the first time a dialog opens, not with the first page (README "Performance").
// After that it stays rendered, so closing still animates.
const AntdModal = lazy(() => import('antd/es/modal'));

// A dialog (Ant Design: focus is kept inside, Escape and the backdrop close it).
// open / onClose control it; footer: buttons at the bottom (null for none). For a yes / no question use confirm().
const Modal = ({ open, onClose, title, footer = null, width = 520, children }) => {
    const [opened, setOpened] = useState(open);
    if (open && !opened) {
        setOpened(true);
    }

    if (!opened) {
        return null;
    }

    return (
        <Suspense fallback={null}>
            <AntdModal open={open} onCancel={onClose} title={title} footer={footer} width={width} centered destroyOnHidden>
                {children}
            </AntdModal>
        </Suspense>
    );
};

export default Modal;

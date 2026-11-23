import { Modal as AntdModal } from 'antd';

// A dialog (Ant Design: focus is kept inside, Escape and the backdrop close it).
// open / onClose control it; footer: buttons at the bottom (null for none). For a yes / no question use confirm().
const Modal = ({ open, onClose, title, footer = null, width = 520, children }) => {
    return (
        <AntdModal open={open} onCancel={onClose} title={title} footer={footer} width={width} centered destroyOnHidden>
            {children}
        </AntdModal>
    );
};

export default Modal;

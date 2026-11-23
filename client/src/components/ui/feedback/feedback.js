import { message, Modal } from 'antd';

// Toasts and confirm dialogs that work from anywhere, including outside React (e.g. the query client).
// UiProvider registers Ant Design's context-aware versions, so they follow the theme; the static
// versions are only a fallback before it mounts.
let api = { message, modal: Modal };

export const registerFeedback = (next) => {
    api = next;
};

export const resetFeedback = () => {
    api = { message, modal: Modal };
};

// Short notices that disappear on their own: toast.success('Saved'), toast.error(getErrorMessage(error))
export const toast = {
    success: (content) => api.message.success(content),
    error: (content) => api.message.error(content),
    warning: (content) => api.message.warning(content),
    info: (content) => api.message.info(content),
};

// Asks before an action. Returning a promise from onConfirm keeps the button loading until it settles;
// a rejected promise keeps the dialog open. danger: a red confirm button for destructive actions.
export const confirm = ({ title, content, confirmText = 'Confirm', cancelText = 'Cancel', danger = false, onConfirm }) =>
    api.modal.confirm({
        title,
        content,
        okText: confirmText,
        cancelText,
        okButtonProps: danger ? { danger: true } : undefined,
        centered: true,
        onOk: onConfirm,
    });

import { message, Modal } from 'antd';
import { DEFAULT_UI_TEXTS } from '../UiProvider/uiTexts';

// Toasts and confirm dialogs that work from anywhere, including outside React (e.g. the query client).
// UiProvider registers Ant Design's context-aware versions, so they follow the theme; the static
// versions are only a fallback before it mounts.
let api = { message, modal: Modal, texts: DEFAULT_UI_TEXTS };

export const registerFeedback = (next) => {
    api = { texts: DEFAULT_UI_TEXTS, ...next };
};

export const resetFeedback = () => {
    api = { message, modal: Modal, texts: DEFAULT_UI_TEXTS };
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
// The button texts default to the ui texts (translated by the app through UiProvider).
export const confirm = ({ title, content, confirmText, cancelText, danger = false, onConfirm }) =>
    api.modal.confirm({
        title,
        content,
        okText: confirmText ?? api.texts.confirm,
        cancelText: cancelText ?? api.texts.cancel,
        okButtonProps: danger ? { danger: true } : undefined,
        centered: true,
        onOk: onConfirm,
    });

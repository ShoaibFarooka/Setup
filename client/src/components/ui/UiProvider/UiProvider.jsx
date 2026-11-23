import { useLayoutEffect, useMemo } from 'react';
import { App as AntdApp, ConfigProvider } from 'antd';
import useTheme from '@/hooks/useTheme';
import { getAntdTheme } from './antdTheme';
import { registerFeedback, resetFeedback } from '../feedback/feedback';

// Gives toast() and confirm() Ant Design's context-aware versions, which follow the theme
const FeedbackBridge = () => {
    const { message, modal } = AntdApp.useApp();

    useLayoutEffect(() => {
        registerFeedback({ message, modal });
        return resetFeedback;
    }, [message, modal]);

    return null;
};

// Themes the Ant Design parts of ui/ from theme.css, for the current light or dark theme
const UiProvider = ({ children }) => {
    const { theme } = useTheme();
    const antdTheme = useMemo(() => getAntdTheme(theme), [theme]);

    return (
        <ConfigProvider theme={antdTheme}>
            <AntdApp component={false}>
                <FeedbackBridge />
                {children}
            </AntdApp>
        </ConfigProvider>
    );
};

export default UiProvider;

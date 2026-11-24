import { useLayoutEffect, useMemo } from 'react';
import AntdApp from 'antd/es/app';
import ConfigProvider from 'antd/es/config-provider';
import useTheme from '@/hooks/useTheme';
import { getAntdTheme } from './antdTheme';
import { UiTextsContext, mergeUiTexts } from './uiTexts';
import { registerFeedback, resetFeedback } from '../feedback/feedback';

// Gives toast() and confirm() Ant Design's context-aware versions, which follow the theme and direction,
// and the translated default button texts
const FeedbackBridge = ({ texts }) => {
    const { message, modal } = AntdApp.useApp();

    useLayoutEffect(() => {
        registerFeedback({ message, modal, texts });
        return resetFeedback;
    }, [message, modal, texts]);

    return null;
};

// Themes the Ant Design parts of ui/ from theme.css, for the current light or dark theme.
// direction: 'ltr' | 'rtl' (Ant Design mirrors its components; our own use logical CSS properties).
// texts: the ui components' own words, translated by the app (see uiTexts.js); missing ones stay English.
const UiProvider = ({ direction = 'ltr', texts, children }) => {
    const { theme } = useTheme();
    const antdTheme = useMemo(() => getAntdTheme(theme), [theme]);
    const uiTexts = useMemo(() => mergeUiTexts(texts), [texts]);

    return (
        <ConfigProvider theme={antdTheme} direction={direction}>
            <AntdApp component={false}>
                <UiTextsContext.Provider value={uiTexts}>
                    <FeedbackBridge texts={uiTexts} />
                    {children}
                </UiTextsContext.Provider>
            </AntdApp>
        </ConfigProvider>
    );
};

export default UiProvider;

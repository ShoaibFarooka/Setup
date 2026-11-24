import { useMemo } from 'react';
import Router from './router/Router';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { UiProvider } from './components/ui';
import useLanguage from './hooks/useLanguage';

const App = () => {
    const { dir, t, formatNumber } = useLanguage();

    // The ui kit's own words, in the current language (components/ui/UiProvider/uiTexts.js)
    const uiTexts = useMemo(() => ({
        loading: t('ui.loading'),
        confirm: t('ui.confirm'),
        cancel: t('ui.cancel'),
        showPassword: t('ui.showPassword'),
        hidePassword: t('ui.hidePassword'),
        emptyTable: t('ui.emptyTable'),
        formatNumber,
        pagination: {
            label: t('ui.pagination.label'),
            previous: t('ui.pagination.previous'),
            next: t('ui.pagination.next'),
            page: (page) => t('ui.pagination.page', { page }),
            summary: (values) => t('ui.pagination.summary', values),
        },
    }), [t, formatNumber]);

    return (
        <UiProvider direction={dir} texts={uiTexts}>
            {/* Last resort for failures outside a page (layout, sidebar); pages have their own in Router */}
            <ErrorBoundary>
                <Router />
            </ErrorBoundary>
        </UiProvider>
    );
};

export default App;

import { Component } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { Button, EmptyState } from '@/components/ui';
import { t } from '@/lib/i18n';

const reloadPage = () => window.location.reload();

// Shows a message instead of a blank screen when rendering fails, including a page's code failing to download
// (e.g. after a new deploy replaced it): reloading fetches the current version. React has no hook for this yet.
// A class component cannot use hooks: the texts come from t() in the current language.
class ErrorBoundary extends Component {
    state = { hasError: false };

    static getDerivedStateFromError() {
        return { hasError: true };
    }

    // An error reporting service (e.g. Sentry) would be called here: componentDidCatch(error, info)

    render() {
        if (!this.state.hasError) {
            return this.props.children;
        }

        const { onReload = reloadPage } = this.props;
        return (
            <EmptyState
                icon={<FiAlertCircle />}
                tone="danger"
                title={t('errors.crashTitle')}
                description={t('errors.crashText')}
                actions={<Button onClick={onReload}>{t('errors.reload')}</Button>}
            />
        );
    }
}

export default ErrorBoundary;

import { Component } from 'react';
import { FiAlertCircle } from 'react-icons/fi';
import { Button, EmptyState } from '@/components/ui';

const reloadPage = () => window.location.reload();

// Shows a message instead of a blank screen when rendering fails, including a page's code failing to download
// (e.g. after a new deploy replaced it): reloading fetches the current version. React has no hook for this yet.
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
                title="Something went wrong"
                description="This page could not be displayed. Reloading usually fixes it."
                actions={<Button onClick={onReload}>Reload page</Button>}
            />
        );
    }
}

export default ErrorBoundary;

import Router from './router/Router';
import ErrorBoundary from './components/ErrorBoundary/ErrorBoundary';
import { UiProvider } from './components/ui';

const App = () => {
    return (
        <UiProvider>
            {/* Last resort for failures outside a page (layout, sidebar); pages have their own in Router */}
            <ErrorBoundary>
                <Router />
            </ErrorBoundary>
        </UiProvider>
    );
};

export default App;

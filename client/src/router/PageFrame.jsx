import { Suspense, useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';
import ErrorBoundary from '@/components/ErrorBoundary/ErrorBoundary';
import Loader from '@/components/Loader/Loader';
import motion from '@/styles/motion.module.css';

// The page itself, once its code has loaded: rises into place, and after a navigation moves keyboard and
// screen-reader focus to its heading, so the change of page is announced (the browser does not do this
// for single-page apps). The first page load keeps the browser's own focus, and a page that already put focus
// inside itself (a form's autoFocus field) keeps it. The heading gets no focus ring (base.css): it is not a control.
const PageContent = ({ children }) => {
    const ref = useRef(null);
    const { key } = useLocation();

    useEffect(() => {
        if (key === 'default' || ref.current?.contains(document.activeElement)) {
            return;
        }
        const heading = ref.current?.querySelector('h1');
        if (heading) {
            heading.setAttribute('tabindex', '-1');
            heading.focus({ preventScroll: true });
        }
    }, [key]);

    return <div ref={ref} className={motion.fadeUp}>{children}</div>;
};

// Every page goes through this: its own error boundary (a crash or a failed download shows a message and keeps
// the layout usable; the key clears it when leaving the page), a spinner while its code downloads, then the page.
const PageFrame = ({ path, children }) => {
    return (
        <ErrorBoundary key={path}>
            <Suspense fallback={<Loader content />}>
                <PageContent>{children}</PageContent>
            </Suspense>
        </ErrorBoundary>
    );
};

export default PageFrame;

import clsx from 'clsx';
import styles from './Loader.module.css';
import { Spinner } from '@/components/ui';

// A spinner that fills the screen.
// Default: over the page with a dimmed backdrop, while an action blocks the screen (e.g. logging out).
// page: on the plain page background, while the session is loading.
// content: inside the content area only (the sidebar stays usable), while a page's code downloads.
const Loader = ({ page = false, content = false }) => {
    const variant = (content && styles.content) || (page && styles.page) || styles.overlay;

    return (
        <div className={clsx(styles.loader, variant)}>
            <Spinner size="lg" label="Loading" />
        </div>
    );
};

export default Loader;

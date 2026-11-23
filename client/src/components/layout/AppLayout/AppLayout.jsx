import { Outlet } from 'react-router-dom';
import clsx from 'clsx';
import styles from './AppLayout.module.css';
import Sidebar from '@/components/layout/Sidebar/Sidebar';

// The frame of logged-in pages: the sidebar (when showSidebar is set) and the content area with the page.
// Used as a layout route, so it stays mounted while moving between pages.
// "Skip to content" is the first thing a keyboard user reaches: it jumps over the sidebar to the page.
const AppLayout = ({ showSidebar = false, children }) => {
    return (
        <div className={styles.layout}>
            <a href="#main-content" className={styles.skipLink}>Skip to content</a>
            {showSidebar && <Sidebar />}
            <main id="main-content" tabIndex={-1} className={clsx(styles.content, showSidebar && styles.withSidebar)}>
                {children ?? <Outlet />}
            </main>
        </div>
    );
};

export default AppLayout;

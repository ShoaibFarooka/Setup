import styles from './AuthContainer.module.css';
import BrandLogo from '@/components/BrandLogo/BrandLogo';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';

// The frame of the auth pages: a top row with the theme toggle, then the brand and the form panel.
// The toggle has its own row, so it can never overlap the brand or the form at any screen size.
const AuthContainer = ({ children }) => {
    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <ThemeToggle variant="ghostInverse" />
            </div>
            <div className={styles.body}>
                <div className={styles.intro}>
                    <BrandLogo variant="light" />
                    <div className={styles.headline}>Welcome back</div>
                    <div className={styles.subHeadline}>Sign in to continue to your account.</div>
                </div>
                <main className={styles.panel}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AuthContainer;

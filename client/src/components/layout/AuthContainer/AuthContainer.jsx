import styles from './AuthContainer.module.css';
import BrandLogo from '@/components/BrandLogo/BrandLogo';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import LanguageSwitch from '@/components/LanguageSwitch/LanguageSwitch';
import useLanguage from '@/hooks/useLanguage';

// The frame of the auth pages: a top row with the language and theme switches, then the brand and the form panel.
// The switches have their own row, so they can never overlap the brand or the form at any screen size.
// headline / subHeadline: the text next to the brand (each auth page can set its own; default: welcome back).
const AuthContainer = ({ headline, subHeadline, children }) => {
    const { t } = useLanguage();

    return (
        <div className={styles.container}>
            <div className={styles.topBar}>
                <LanguageSwitch variant="ghostInverse" />
                <ThemeToggle variant="ghostInverse" />
            </div>
            <div className={styles.body}>
                <div className={styles.intro}>
                    <BrandLogo variant="light" />
                    <div className={styles.headline}>{headline ?? t('auth.welcome')}</div>
                    <div className={styles.subHeadline}>{subHeadline ?? t('auth.welcomeText')}</div>
                </div>
                <main className={styles.panel}>
                    {children}
                </main>
            </div>
        </div>
    );
};

export default AuthContainer;

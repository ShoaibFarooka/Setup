import clsx from 'clsx';
import styles from './BrandLogo.module.css';
import { APP_NAME } from '@/constants/appConstants';

// Placeholder logo: the app's first letter on a tile, next to its name. Replace with the real logo.
// variant: 'dark' (on light backgrounds) or 'light' (on dark backgrounds); compact: smaller, for bars
const BrandLogo = ({ variant = 'dark', compact = false }) => {
    const size = compact ? 32 : 44;

    return (
        <div className={clsx(styles.logo, variant === 'light' && styles.light, compact && styles.compact)}>
            <svg viewBox="0 0 64 64" width={size} height={size} aria-hidden="true">
                <rect width="64" height="64" rx="14" className={styles.crestBg} />
                <text x="32" y="43" textAnchor="middle" className={styles.crestLetter}>{APP_NAME.charAt(0)}</text>
            </svg>
            <div className={styles.name}>{APP_NAME}</div>
        </div>
    );
};

export default BrandLogo;

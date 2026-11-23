import clsx from 'clsx';
import styles from './Badge.module.css';

// A small label for a status or category. tone: 'neutral' | 'primary' | 'success' | 'warning' | 'danger' | 'info'.
const Badge = ({ tone = 'neutral', className, children }) => {
    return <span className={clsx(styles.badge, styles[tone], className)}>{children}</span>;
};

export default Badge;

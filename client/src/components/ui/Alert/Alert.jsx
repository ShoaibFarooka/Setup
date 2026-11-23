import clsx from 'clsx';
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle, FiInfo } from 'react-icons/fi';
import styles from './Alert.module.css';
import motion from '@/styles/motion.module.css';

const ICONS = { info: FiInfo, success: FiCheckCircle, warning: FiAlertTriangle, danger: FiAlertCircle };

// A message inside the page (for short-lived notices use toast instead).
// tone: 'info' | 'success' | 'warning' | 'danger'; action: e.g. a Button on the right.
// Warnings and errors are announced to screen readers at once (role="alert"), the others politely.
const Alert = ({ tone = 'info', title, action, className, children }) => {
    const Icon = ICONS[tone];
    const urgent = tone === 'warning' || tone === 'danger';

    return (
        // Fades in, so a message that appears after an action is noticed
        <div className={clsx(styles.alert, motion.fadeIn, styles[tone], className)} role={urgent ? 'alert' : 'status'}>
            <Icon className={styles.icon} aria-hidden="true" />
            <div className={styles.body}>
                {title && <div className={styles.title}>{title}</div>}
                {children}
            </div>
            {action && <div className={styles.action}>{action}</div>}
        </div>
    );
};

export default Alert;

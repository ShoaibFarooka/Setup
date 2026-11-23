import clsx from 'clsx';
import styles from './EmptyState.module.css';

// A centred message with an icon and actions: empty lists, "not found", "access denied", errors.
// tone colours the icon: 'neutral' | 'warning' | 'danger'. titleAs: the heading level for the title.
const EmptyState = ({ icon, title, description, actions, tone = 'neutral', titleAs: Title = 'h2', className }) => {
    return (
        <div className={clsx(styles.empty, styles[tone], className)}>
            {icon && <div className={styles.icon} aria-hidden="true">{icon}</div>}
            <Title className={styles.title}>{title}</Title>
            {description && <p className={styles.description}>{description}</p>}
            {actions && <div className={styles.actions}>{actions}</div>}
        </div>
    );
};

export default EmptyState;

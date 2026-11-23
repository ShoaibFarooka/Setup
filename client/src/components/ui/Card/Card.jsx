import clsx from 'clsx';
import styles from './Card.module.css';

const PADDING = { none: styles.paddingNone, sm: styles.paddingSm, md: styles.paddingMd, lg: styles.paddingLg };

// A box for content on a page. title and actions add a header row; padding: 'none' | 'sm' | 'md' | 'lg'.
// className adds the page's own layout (e.g. a flex row).
const Card = ({ title, actions, padding = 'md', className, children }) => {
    return (
        <section className={styles.card}>
            {(title || actions) && (
                <div className={styles.header}>
                    {title && <h2 className={styles.title}>{title}</h2>}
                    {actions}
                </div>
            )}
            <div className={clsx(PADDING[padding], className)}>{children}</div>
        </section>
    );
};

export default Card;

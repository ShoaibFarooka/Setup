import clsx from 'clsx';
import styles from './DescriptionList.module.css';

// Label / value pairs (account details, an order summary). items: [{ key, label, value }].
// Empty values show a dash so rows never look broken.
const DescriptionList = ({ items = [], className }) => {
    return (
        <dl className={clsx(styles.list, className)}>
            {items.map(({ key, label, value }) => (
                <div key={key} className={styles.row}>
                    <dt className={styles.term}>{label}</dt>
                    <dd className={styles.value}>{value ?? '—'}</dd>
                </div>
            ))}
        </dl>
    );
};

export default DescriptionList;

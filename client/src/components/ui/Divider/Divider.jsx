import clsx from 'clsx';
import styles from './Divider.module.css';

// A thin line between sections; vertical for between items in a row
const Divider = ({ vertical = false, className }) => {
    return <hr className={clsx(styles.divider, vertical && styles.vertical, className)} aria-orientation={vertical ? 'vertical' : undefined} />;
};

export default Divider;

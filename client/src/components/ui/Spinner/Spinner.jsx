import clsx from 'clsx';
import styles from './Spinner.module.css';

// A spinning circle in the current text colour. size: 'sm' | 'md' | 'lg'.
// decorative: hidden from screen readers when something else already says "loading" (e.g. a busy button).
const Spinner = ({ size = 'md', label = 'Loading', decorative = false, className }) => {
    const a11y = decorative ? { 'aria-hidden': true } : { role: 'status', 'aria-label': label };

    return <span className={clsx(styles.spinner, styles[size], className)} {...a11y} />;
};

export default Spinner;

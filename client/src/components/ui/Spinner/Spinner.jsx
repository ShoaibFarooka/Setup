import clsx from 'clsx';
import styles from './Spinner.module.css';
import { useUiTexts } from '../UiProvider/uiTexts';

// A spinning circle in the current text colour. size: 'sm' | 'md' | 'lg'.
// decorative: hidden from screen readers when something else already says "loading" (e.g. a busy button).
// label: what screen readers announce (default: the ui texts' "Loading").
const Spinner = ({ size = 'md', label, decorative = false, className }) => {
    const texts = useUiTexts();
    const a11y = decorative ? { 'aria-hidden': true } : { role: 'status', 'aria-label': label ?? texts.loading };

    return <span className={clsx(styles.spinner, styles[size], className)} {...a11y} />;
};

export default Spinner;

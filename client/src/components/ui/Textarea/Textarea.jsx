import clsx from 'clsx';
import styles from '../Input/Input.module.css';

// A multi-line text input; same props as Input (except size), plus rows. Shares Input's look (.control + .multiline).
const Textarea = ({ invalid = false, rows = 4, className, ...rest }) => {
    return (
        <textarea
            rows={rows}
            className={clsx(styles.control, styles.multiline, invalid && styles.invalid, className)}
            aria-invalid={invalid || undefined}
            {...rest}
        />
    );
};

export default Textarea;

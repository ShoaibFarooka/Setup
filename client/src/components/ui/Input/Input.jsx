import clsx from 'clsx';
import styles from './Input.module.css';

// A text input. invalid: red border + aria-invalid (FormField sets it from its error). size: 'sm' | 'md' | 'lg'.
// Other props (value, onChange, type, name, placeholder, ...) go to the <input>.
const Input = ({ invalid = false, size = 'md', className, ...rest }) => {
    return (
        <input
            className={clsx(styles.control, styles[size], invalid && styles.invalid, className)}
            aria-invalid={invalid || undefined}
            {...rest}
        />
    );
};

export default Input;

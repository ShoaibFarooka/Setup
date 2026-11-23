import clsx from 'clsx';
import styles from './Button.module.css';
import Spinner from '../Spinner/Spinner';

// variant: 'primary' | 'secondary' | 'ghost' | 'ghostInverse' (on a brand-coloured area) | 'danger' | 'dangerOutline';
// size: 'sm' | 'md' | 'lg'.
// loading: shows a spinner, disables the button and tells screen readers it is busy.
// icon: an element shown before the text. Other props (onClick, type, aria-*, ...) go to the <button>.
const Button = ({
    variant = 'primary',
    size = 'md',
    loading = false,
    fullWidth = false,
    icon,
    type = 'button',
    disabled,
    className,
    children,
    ...rest
}) => {
    return (
        <button
            type={type}
            className={clsx(styles.button, styles[variant], styles[size], fullWidth && styles.fullWidth, className)}
            disabled={disabled || loading}
            aria-busy={loading || undefined}
            {...rest}
        >
            {loading ? <Spinner size="sm" decorative /> : icon}
            {children}
        </button>
    );
};

export default Button;

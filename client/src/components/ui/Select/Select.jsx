import clsx from 'clsx';
import styles from '../Input/Input.module.css';

// A native dropdown (works with keyboard, screen readers and mobile pickers out of the box).
// options: [{ value, label, disabled? }]; placeholder adds an empty first choice. Shares Input's look (.control + .select).
// For search, multiple choice or long lists, add an Ant Design Select wrapper to ui/ instead.
const Select = ({ options = [], placeholder, invalid = false, size = 'md', className, ...rest }) => {
    return (
        <select
            className={clsx(styles.control, styles.select, styles[size], invalid && styles.invalid, className)}
            aria-invalid={invalid || undefined}
            {...rest}
        >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((option) => (
                <option key={option.value} value={option.value} disabled={option.disabled}>{option.label}</option>
            ))}
        </select>
    );
};

export default Select;

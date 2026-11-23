import clsx from 'clsx';
import styles from './Switch.module.css';

// An on / off switch for settings that apply at once. onChange(checked) gets the new value.
const Switch = ({ checked = false, onChange, label, disabled, className }) => {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={checked}
            disabled={disabled}
            className={clsx(styles.switch, checked && styles.on, className)}
            onClick={() => onChange?.(!checked)}
        >
            <span className={styles.track}><span className={styles.thumb} /></span>
            {label}
        </button>
    );
};

export default Switch;

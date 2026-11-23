import clsx from 'clsx';
import styles from './Checkbox.module.css';

// A checkbox with its label. Other props (checked, onChange, name, disabled, ...) go to the <input>.
const Checkbox = ({ label, className, ...rest }) => {
    return (
        <label className={clsx(styles.choice, className)}>
            <input type="checkbox" className={styles.input} {...rest} />
            {label}
        </label>
    );
};

export default Checkbox;

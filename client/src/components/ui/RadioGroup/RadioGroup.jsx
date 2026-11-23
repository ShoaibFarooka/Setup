import clsx from 'clsx';
import styles from './RadioGroup.module.css';
import choiceStyles from '../Checkbox/Checkbox.module.css';

// One choice out of several. options: [{ value, label, disabled? }]; onChange(value).
// label names the group for screen readers (a <fieldset> with a <legend>).
const RadioGroup = ({ label, name, options = [], value, onChange, direction = 'vertical', className }) => {
    return (
        <fieldset className={clsx(styles.group, direction === 'horizontal' && styles.horizontal, className)}>
            {label && <legend className={styles.legend}>{label}</legend>}
            {options.map((option) => (
                <label key={option.value} className={choiceStyles.choice}>
                    <input
                        type="radio"
                        className={choiceStyles.input}
                        name={name}
                        value={option.value}
                        checked={value === option.value}
                        disabled={option.disabled}
                        onChange={() => onChange?.(option.value)}
                    />
                    {option.label}
                </label>
            ))}
        </fieldset>
    );
};

export default RadioGroup;

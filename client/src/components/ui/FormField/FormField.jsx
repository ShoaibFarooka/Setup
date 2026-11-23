import { cloneElement, useId } from 'react';
import clsx from 'clsx';
import styles from './FormField.module.css';
import motion from '@/styles/motion.module.css';

// A label, one control (the child), an optional hint and the error. It links them for screen readers:
// the label points to the control, and the hint and error are announced with it.
// The control gets id, invalid and aria-describedby, so it must accept them (every ui/ text control does).
const FormField = ({ label, error, hint, required = false, id, className, children }) => {
    const generatedId = useId();
    const controlId = id || generatedId;
    const hintId = hint ? `${controlId}-hint` : undefined;
    const errorId = error ? `${controlId}-error` : undefined;
    const describedBy = [hintId, errorId].filter(Boolean).join(' ') || undefined;

    return (
        <div className={clsx(styles.field, className)}>
            <label htmlFor={controlId} className={styles.label}>
                {label}
                {required && <span className={styles.required} aria-hidden="true">*</span>}
            </label>
            {cloneElement(children, {
                id: controlId,
                invalid: Boolean(error),
                'aria-required': required || undefined,
                'aria-describedby': describedBy,
            })}
            {hint && <div id={hintId} className={styles.hint}>{hint}</div>}
            {/* Fades in when it appears, so a new validation message catches the eye */}
            {error && <div id={errorId} className={clsx(styles.error, motion.fadeIn)}>{error}</div>}
        </div>
    );
};

export default FormField;

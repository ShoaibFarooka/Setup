import clsx from 'clsx';
import Button from '../Button/Button';
import buttonStyles from '../Button/Button.module.css';

// A square button with only an icon. label is required: it is what screen readers (and tests) call the button.
const IconButton = ({ label, icon, variant = 'ghost', size = 'md', className, ...rest }) => {
    return (
        <Button
            variant={variant}
            size={size}
            aria-label={label}
            title={label}
            className={clsx(buttonStyles.iconOnly, className)}
            {...rest}
        >
            {icon}
        </Button>
    );
};

export default IconButton;

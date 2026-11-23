import { useState } from 'react';
import clsx from 'clsx';
import { TbEye, TbEyeOff } from 'react-icons/tb';
import styles from './PasswordInput.module.css';
import Input from '../Input/Input';
import IconButton from '../IconButton/IconButton';

// A password input with a show / hide button; same props as Input
const PasswordInput = ({ size = 'md', className, ...rest }) => {
    const [visible, setVisible] = useState(false);

    return (
        <div className={styles.wrapper}>
            <Input
                type={visible ? 'text' : 'password'}
                size={size}
                className={clsx(styles.input, className)}
                {...rest}
            />
            <IconButton
                label={visible ? 'Hide password' : 'Show password'}
                icon={visible ? <TbEyeOff size={18} /> : <TbEye size={18} />}
                size="sm"
                className={styles.toggle}
                onClick={() => setVisible(!visible)}
            />
        </div>
    );
};

export default PasswordInput;

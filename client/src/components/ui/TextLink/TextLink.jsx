import clsx from 'clsx';
import { Link } from 'react-router-dom';
import styles from './TextLink.module.css';

// A link inside text. `to`: a page of this app (client-side navigation); `href`: another site, which opens in a
// new tab without giving it access to this one (rel="noopener noreferrer").
// tone: 'primary' | 'muted'. Other props (aria-*, onClick, ...) go to the <a>.
const TextLink = ({ to, href, tone = 'primary', className, children, ...rest }) => {
    const classes = clsx(styles.link, styles[tone], className);

    if (to !== undefined) {
        return <Link to={to} className={classes} {...rest}>{children}</Link>;
    }

    return (
        <a href={href} target="_blank" rel="noopener noreferrer" className={classes} {...rest}>
            {children}
        </a>
    );
};

export default TextLink;

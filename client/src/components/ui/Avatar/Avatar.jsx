import clsx from 'clsx';
import styles from './Avatar.module.css';

// "Ada Lovelace" → "AL", "admin" → "A"
const getInitials = (name = '') => name
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((word) => word[0].toUpperCase())
    .join('');

// A person's picture, or their initials when there is none. size: 'sm' | 'md' | 'lg'.
// Decorative by default (the name is usually shown next to it); pass label to make it announce the name.
const Avatar = ({ name, src, size = 'md', label, className }) => {
    const a11y = label ? { role: 'img', 'aria-label': label } : { 'aria-hidden': true };

    return (
        <span className={clsx(styles.avatar, styles[size], className)} {...a11y}>
            {src ? <img src={src} alt="" className={styles.image} /> : getInitials(name)}
        </span>
    );
};

export default Avatar;

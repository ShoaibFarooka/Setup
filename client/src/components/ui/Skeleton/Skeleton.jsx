import clsx from 'clsx';
import styles from './Skeleton.module.css';

// A grey placeholder shaped like the content that is loading (looks calmer than a spinner for lists and cards).
// lines > 1 draws a paragraph whose last line is shorter. Hidden from screen readers: pair it with
// an isPending state the page announces (e.g. aria-busy on the list).
const Skeleton = ({ width = '100%', height = '1em', radius, lines = 1, className }) => {
    const block = (key, lineWidth) => (
        <span
            key={key}
            className={clsx(styles.skeleton, className)}
            style={{ width: lineWidth, height, borderRadius: radius }}
            aria-hidden="true"
        />
    );

    if (lines === 1) {
        return block('single', width);
    }
    return (
        <span className={styles.lines} aria-hidden="true">
            {Array.from({ length: lines }, (_, i) => block(i, i === lines - 1 ? '60%' : width))}
        </span>
    );
};

export default Skeleton;

import styles from './PageHeader.module.css';

// The title block at the top of a page inside the app; actions: buttons on the right (e.g. "New product")
const PageHeader = ({ title, subtitle, actions }) => {
    return (
        <div className={styles.header}>
            <div>
                <h1 className={styles.title}>{title}</h1>
                {subtitle && <div className={styles.subtitle}>{subtitle}</div>}
            </div>
            {actions}
        </div>
    );
};

export default PageHeader;

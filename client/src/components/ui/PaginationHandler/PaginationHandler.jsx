import clsx from 'clsx';
import styles from './PaginationHandler.module.css';
import { FiChevronLeft as ArrowLeft, FiChevronRight as ArrowRight } from 'react-icons/fi';
import { useUiTexts } from '../UiProvider/uiTexts';

const SHOW_PAGES = 2; // pages shown on each side of the current one

// The page numbers to show, with 'gap-start' / 'gap-end' where pages are left out, e.g. [1, 'gap-start', 4, 5, 6, 7, 8, 'gap-end', 20]
const getPageItems = (pageIndex, totalPages) => {
    if (pageIndex <= 0 || pageIndex > totalPages) {
        return [];
    }
    const pagesFrom = (first, last) => Array.from({ length: last - first + 1 }, (_, i) => first + i);
    const windowSize = SHOW_PAGES * 2 + 1;

    if (totalPages <= windowSize) {
        return pagesFrom(1, totalPages);
    }
    if (pageIndex <= SHOW_PAGES + 2) {
        return [...pagesFrom(1, windowSize), 'gap-end', totalPages];
    }
    if (pageIndex >= totalPages - SHOW_PAGES - 1) {
        return [1, 'gap-start', ...pagesFrom(totalPages - SHOW_PAGES * 2, totalPages)];
    }
    return [1, 'gap-start', ...pagesFrom(pageIndex - SHOW_PAGES, pageIndex + SHOW_PAGES), 'gap-end', totalPages];
};

// Page navigation for lists: a summary plus previous / page numbers / next. Pages start at 1.
// count: items on this page, totalCount: items in all pages; handlePageChange(page) is called with the page to open.
// The arrows point the reading direction (mirrored for right-to-left languages).
const PaginationHandler = ({ count, totalCount, pageIndex, totalPages, handlePageChange }) => {
    const { pagination: texts, formatNumber } = useUiTexts();

    return (
        <nav className={styles.pagination} aria-label={texts.label}>
            <div className={styles.summary}>
                {texts.summary({ count, total: totalCount, page: pageIndex, pages: totalPages })}
            </div>
            <div className={styles.pages}>
                <button
                    type="button"
                    className={styles.pageButton}
                    aria-label={texts.previous}
                    disabled={pageIndex <= 1}
                    onClick={() => handlePageChange(pageIndex - 1)}
                >
                    <ArrowLeft className={styles.arrow} />
                </button>

                {getPageItems(pageIndex, totalPages).map((item) => (
                    typeof item === 'string' ? (
                        <span key={item} className={styles.gap} aria-hidden="true">...</span>
                    ) : (
                        <button
                            key={item}
                            type="button"
                            className={clsx(styles.pageButton, item === pageIndex && styles.current)}
                            aria-label={texts.page(item)}
                            aria-current={item === pageIndex ? 'page' : undefined}
                            onClick={() => item !== pageIndex && handlePageChange(item)}
                        >
                            {formatNumber(item)}
                        </button>
                    )
                ))}

                <button
                    type="button"
                    className={styles.pageButton}
                    aria-label={texts.next}
                    disabled={pageIndex >= totalPages}
                    onClick={() => handlePageChange(pageIndex + 1)}
                >
                    <ArrowRight className={styles.arrow} />
                </button>
            </div>
        </nav>
    );
};

export default PaginationHandler;

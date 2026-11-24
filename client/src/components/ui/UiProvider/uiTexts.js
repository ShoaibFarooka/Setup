import { createContext, useContext } from 'react';

// The words the ui components say themselves (labels for screen readers, default button texts, the pagination
// summary) and how they write numbers. The ui kit knows nothing about the app's languages: the app passes these, translated, to
// <UiProvider texts={...}>; without it (tests, another app) the English defaults below apply.
export const DEFAULT_UI_TEXTS = {
    loading: 'Loading',
    confirm: 'Confirm',
    cancel: 'Cancel',
    showPassword: 'Show password',
    hidePassword: 'Hide password',
    emptyTable: 'Nothing here yet',
    // Numbers the components show (page buttons), in the language's digits
    formatNumber: (number) => String(number),
    pagination: {
        label: 'Pagination',
        previous: 'Previous page',
        next: 'Next page',
        page: (page) => `Page ${page}`,
        summary: ({ count, total, page, pages }) => `Showing ${count} / ${total} (Page ${page} of ${pages})`,
    },
};

// Partial texts on top of the defaults (one level deep, for pagination)
export const mergeUiTexts = (texts = {}) => ({
    ...DEFAULT_UI_TEXTS,
    ...texts,
    pagination: { ...DEFAULT_UI_TEXTS.pagination, ...texts.pagination },
});

export const UiTextsContext = createContext(DEFAULT_UI_TEXTS);

export const useUiTexts = () => useContext(UiTextsContext);

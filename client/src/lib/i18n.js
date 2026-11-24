import en from '@/locales/en.json';

// The app's languages. Texts live in src/locales/<code>.json (same keys in every file); English is bundled and is
// the fallback for a missing key, every other language downloads the first time it is used.
// The choice is remembered in localStorage, and <html lang dir> is set from it. index.html runs the same steps
// before the app loads, so the page never flashes the wrong direction; keep the two in sync (STORAGE_KEY, the
// detection order and the languages).
// A new language: add <code>.json, an entry here and in index.html.
// name: in its own language (shown in the switch); dir: text direction; locale: for dates and numbers
// ('ar-u-nu-arab': Arabic-Indic digits ٠-٩, also used inside ar.json; 'ar-u-nu-latn' would write 0-9).
export const LANGUAGES = {
    en: { name: 'English', dir: 'ltr', locale: 'en' },
    ar: { name: 'العربية', dir: 'rtl', locale: 'ar-u-nu-arab' },
};
export const DEFAULT_LANGUAGE = 'en';
export const STORAGE_KEY = 'language';

const loaders = {
    ar: () => import('@/locales/ar.json'),
};
const catalogs = { en };
let current = DEFAULT_LANGUAGE;

const isSupported = (language) => Object.hasOwn(LANGUAGES, language);

// The saved choice; otherwise the first of the browser's languages the app has; otherwise English.
// localStorage can be unavailable (private mode, blocked storage): the choice then just isn't remembered.
export const readPreference = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (isSupported(stored)) {
            return stored;
        }
    } catch {
        // fall through to the browser's languages
    }
    const browserLanguages = navigator.languages?.length ? navigator.languages : [navigator.language];
    const match = browserLanguages.map((tag) => tag?.split('-')[0].toLowerCase()).find(isSupported);
    return match ?? DEFAULT_LANGUAGE;
};

export const savePreference = (language) => {
    try {
        localStorage.setItem(STORAGE_KEY, language);
    } catch {
        // not remembered, still applied
    }
};

export const isLoaded = (language) => Boolean(catalogs[language]);

// Downloads a language's texts (once); English is always there
export const loadLanguage = async (language) => {
    if (!isLoaded(language)) {
        catalogs[language] = (await loaders[language]()).default;
    }
};

// Makes a loaded language the current one: t() uses it, <html> gets its lang and dir, requests ask the server
// for it (Accept-Language, lib/axiosInstance.js)
export const setCurrentLanguage = (language) => {
    current = isSupported(language) && isLoaded(language) ? language : DEFAULT_LANGUAGE;
    document.documentElement.lang = current;
    document.documentElement.dir = LANGUAGES[current].dir;
};

export const getLanguage = () => current;

const lookup = (messages, key) => key.split('.').reduce((node, part) => node?.[part], messages);

// Numbers in a text are written the language's way (its locale)
const formatValue = (language, value) => (typeof value === 'number' ? new Intl.NumberFormat(LANGUAGES[language].locale).format(value) : value);

// A text with {name} placeholders filled in. A text that depends on a count is an object of plural forms
// ({ "one": "...", "other": "..." }; Arabic also has zero, two, few and many): values.count picks the form.
// A key missing in a language falls back to English, then to the key itself (so a gap shows, never crashes).
export const translate = (language, key, values = {}) => {
    let text = lookup(catalogs[language], key) ?? lookup(catalogs[DEFAULT_LANGUAGE], key);
    if (text && typeof text === 'object' && typeof values.count === 'number') {
        text = text[new Intl.PluralRules(language).select(values.count)] ?? text.other;
    }
    if (typeof text !== 'string') {
        return key;
    }
    return text.replace(/\{(\w+)\}/g, (match, name) => (name in values ? formatValue(language, values[name]) : match));
};

// t() in the current language, for code outside React (validation messages, API errors, toasts in hooks).
// Components use t from useLanguage(), which also re-renders them when the language changes.
export const t = (key, values) => translate(current, key, values);

// Dates and numbers in the current language
export const formatDate = (value, options = { dateStyle: 'medium' }) =>
    new Intl.DateTimeFormat(LANGUAGES[current].locale, options).format(new Date(value));

export const formatNumber = (value) => new Intl.NumberFormat(LANGUAGES[current].locale).format(value);

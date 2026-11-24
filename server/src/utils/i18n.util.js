const en = require('../locales/en.json');
const ar = require('../locales/ar.json');

// Texts the server sends to people (response messages, validation messages, emails, PDFs) live in
// src/locales/<code>.json, the same keys in every file. Code uses keys ('auth.invalidCredentials'); the request's
// language (Accept-Language, src/middlewares/language.middleware.js) decides which text is sent.
// Logs stay in English (and show the key), they are for developers.
// A new language: add <code>.json and an entry here (and the client's languages: client/src/lib/i18n.js).
const CATALOGS = { en, ar };
const DIRECTIONS = { en: 'ltr', ar: 'rtl' };
// For numbers in texts: Arabic writes Arabic-Indic digits (٠-٩), like the client (client/src/lib/i18n.js)
const LOCALES = { en: 'en', ar: 'ar-u-nu-arab' };
const DEFAULT_LANGUAGE = 'en';
const SUPPORTED_LANGUAGES = Object.keys(CATALOGS);

const lookup = (catalog, key) => (typeof key === 'string'
    ? key.split('.').reduce((node, part) => node?.[part], catalog)
    : undefined);

const isTranslationKey = (key) => typeof lookup(CATALOGS[DEFAULT_LANGUAGE], key) === 'string';

// The best language for an Accept-Language header ("ar-SA,ar;q=0.9,en;q=0.8"): the supported one with the
// highest q value, by its base ("ar-SA" counts as "ar"); English when none is supported or there is no header
const pickLanguage = (header) => {
    if (typeof header !== 'string' || !header) {
        return DEFAULT_LANGUAGE;
    }
    const candidates = header.split(',')
        .map((part, index) => {
            const [tag, ...params] = part.trim().split(';');
            const qParam = params.map((param) => param.trim()).find((param) => param.startsWith('q='));
            const q = qParam ? Number(qParam.slice(2)) : 1;
            return { language: tag.split('-')[0].toLowerCase(), q: Number.isFinite(q) ? q : 0, index };
        })
        .filter(({ language, q }) => q > 0 && SUPPORTED_LANGUAGES.includes(language))
        .sort((a, b) => b.q - a.q || a.index - b.index);
    return candidates[0]?.language ?? DEFAULT_LANGUAGE;
};

// The text for a key in a language, with {name} placeholders filled from values. A key missing in that language
// falls back to English; something that is not a key (a message from a library) is returned unchanged.
const translate = (language, key, values = {}) => {
    const text = lookup(CATALOGS[language], key) ?? lookup(CATALOGS[DEFAULT_LANGUAGE], key);
    if (typeof text !== 'string') {
        return key;
    }
    const locale = LOCALES[language] ?? LOCALES[DEFAULT_LANGUAGE];
    const format = (value) => (typeof value === 'number' ? new Intl.NumberFormat(locale).format(value) : String(value));
    return text.replace(/\{(\w+)\}/g, (match, name) => (values[name] === undefined ? match : format(values[name])));
};

const directionOf = (language) => DIRECTIONS[language] ?? 'ltr';

module.exports = {
    DEFAULT_LANGUAGE,
    SUPPORTED_LANGUAGES,
    pickLanguage,
    translate,
    isTranslationKey,
    directionOf,
};

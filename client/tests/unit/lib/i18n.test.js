import en from '@/locales/en.json';
import ar from '@/locales/ar.json';
import {
    DEFAULT_LANGUAGE, LANGUAGES, formatDate, getLanguage, isLoaded, loadLanguage, readPreference, savePreference,
    setCurrentLanguage, t, translate,
} from '@/lib/i18n';

// Every text as [key, text]; a text with plural forms counts as one entry per form
const flatten = (node, prefix = '') => Object.entries(node).flatMap(([key, value]) => (
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : flatten(value, `${prefix}${key}.`)
));
const placeholdersByKey = (catalog) => Object.fromEntries(flatten(catalog).map(([key, text]) => [key, (text.match(/\{\w+\}/g) ?? []).sort()]));

const setBrowserLanguages = (languages) => {
    Object.defineProperty(navigator, 'languages', { value: languages, configurable: true });
};

afterEach(() => {
    setBrowserLanguages(['en-US', 'en']);
});

describe('locales (src/locales/*.json)', () => {
    test('Arabic has exactly the keys English has: a missing text fails here, not in front of a user', () => {
        expect(flatten(ar).map(([key]) => key).sort()).toEqual(flatten(en).map(([key]) => key).sort());
    });

    test('each Arabic text has the same {placeholders} as the English one', () => {
        expect(placeholdersByKey(ar)).toEqual(placeholdersByKey(en));
    });

    test('no text is empty', () => {
        expect([...flatten(en), ...flatten(ar)].filter(([, text]) => !text.trim()).map(([key]) => key)).toEqual([]);
    });
});

describe('i18n translate', () => {
    beforeAll(() => loadLanguage('ar'));

    test('a key in English and in Arabic, with placeholders filled', () => {
        expect(translate('en', 'dashboard.welcome', { name: 'Ada' })).toBe('Welcome, Ada');
        expect(translate('ar', 'dashboard.welcome', { name: 'Ada' })).toBe('مرحبًا، Ada');
    });

    test('numbers are written with the language\'s locale (Arabic-Indic digits in Arabic)', () => {
        expect(translate('en', 'ui.pagination.summary', { count: 20, total: 1250, page: 1, pages: 63 }))
            .toBe('Showing 20 / 1,250 (Page 1 of 63)');
        expect(translate('ar', 'ui.pagination.page', { page: 12 })).toBe('الصفحة ١٢');
    });

    test('a text with plural forms picks the form for the count (Arabic has six)', async () => {
        // A catalog with plural forms, as a project would add them
        const forms = { zero: 'لا ملفات', one: 'ملف واحد', two: 'ملفان', few: '{count} ملفات', many: '{count} ملفًا', other: '{count} ملف' };
        const english = { one: '{count} file', other: '{count} files' };
        ar.test = { files: forms };
        en.test = { files: english };
        try {
            expect(translate('en', 'test.files', { count: 1 })).toBe('1 file');
            expect(translate('en', 'test.files', { count: 3 })).toBe('3 files');
            expect([0, 1, 2, 3, 11, 100].map((count) => translate('ar', 'test.files', { count })))
                .toEqual(['لا ملفات', 'ملف واحد', 'ملفان', '٣ ملفات', '١١ ملفًا', '١٠٠ ملف']);
        } finally {
            delete ar.test;
            delete en.test;
        }
    });

    test('a missing key falls back to English, then to the key itself', () => {
        en.onlyEnglish = 'Only in English';
        try {
            expect(translate('ar', 'onlyEnglish')).toBe('Only in English');
        } finally {
            delete en.onlyEnglish;
        }
        expect(translate('ar', 'no.such.key')).toBe('no.such.key');
    });
});

describe('i18n preference and current language', () => {
    test('the saved choice wins', () => {
        savePreference('ar');
        setBrowserLanguages(['en-US']);

        expect(readPreference()).toBe('ar');
    });

    test('without one: the first of the browser\'s languages the app has, otherwise English', () => {
        setBrowserLanguages(['fr-FR', 'ar-SA', 'en']);
        expect(readPreference()).toBe('ar');

        setBrowserLanguages(['fr-FR', 'de']);
        expect(readPreference()).toBe(DEFAULT_LANGUAGE);
    });

    test('a saved value that is not a language is ignored', () => {
        localStorage.setItem('language', 'klingon');

        expect(readPreference()).toBe('en');
    });

    test('setCurrentLanguage sets <html lang dir> and what t() uses; only loaded languages', async () => {
        await loadLanguage('ar');
        setCurrentLanguage('ar');

        expect(getLanguage()).toBe('ar');
        expect(document.documentElement.lang).toBe('ar');
        expect(document.documentElement.dir).toBe('rtl');
        expect(t('nav.users')).toBe('المستخدمون');
        expect(formatDate('2026-01-05T00:00:00.000Z', { dateStyle: 'medium', timeZone: 'UTC' })).toMatch(/٥.*٢٠٢٦/);

        setCurrentLanguage('en');
        expect(document.documentElement.dir).toBe('ltr');
        expect(t('nav.users')).toBe('Users');
    });

    test('every language says its direction and locale; English is always loaded', () => {
        expect(isLoaded('en')).toBe(true);
        for (const { dir, locale } of Object.values(LANGUAGES)) {
            expect(['ltr', 'rtl']).toContain(dir);
            expect(() => new Intl.NumberFormat(locale)).not.toThrow();
        }
    });
});

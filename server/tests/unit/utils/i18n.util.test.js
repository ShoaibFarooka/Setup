const en = require('../../../src/locales/en.json');
const ar = require('../../../src/locales/ar.json');
const { pickLanguage, translate, isTranslationKey, directionOf } = require('../../../src/utils/i18n.util');

// Every text as { 'auth.invalidCredentials': '...' }
const flatten = (node, prefix = '') => Object.entries(node).flatMap(([key, value]) => (
    typeof value === 'string' ? [[`${prefix}${key}`, value]] : flatten(value, `${prefix}${key}.`)
));
const placeholders = (text) => (text.match(/\{\w+\}/g) ?? []).sort();

describe('locales (src/locales/*.json)', () => {
    test('Arabic has exactly the keys English has: a missing text fails here, not in front of a user', () => {
        expect(flatten(ar).map(([key]) => key).sort()).toEqual(flatten(en).map(([key]) => key).sort());
    });

    test('each Arabic text has the same {placeholders} as the English one', () => {
        // Compared as { key: placeholders } maps, so a difference names its key
        const placeholdersByKey = (catalog) => Object.fromEntries(flatten(catalog).map(([key, text]) => [key, placeholders(text)]));

        expect(placeholdersByKey(ar)).toEqual(placeholdersByKey(en));
    });

    test('no text is empty', () => {
        const empty = [...flatten(en), ...flatten(ar)].filter(([, text]) => !text.trim()).map(([key]) => key);

        expect(empty).toEqual([]);
    });
});

describe('i18n.util pickLanguage (Accept-Language)', () => {
    test.each([
        [undefined, 'en'],
        ['', 'en'],
        ['ar', 'ar'],
        ['ar-SA', 'ar'],
        ['AR', 'ar'],
        ['fr-FR,fr;q=0.9', 'en'],
        ['fr,ar;q=0.8,en;q=0.5', 'ar'],
        ['en;q=0.4,ar;q=0.9', 'ar'],
        ['ar;q=0,en', 'en'],
        ['*', 'en'],
        ['ar;q=abc,en;q=0.5', 'en'],
    ])('%j -> %s', (header, language) => {
        expect(pickLanguage(header)).toBe(language);
    });

    test('equal q values keep the header\'s order', () => {
        expect(pickLanguage('en,ar')).toBe('en');
        expect(pickLanguage('ar,en')).toBe('ar');
    });
});

describe('i18n.util translate', () => {
    test('a key in English and in Arabic', () => {
        expect(translate('en', 'auth.invalidCredentials')).toBe('Invalid credentials!');
        expect(translate('ar', 'auth.invalidCredentials')).toBe('بيانات الدخول غير صحيحة!');
    });

    test('fills {placeholders}; a missing value leaves the placeholder', () => {
        expect(translate('en', 'validation.limitMax', { max: 100 })).toBe('limit must be at most 100');
        // Numbers in Arabic texts are written in Arabic-Indic digits
        expect(translate('ar', 'validation.limitMax', { max: 100 })).toBe('يجب ألا يزيد عدد العناصر عن ١٠٠');
        expect(translate('en', 'validation.limitMax')).toBe('limit must be at most {max}');
    });

    test('an unknown language falls back to English; a message that is not a key is returned as it is', () => {
        expect(translate('fr', 'auth.invalidCredentials')).toBe('Invalid credentials!');
        expect(translate('ar', 'File too large')).toBe('File too large');
        expect(translate('ar', undefined)).toBeUndefined();
    });

    test('isTranslationKey: only keys that lead to a text', () => {
        expect(isTranslationKey('auth.invalidCredentials')).toBe(true);
        expect(isTranslationKey('auth')).toBe(false);
        expect(isTranslationKey('Invalid credentials!')).toBe(false);
    });

    test('directionOf: Arabic is right-to-left', () => {
        expect(directionOf('ar')).toBe('rtl');
        expect(directionOf('en')).toBe('ltr');
        expect(directionOf('xx')).toBe('ltr');
    });
});

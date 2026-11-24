import { useEffect, useMemo, useState } from 'react';
import { LanguageContext } from './languageContext';
import {
    DEFAULT_LANGUAGE, LANGUAGES, formatDate, formatNumber, isLoaded, loadLanguage, readPreference, savePreference,
    setCurrentLanguage, translate,
} from '@/lib/i18n';

// The language for React: { language, dir, languages, setLanguage, t, formatDate, formatNumber }.
// Changing it downloads the language's texts (the first time), then switches every text, the direction (<html dir>)
// and the language requests ask the server for, and remembers the choice.
// A language that is not English is downloaded before the first render; nothing is shown meanwhile (a moment,
// and index.html has already set the right direction), so the page never flashes English first.
const LanguageProvider = ({ children }) => {
    const [language, setLanguageState] = useState(() => {
        const preferred = readPreference();
        // Not loaded yet: <html> keeps what index.html set until the texts are there (effect below)
        if (isLoaded(preferred)) {
            setCurrentLanguage(preferred);
        }
        return preferred;
    });
    const [ready, setReady] = useState(() => isLoaded(language));

    useEffect(() => {
        if (ready) {
            return;
        }
        // If the texts cannot be downloaded (offline), the app opens in English
        loadLanguage(language)
            .then(() => setCurrentLanguage(language))
            .catch(() => {
                setCurrentLanguage(DEFAULT_LANGUAGE);
                setLanguageState(DEFAULT_LANGUAGE);
            })
            .finally(() => setReady(true));
    }, [language, ready]);

    const value = useMemo(() => ({
        language,
        dir: LANGUAGES[language].dir,
        languages: LANGUAGES,
        // Resolves when the new language is shown; rejects (and keeps the current one) if it cannot be downloaded
        setLanguage: async (next) => {
            await loadLanguage(next);
            savePreference(next);
            setCurrentLanguage(next);
            setLanguageState(next);
        },
        t: (key, values) => translate(language, key, values),
        // Recreated per language, so components re-render with the new format
        formatDate: (date, options) => formatDate(date, options),
        formatNumber: (number) => formatNumber(number),
    }), [language]);

    if (!ready) {
        return null;
    }

    return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export default LanguageProvider;

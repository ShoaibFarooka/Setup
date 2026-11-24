import { useContext } from 'react';
import { LanguageContext } from '@/contexts/languageContext';

// { language, dir, languages, setLanguage, t, formatDate, formatNumber } from LanguageProvider.
// t('users.title'), t('dashboard.welcome', { name }); every visible text comes from src/locales/*.json.
const useLanguage = () => {
    const context = useContext(LanguageContext);
    if (!context) {
        throw new Error('useLanguage must be used inside LanguageProvider');
    }
    return context;
};

export default useLanguage;

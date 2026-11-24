import { FiCheck, FiGlobe } from 'react-icons/fi';
import styles from './LanguageSwitch.module.css';
import { DropdownMenu, IconButton, toast } from '@/components/ui';
import useLanguage from '@/hooks/useLanguage';

// A globe button that opens the list of languages, each written in itself (so anyone can find their own).
// Sits next to ThemeToggle: the sidebar footer and the auth pages' top bar.
// variant: an IconButton variant, e.g. 'ghostInverse' on a brand-coloured area
const LanguageSwitch = ({ variant, className }) => {
    const { language, languages, setLanguage, t } = useLanguage();

    const items = Object.entries(languages).map(([code, { name }]) => ({
        key: code,
        // lang on each name, so screen readers pronounce it in its own language
        label: <span lang={code}>{name}</span>,
        icon: code === language ? <FiCheck aria-hidden="true" /> : <span className={styles.noCheck} aria-hidden="true" />,
        onClick: () => code !== language && setLanguage(code).catch(() => toast.error(t('errors.network'))),
    }));

    return (
        <DropdownMenu items={items}>
            <IconButton
                label={t('language.menu', { current: languages[language].name })}
                icon={<FiGlobe size={18} />}
                variant={variant}
                className={className}
            />
        </DropdownMenu>
    );
};

export default LanguageSwitch;

import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';
import styles from './ThemeToggle.module.css';
import { IconButton } from '@/components/ui';
import useTheme from '@/hooks/useTheme';
import useLanguage from '@/hooks/useLanguage';
import { nextPreference } from '@/lib/theme';

const ICONS = {
    light: <FiSun size={18} />,
    dark: <FiMoon size={18} />,
    system: <FiMonitor size={18} />,
};

// Cycles the theme light → dark → system. The icon shows the current choice; the name says what a click does.
// variant: an IconButton variant, e.g. 'ghostInverse' on a brand-coloured area
const ThemeToggle = ({ variant, className }) => {
    const { preference, setPreference } = useTheme();
    const { language, t } = useLanguage();
    const next = nextPreference(preference);

    return (
        <IconButton
            label={t('theme.toggle', { current: t(`theme.${preference}`), next: t(`theme.${next}`).toLocaleLowerCase(language) })}
            // The key remounts the icon on each change, which replays its entry animation
            icon={<span key={preference} className={styles.icon}>{ICONS[preference]}</span>}
            variant={variant}
            className={className}
            onClick={() => setPreference(next)}
        />
    );
};

export default ThemeToggle;

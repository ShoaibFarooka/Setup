import { useState } from 'react';
import clsx from 'clsx';
import { FiMonitor, FiMoon, FiSun } from 'react-icons/fi';
import styles from './ThemeToggle.module.css';
import { IconButton } from '@/components/ui';
import useTheme from '@/hooks/useTheme';
import { nextPreference } from '@/lib/theme';

const OPTIONS = {
    light: { label: 'Light', icon: <FiSun size={18} /> },
    dark: { label: 'Dark', icon: <FiMoon size={18} /> },
    system: { label: 'System', icon: <FiMonitor size={18} /> },
};

// Cycles the theme light → dark → system. The icon shows the current choice; the name says what a click does.
// variant: an IconButton variant, e.g. 'ghostInverse' on a brand-coloured area
const ThemeToggle = ({ variant, className }) => {
    const { preference, setPreference } = useTheme();
    const next = nextPreference(preference);
    // The icon turns into place only after a click, never when a page appears (it would play on every page load)
    const [switched, setSwitched] = useState(false);

    return (
        <IconButton
            label={`Theme: ${OPTIONS[preference].label}. Switch to ${OPTIONS[next].label.toLowerCase()}`}
            // The key remounts the icon on each change, which replays its entry animation
            icon={<span key={preference} className={clsx(styles.icon, switched && styles.turnIn)}>{OPTIONS[preference].icon}</span>}
            variant={variant}
            className={className}
            onClick={() => {
                setSwitched(true);
                setPreference(next);
            }}
        />
    );
};

export default ThemeToggle;

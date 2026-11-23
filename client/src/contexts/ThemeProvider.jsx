import { useEffect, useMemo, useRef, useState } from 'react';
import { ThemeContext } from './themeContext';
import { applyTheme, readPreference, resolveTheme, savePreference, watchSystemTheme } from '@/lib/theme';

// The colour theme for React: preference is the user's choice ('light' | 'dark' | 'system'),
// theme is the one in use ('light' | 'dark'). Changing it updates <html data-theme> and remembers the choice.
// data-theme is set before React re-renders, so components reading the CSS variables (the Ant Design theme)
// already see the new values.
const ThemeProvider = ({ children }) => {
    const [preference, setPreferenceState] = useState(readPreference);
    const [theme, setTheme] = useState(() => {
        const initial = resolveTheme(readPreference());
        applyTheme(initial);
        return initial;
    });
    // Read by the system-theme listener, which is registered once
    const preferenceRef = useRef(preference);

    // A switch (by the user or the system) fades the colours over
    const show = (next) => {
        applyTheme(next, { animate: true });
        setTheme(next);
    };

    // Follow the system setting while it changes (e.g. the OS switching to dark at night)
    useEffect(() => watchSystemTheme(() => {
        if (preferenceRef.current === 'system') {
            show(resolveTheme('system'));
        }
    }), []);

    const value = useMemo(() => ({
        preference,
        theme,
        setPreference: (next) => {
            preferenceRef.current = next;
            savePreference(next);
            setPreferenceState(next);
            show(resolveTheme(next));
        },
    }), [preference, theme]);

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export default ThemeProvider;

// The colour theme: the user's choice ('light' | 'dark' | 'system') is remembered in localStorage,
// and the theme in use ('light' | 'dark') is set as data-theme on <html>, where theme.css picks it up.
// index.html runs the same steps before the app loads, so the page never flashes the wrong theme;
// keep the two in sync (STORAGE_KEY and the resolving logic).

export const STORAGE_KEY = 'theme';
export const THEME_PREFERENCES = ['light', 'dark', 'system'];

const darkQuery = () => window.matchMedia('(prefers-color-scheme: dark)');

// localStorage can be unavailable (private mode, blocked storage): the theme then just isn't remembered
export const readPreference = () => {
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        return THEME_PREFERENCES.includes(stored) ? stored : 'system';
    } catch {
        return 'system';
    }
};

export const savePreference = (preference) => {
    try {
        localStorage.setItem(STORAGE_KEY, preference);
    } catch {
        // not remembered, still applied
    }
};

export const resolveTheme = (preference) => {
    if (preference === 'system') {
        return darkQuery().matches ? 'dark' : 'light';
    }
    return preference;
};

// How long the colours fade when the theme switches (matches --duration-base in theme.css)
export const THEME_FADE_MS = 250;
let fadeTimer;

// animate: fade the colours over (on a switch, never on page load); base.css styles the theme-transition class
export const applyTheme = (theme, { animate = false } = {}) => {
    const html = document.documentElement;
    if (animate) {
        html.classList.add('theme-transition');
        clearTimeout(fadeTimer);
        fadeTimer = setTimeout(() => html.classList.remove('theme-transition'), THEME_FADE_MS);
    }
    html.dataset.theme = theme;
};

// Calls onChange when the system switches between light and dark; returns the unsubscribe function
export const watchSystemTheme = (onChange) => {
    const query = darkQuery();
    query.addEventListener('change', onChange);
    return () => query.removeEventListener('change', onChange);
};

// The next choice for the toggle button: light → dark → system → light
export const nextPreference = (preference) =>
    THEME_PREFERENCES[(THEME_PREFERENCES.indexOf(preference) + 1) % THEME_PREFERENCES.length];

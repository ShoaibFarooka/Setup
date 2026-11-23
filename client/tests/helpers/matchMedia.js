// A controllable stand-in for the system's light / dark setting: fakeSystemTheme('dark') makes
// prefers-color-scheme: dark match, and changeSystemTheme('light') later fires the change event like the OS would.
let listeners = [];
let systemDark = false;

export const fakeSystemTheme = (theme) => {
    systemDark = theme === 'dark';
    listeners = [];
    vi.spyOn(window, 'matchMedia').mockImplementation((query) => ({
        get matches() {
            return query === '(prefers-color-scheme: dark)' ? systemDark : false;
        },
        media: query,
        addEventListener: (_event, listener) => listeners.push(listener),
        removeEventListener: (_event, listener) => {
            listeners = listeners.filter((other) => other !== listener);
        },
    }));
};

export const changeSystemTheme = (theme) => {
    systemDark = theme === 'dark';
    listeners.forEach((listener) => listener());
};

export const systemThemeListenerCount = () => listeners.length;

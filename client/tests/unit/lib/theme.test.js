import { applyTheme, nextPreference, readPreference, resolveTheme, savePreference, STORAGE_KEY, THEME_FADE_MS, watchSystemTheme } from '@/lib/theme';
import { changeSystemTheme, fakeSystemTheme, systemThemeListenerCount } from '../../helpers/matchMedia';

describe('theme', () => {
    afterEach(() => vi.restoreAllMocks());

    test('without a remembered choice the preference is the system setting', () => {
        expect(readPreference()).toBe('system');
    });

    test('a remembered choice is read back', () => {
        savePreference('dark');

        expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');
        expect(readPreference()).toBe('dark');
    });

    test('an unknown remembered value counts as the system setting', () => {
        localStorage.setItem(STORAGE_KEY, 'purple');

        expect(readPreference()).toBe('system');
    });

    test('blocked storage does not break anything: the choice is just not remembered', () => {
        vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
            throw new Error('blocked');
        });
        vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
            throw new Error('blocked');
        });

        expect(() => savePreference('dark')).not.toThrow();
        expect(readPreference()).toBe('system');
    });

    test('light and dark are used as chosen; system follows the system setting', () => {
        fakeSystemTheme('dark');

        expect(resolveTheme('light')).toBe('light');
        expect(resolveTheme('dark')).toBe('dark');
        expect(resolveTheme('system')).toBe('dark');
    });

    test('the theme in use is set on <html>, where theme.css picks it up', () => {
        applyTheme('dark');

        expect(document.documentElement).toHaveAttribute('data-theme', 'dark');
    });

    test('a switch fades the colours over for a moment', () => {
        vi.useFakeTimers();
        try {
            applyTheme('dark', { animate: true });
            expect(document.documentElement).toHaveClass('theme-transition');

            vi.advanceTimersByTime(THEME_FADE_MS);
            expect(document.documentElement).not.toHaveClass('theme-transition');
        } finally {
            vi.useRealTimers();
        }
    });

    test('applying the theme on page load does not fade', () => {
        applyTheme('dark');

        expect(document.documentElement).not.toHaveClass('theme-transition');
    });

    test('a change of the system setting is reported until unsubscribed', () => {
        fakeSystemTheme('light');
        const onChange = vi.fn();

        const unsubscribe = watchSystemTheme(onChange);
        changeSystemTheme('dark');
        unsubscribe();

        expect(onChange).toHaveBeenCalledTimes(1);
        expect(systemThemeListenerCount()).toBe(0);
    });

    test('the toggle goes light → dark → system → light', () => {
        expect(nextPreference('light')).toBe('dark');
        expect(nextPreference('dark')).toBe('system');
        expect(nextPreference('system')).toBe('light');
    });
});

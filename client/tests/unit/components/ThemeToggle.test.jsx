import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeProvider from '@/contexts/ThemeProvider';
import LanguageProvider from '@/contexts/LanguageProvider';
import ThemeToggle from '@/components/ThemeToggle/ThemeToggle';
import toggleStyles from '@/components/ThemeToggle/ThemeToggle.module.css';
import useTheme from '@/hooks/useTheme';
import { STORAGE_KEY } from '@/lib/theme';
import { changeSystemTheme, fakeSystemTheme } from '../../helpers/matchMedia';

const html = document.documentElement;

const renderToggle = () => {
    render(<ThemeProvider><LanguageProvider><ThemeToggle /></LanguageProvider></ThemeProvider>);
    return userEvent.setup();
};

describe('theme toggle', () => {
    beforeEach(() => fakeSystemTheme('light'));
    afterEach(() => vi.restoreAllMocks());

    test('starts from the system setting', () => {
        fakeSystemTheme('dark');
        renderToggle();

        expect(screen.getByRole('button', { name: 'Theme: System. Switch to light' })).toBeInTheDocument();
        expect(html).toHaveAttribute('data-theme', 'dark');
    });

    test('the icon turns into place after a click, not when the page appears', async () => {
        const user = renderToggle();
        const icon = () => screen.getByRole('button', { name: /^Theme:/ }).querySelector('span');
        expect(icon()).not.toHaveClass(toggleStyles.turnIn);

        await user.click(screen.getByRole('button', { name: /^Theme:/ }));

        expect(icon()).toHaveClass(toggleStyles.turnIn);
    });

    test('cycles light → dark → system, applying and remembering each choice', async () => {
        const user = renderToggle();

        await user.click(screen.getByRole('button', { name: /Switch to light/ }));
        expect(html).toHaveAttribute('data-theme', 'light');
        expect(localStorage.getItem(STORAGE_KEY)).toBe('light');

        await user.click(screen.getByRole('button', { name: 'Theme: Light. Switch to dark' }));
        expect(html).toHaveAttribute('data-theme', 'dark');
        expect(localStorage.getItem(STORAGE_KEY)).toBe('dark');

        await user.click(screen.getByRole('button', { name: 'Theme: Dark. Switch to system' }));
        expect(html).toHaveAttribute('data-theme', 'light');
        expect(localStorage.getItem(STORAGE_KEY)).toBe('system');
    });

    test('a remembered choice is used on the next visit', () => {
        localStorage.setItem(STORAGE_KEY, 'dark');
        renderToggle();

        expect(html).toHaveAttribute('data-theme', 'dark');
        expect(screen.getByRole('button', { name: 'Theme: Dark. Switch to system' })).toBeInTheDocument();
    });

    test('on "system" it follows the system switching between light and dark', () => {
        renderToggle();

        changeSystemTheme('dark');

        expect(html).toHaveAttribute('data-theme', 'dark');
    });

    test('a chosen theme ignores the system switching', async () => {
        const user = renderToggle();
        await user.click(screen.getByRole('button', { name: /Switch to light/ }));

        changeSystemTheme('dark');

        expect(html).toHaveAttribute('data-theme', 'light');
    });

    test('useTheme outside ThemeProvider is a mistake that fails loudly', () => {
        vi.spyOn(console, 'error').mockImplementation(() => {});
        const Orphan = () => useTheme().theme;

        expect(() => render(<Orphan />)).toThrow('useTheme must be used inside ThemeProvider');
    });
});

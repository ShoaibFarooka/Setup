import AxeBuilder from '@axe-core/playwright';
import { THEMES, accounts, expect, pageReady, test, useLanguage } from './fixtures';

// Automatic accessibility checks (axe) of every page in both themes and both languages: contrast, labels, roles,
// landmarks, ... Serious and critical problems fail the test; the message lists each problem and where it is.
// ar: the page in Arabic (right to left): its heading, and the text that shows its data has loaded
const PAGES = [
    { name: 'login', path: '/login', heading: 'Log into your Account', loggedIn: false, ar: { heading: 'تسجيل الدخول إلى حسابك' } },
    { name: 'forgot-password', path: '/forgot-password', heading: 'Reset your password', loggedIn: false, ar: { heading: 'إعادة تعيين كلمة المرور' } },
    // Any token shows the form; it is only checked when the form is sent
    { name: 'reset-password', path: `/reset-password?token=${'a'.repeat(64)}`, heading: 'Set a new password', loggedIn: false, ar: { heading: 'تعيين كلمة مرور جديدة' } },
    { name: '404', path: '/this-page-does-not-exist', heading: 'Page not found', loggedIn: false, ar: { heading: 'الصفحة غير موجودة' } },
    { name: 'dashboard', path: '/dashboard', heading: 'Dashboard', loggedIn: true, ar: { heading: 'لوحة التحكم' } },
    { name: 'profile', path: '/profile', heading: 'Profile', loggedIn: true, ar: { heading: 'الملف الشخصي' } },
    { name: 'users', path: '/users', heading: 'Users', loggedIn: true, account: 'admin', waitFor: 'Showing 20 / 28 (Page 1 of 2)', ar: { heading: 'المستخدمون', waitFor: 'عرض ٢٠ من ٢٨ (الصفحة ١ من ٢)' } },
];

const describeViolations = (violations) => violations
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.help}\n${violation.nodes.map((node) => `  - ${node.target.join(' ')}`).join('\n')}`)
    .join('\n');

for (const language of ['en', 'ar']) {
    for (const theme of THEMES) {
        for (const { name, path, loggedIn, account, ...texts } of PAGES) {
            const { heading, waitFor } = language === 'ar' ? texts.ar : texts;
            const label = language === 'ar' ? `${theme}, Arabic` : theme;

            test(`${name} page has no serious accessibility problems (${label})`, async ({ page, loginAs }) => {
                await page.emulateMedia({ colorScheme: theme });
                if (language !== 'en') {
                    await useLanguage(page, language);
                }
                if (loggedIn) {
                    await loginAs(account ? accounts[account] : undefined);
                }
                await page.goto(path);
                await pageReady(page, heading);
                if (waitFor) {
                    await expect(page.getByText(waitFor)).toBeVisible();
                }

                const { violations } = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
                const serious = violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));

                expect(serious, describeViolations(serious)).toEqual([]);
            });
        }
    }
}

for (const theme of THEMES) {
    test(`the edit profile dialog has no serious accessibility problems (${theme})`, async ({ page, loginAs }) => {
        await page.emulateMedia({ colorScheme: theme });
        await loginAs();
        await page.goto('/profile');
        await pageReady(page, 'Profile');
        await page.getByRole('button', { name: 'Edit' }).click();
        await expect(page.getByRole('dialog', { name: 'Edit profile' })).toBeVisible();

        const { violations } = await new AxeBuilder({ page }).include('.ant-modal').withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']).analyze();
        const serious = violations.filter((violation) => ['serious', 'critical'].includes(violation.impact));

        expect(serious, describeViolations(serious)).toEqual([]);
    });
}

// Focus after opening the app: / redirects, and a redirect moves focus like any page change
const focusState = (page) => page.evaluate(() => {
    const element = document.activeElement;
    const style = getComputedStyle(element);
    // A focus ring is an outline (base.css) or a box-shadow ring (ui controls)
    const ring = style.outlineStyle !== 'none' || style.boxShadow !== 'none';
    return { tag: element.tagName, label: element.labels?.[0]?.textContent ?? null, ring };
});

test('opening the app logged out: the cursor is in the email field', async ({ page }) => {
    await page.goto('/');
    await pageReady(page, 'Log into your Account');

    await expect.poll(() => focusState(page)).toMatchObject({ tag: 'INPUT', label: 'Email or Username' });
});

test('opening the app logged in: focus is on the heading for screen readers, without a focus ring', async ({ page, loginAs }) => {
    await loginAs();
    await page.goto('/');
    await pageReady(page, 'Dashboard');

    await expect.poll(() => focusState(page)).toEqual({ tag: 'H1', label: null, ring: false });
});

test('keyboard users still get a focus ring on controls', async ({ page }) => {
    await page.goto('/login');
    await pageReady(page, 'Log into your Account');

    await page.keyboard.press('Tab');

    const state = await focusState(page);
    expect(state.tag).not.toBe('H1');
    expect(state.ring, `a focus ring on the ${state.tag} reached with Tab`).toBe(true);
});

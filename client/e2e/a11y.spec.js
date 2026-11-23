import AxeBuilder from '@axe-core/playwright';
import { THEMES, accounts, expect, pageReady, test } from './fixtures';

// Automatic accessibility checks (axe) of every page in both themes: contrast, labels, roles, landmarks, ...
// Serious and critical problems fail the test; the message lists each problem and where it is.
const PAGES = [
    { name: 'login', path: '/login', heading: 'Log into your Account', loggedIn: false },
    { name: 'forgot-password', path: '/forgot-password', heading: 'Reset your password', loggedIn: false },
    // Any token shows the form; it is only checked when the form is sent
    { name: 'reset-password', path: `/reset-password?token=${'a'.repeat(64)}`, heading: 'Set a new password', loggedIn: false },
    { name: '404', path: '/this-page-does-not-exist', heading: 'Page not found', loggedIn: false },
    { name: 'dashboard', path: '/dashboard', heading: 'Dashboard', loggedIn: true },
    { name: 'profile', path: '/profile', heading: 'Profile', loggedIn: true },
    { name: 'users', path: '/users', heading: 'Users', loggedIn: true, account: 'admin', waitFor: 'Showing 20 / 28 (Page 1 of 2)' },
];

const describeViolations = (violations) => violations
    .map((violation) => `${violation.id} (${violation.impact}): ${violation.help}\n${violation.nodes.map((node) => `  - ${node.target.join(' ')}`).join('\n')}`)
    .join('\n');

for (const theme of THEMES) {
    for (const { name, path, heading, loggedIn, account, waitFor } of PAGES) {
        test(`${name} page has no serious accessibility problems (${theme})`, async ({ page, loginAs }) => {
            await page.emulateMedia({ colorScheme: theme });
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

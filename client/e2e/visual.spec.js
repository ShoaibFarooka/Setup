import { THEMES, accounts, expect, pageReady, test } from './fixtures';

// Screenshots compared with approved ones (e2e/__screenshots__): an unintended visual change fails the test
// and test-results/ gets the expected, actual and diff images. After an intended design change, look at the new
// screenshots, then accept them with npm run e2e:update.
// Runs per project: desktop at 1440px and 768px, mobile (a phone) at its own size.
const PAGES = [
    { name: 'login', path: '/login', heading: 'Log into your Account', loggedIn: false },
    { name: '404', path: '/this-page-does-not-exist', heading: 'Page not found', loggedIn: false },
    { name: 'dashboard', path: '/dashboard', heading: 'Dashboard', loggedIn: true },
    { name: 'profile', path: '/profile', heading: 'Profile', loggedIn: true },
    { name: 'users', path: '/users', heading: 'Users', loggedIn: true, account: 'admin', waitFor: 'Showing 20 / 28 (Page 1 of 2)' },
];

const sizes = (projectName) => (projectName === 'desktop'
    ? [{ label: '1440', viewport: { width: 1440, height: 900 } }, { label: '768', viewport: { width: 768, height: 1024 } }]
    : [{ label: 'phone', viewport: null }]);

for (const theme of THEMES) {
    for (const { name, path, heading, loggedIn, account, waitFor } of PAGES) {
        test(`${name} looks as approved (${theme})`, async ({ page, loginAs }, testInfo) => {
            await page.emulateMedia({ colorScheme: theme });
            if (loggedIn) {
                await loginAs(account ? accounts[account] : undefined);
            }
            for (const { label, viewport } of sizes(testInfo.project.name)) {
                if (viewport) {
                    await page.setViewportSize(viewport);
                }
                await page.goto(path);
                await pageReady(page, heading);
                if (waitFor) {
                    await expect(page.getByText(waitFor)).toBeVisible();
                }
                // Dates of when the test data was created change on every run: masked, so they never cause a diff
                await expect(page).toHaveScreenshot(`${name}-${theme}-${label}.png`, { mask: [page.locator('td:last-child')] });
            }
        });
    }

    test(`the "log out of all devices" dialog looks as approved (${theme})`, async ({ page, loginAs }) => {
        await page.emulateMedia({ colorScheme: theme });
        await loginAs();
        await page.goto('/profile');
        await pageReady(page, 'Profile');

        await page.getByRole('button', { name: 'Log out of all devices' }).click();
        const dialog = page.getByRole('dialog');
        await expect(dialog).toBeVisible();

        await expect(page).toHaveScreenshot(`profile-dialog-${theme}.png`);
        // Never confirmed: only looked at
        await dialog.getByRole('button', { name: 'Cancel' }).click();
    });

    test(`the edit profile dialog looks as approved (${theme})`, async ({ page, loginAs }) => {
        await page.emulateMedia({ colorScheme: theme });
        await loginAs();
        await page.goto('/profile');
        await pageReady(page, 'Profile');

        await page.getByRole('button', { name: 'Edit' }).click();
        const dialog = page.getByRole('dialog', { name: 'Edit profile' });
        await expect(dialog).toBeVisible();

        await expect(page).toHaveScreenshot(`profile-edit-dialog-${theme}.png`);
        await dialog.getByRole('button', { name: 'Cancel' }).click();
    });

    test(`the phone menu drawer looks as approved (${theme})`, async ({ page, loginAs, isMobile }) => {
        test.skip(!isMobile, 'phones only');
        await page.emulateMedia({ colorScheme: theme });
        await loginAs();
        await page.goto('/dashboard');
        await pageReady(page, 'Dashboard');

        await page.getByRole('button', { name: 'Open menu' }).click();
        await expect(page.getByRole('button', { name: 'Close menu' })).toBeVisible();

        await expect(page).toHaveScreenshot(`menu-open-${theme}.png`);
    });
}

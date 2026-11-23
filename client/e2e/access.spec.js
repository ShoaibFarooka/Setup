import { accounts, expect, pageReady, test } from './fixtures';

test.describe('access', () => {
    test('a visitor opening a protected page is sent to login', async ({ page }) => {
        await page.goto('/dashboard');

        await pageReady(page, 'Log into your Account');
    });

    test('an unknown address shows the 404 page with a way back', async ({ page }) => {
        await page.goto('/this-page-does-not-exist');
        await pageReady(page, 'Page not found');

        await page.getByRole('button', { name: 'Back Home' }).click();

        // A visitor going home ends at the login page
        await pageReady(page, 'Log into your Account');
    });

    for (const [key, roleLabel] of [['user', 'User'], ['admin', 'Admin']]) {
        test(`the ${key} role opens its pages and sees its own details`, async ({ page, loginAs }) => {
            await loginAs(accounts[key]);

            await page.goto('/profile');

            await pageReady(page, 'Profile');
            await expect(page.getByText(accounts[key].email)).toBeVisible();
            await expect(page.getByRole('definition').filter({ hasText: new RegExp(`^${roleLabel}$`) })).toBeVisible();
        });
    }
});

test.describe('navigation', () => {
    test('the sidebar opens pages (on phones from the menu drawer)', async ({ page, loginAs, openMenu, isMobile }) => {
        await loginAs();
        await page.goto('/dashboard');
        await pageReady(page, 'Dashboard');

        await openMenu();
        const sidebar = page.getByRole('navigation').filter({ has: page.getByRole('link', { name: 'Profile' }) });
        await sidebar.getByRole('link', { name: 'Profile' }).click();

        await pageReady(page, 'Profile');
        if (isMobile) {
            // Choosing a page closes the drawer
            await expect(sidebar).toBeHidden();
        }
    });

    test('on phones the menu drawer closes with its close button', async ({ page, loginAs, openMenu, isMobile }) => {
        test.skip(!isMobile, 'phones only');
        await loginAs();
        await page.goto('/dashboard');
        await pageReady(page, 'Dashboard');

        await openMenu();
        const closeButton = page.getByRole('button', { name: 'Close menu' });
        await expect(closeButton).toBeVisible();
        await closeButton.click();

        await expect(page.getByRole('button', { name: 'Open menu' })).toBeVisible();
    });
});

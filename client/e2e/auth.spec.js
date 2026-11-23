import { accounts, expect, pageReady, test } from './fixtures';

const fillLogin = async (page, { username = '', password = '' }) => {
    await page.getByLabel('Email or Username').fill(username);
    await page.getByLabel('Password', { exact: true }).fill(password);
    await page.getByRole('button', { name: 'Log In' }).click();
};

test.describe('logging in', () => {
    test('with the right account opens the dashboard', async ({ page }) => {
        await page.goto('/login');

        await fillLogin(page, accounts.user);

        await pageReady(page, 'Dashboard');
        await expect(page.getByText(`Welcome, ${accounts.user.name}`)).toBeVisible();
    });

    test('with a wrong password shows the server\'s message and stays on the login page', async ({ page }) => {
        await page.goto('/login');

        await fillLogin(page, { username: accounts.user.username, password: 'not-the-password' });

        await expect(page.getByText('Invalid credentials!')).toBeVisible();
        await expect(page).toHaveURL(/\/login$/);
    });

    test('with empty fields shows what is missing without asking the server', async ({ page }) => {
        await page.goto('/login');

        await fillLogin(page, {});

        await expect(page.getByText('Email or username is required!')).toBeVisible();
        await expect(page.getByText('Password is required!')).toBeVisible();
    });

    test('returns to the page that was asked for', async ({ page }) => {
        await page.goto('/profile');
        await pageReady(page, 'Log into your Account');

        await fillLogin(page, accounts.user);

        await pageReady(page, 'Profile');
        await expect(page).toHaveURL(/\/profile$/);
    });
});

test.describe('the session', () => {
    test('survives a page reload (restored from the refresh cookie)', async ({ page, loginAs }) => {
        await loginAs();
        await page.goto('/profile');
        await pageReady(page, 'Profile');

        await page.reload();

        await pageReady(page, 'Profile');
    });

    test('logging out returns to the login page, and protected pages stay closed', async ({ page, loginAs, openMenu }) => {
        await loginAs();
        await page.goto('/dashboard');
        await pageReady(page, 'Dashboard');

        await openMenu();
        await page.getByRole('button', { name: 'Log out' }).click();

        await pageReady(page, 'Log into your Account');
        await page.goto('/dashboard');
        await pageReady(page, 'Log into your Account');
    });

    test('"Log out of all devices" ends every session of the account', async ({ page, browser, loginAs }, testInfo) => {
        // One project only: two projects ending the same account's sessions at once would disturb each other
        test.skip(testInfo.project.name !== 'desktop', 'runs on desktop only');

        // A second device with its own session
        const otherDevice = await browser.newContext();
        const otherPage = await otherDevice.newPage();
        await otherPage.request.post('http://localhost:5100/api/auth/login', {
            data: { identifier: accounts.logoutAll.username, password: accounts.logoutAll.password },
        });
        await otherPage.goto('/dashboard');
        await pageReady(otherPage, 'Dashboard');

        await loginAs(accounts.logoutAll);
        await page.goto('/profile');
        await pageReady(page, 'Profile');
        await page.getByRole('button', { name: 'Log out of all devices' }).click();
        await page.getByRole('dialog').getByRole('button', { name: 'Log out everywhere' }).click();

        await pageReady(page, 'Log into your Account');
        // The other device's refresh token no longer works: its next page load ends at the login page
        await otherPage.reload();
        await pageReady(otherPage, 'Log into your Account');
        await otherDevice.close();
    });
});

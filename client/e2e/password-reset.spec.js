import { API, accounts, clearEmail, expect, pageReady, readEmail, test } from './fixtures';

// The whole "forgot password" flow against the real API: ask for a link, read the email the server wrote,
// open the link, set a new password, log in with it.
// It changes the password of its own account (`reset`), so it runs on one project only: the other project would
// use the same account at the same time.

const { reset } = accounts;
const NEW_PASSWORD = 'E2e-Changed-Pass-2';

test.describe('forgot password', () => {
    test('the emailed link sets a new password; the old one stops working', async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== 'desktop', 'runs on desktop only (changes a shared account)');
        clearEmail(reset.email);

        await page.goto('/login');
        await page.getByRole('link', { name: 'Forgot password?' }).click();
        await pageReady(page, 'Reset your password');
        await page.getByLabel('Email').fill(reset.email);
        await page.getByRole('button', { name: 'Send reset link' }).click();
        await expect(page.getByText('Check your email')).toBeVisible();

        const email = await readEmail(reset.email);
        expect(email.subject).toBe('Reset your password');
        expect(email.html).toContain(`Hi ${reset.name},`);
        // The logo travels inside the email (an inline attachment) and the layout shows it
        expect(email.attachments).toEqual([expect.objectContaining({ filename: 'logo.png', cid: 'logo' })]);
        expect(email.html).toContain('<img src="cid:logo"');
        const link = email.text.match(/http:\/\/localhost:5300\/reset-password\?token=[a-f\d]{64}/)?.[0];
        expect(link, 'the reset link in the email').toBeTruthy();

        await page.goto(link);
        await pageReady(page, 'Set a new password');
        await page.getByLabel('New password', { exact: true }).fill(NEW_PASSWORD);
        await page.getByLabel('Repeat new password').fill(NEW_PASSWORD);
        await page.getByRole('button', { name: 'Change password' }).click();

        await expect(page.getByText('Password changed. Log in with the new password.')).toBeVisible();
        await pageReady(page, 'Log into your Account');
        await page.getByLabel('Email or Username').fill(reset.username);
        await page.getByLabel('Password', { exact: true }).fill(NEW_PASSWORD);
        await page.getByRole('button', { name: 'Log In' }).click();
        await pageReady(page, 'Dashboard');

        const oldLogin = await page.request.post(`${API}/api/auth/login`, { data: { identifier: reset.username, password: reset.password } });
        expect(oldLogin.status()).toBe(401);

        // The link worked once; opening it again fails with a way to ask for a new one
        await page.context().clearCookies();
        await page.goto(link);
        await pageReady(page, 'Set a new password');
        await page.getByLabel('New password', { exact: true }).fill('E2e-Another-Pass-3');
        await page.getByLabel('Repeat new password').fill('E2e-Another-Pass-3');
        await page.getByRole('button', { name: 'Change password' }).click();
        await expect(page.getByRole('alert')).toContainText('This reset link is invalid or has expired');
        await expect(page.getByRole('link', { name: 'Request a new link' })).toBeVisible();
    });

    test('an unknown email gets the same answer, and no email is written', async ({ page }) => {
        const unknown = 'nobody-here@example.com';
        clearEmail(unknown);

        await page.goto('/forgot-password');
        await pageReady(page, 'Reset your password');
        await page.getByLabel('Email').fill(unknown);
        await page.getByRole('button', { name: 'Send reset link' }).click();

        await expect(page.getByText('Check your email')).toBeVisible();
        await expect(page.getByRole('status')).toContainText(`If an account exists for ${unknown}`);
    });

    test('a link without a token says so and offers a new one', async ({ page }) => {
        await page.goto('/reset-password');
        await pageReady(page, 'Set a new password');

        await expect(page.getByText('This link is incomplete')).toBeVisible();
        await page.getByRole('link', { name: 'Request a new link' }).click();
        await pageReady(page, 'Reset your password');
    });
});

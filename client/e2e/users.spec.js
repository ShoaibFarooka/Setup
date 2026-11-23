import { accounts, expect, pageReady, test } from './fixtures';

// The admin users list against the real API: pagination, search and the address keeping both.
// The E2E server has the 4 test accounts plus 24 sample users: 28 users, 2 pages of 20.
test.describe('users list (admins)', () => {
    test.beforeEach(async ({ page, loginAs }) => {
        await loginAs(accounts.admin);
        await page.goto('/users');
        await pageReady(page, 'Users');
    });

    test('shows the first page with the totals, and the next page continues it', async ({ page }) => {
        await expect(page.getByText('Showing 20 / 28 (Page 1 of 2)')).toBeVisible();

        await page.getByRole('button', { name: 'Next page' }).click();

        await expect(page.getByText('Showing 8 / 28 (Page 2 of 2)')).toBeVisible();
        await expect(page).toHaveURL(/[?&]page=2/);
    });

    test('search narrows the list and survives a reload', async ({ page }) => {
        await page.getByRole('searchbox', { name: 'Search users' }).fill('Sample User 1');

        await expect(page.getByText('Showing 10 / 10 (Page 1 of 1)')).toBeVisible();
        await expect(page).toHaveURL(/search=Sample/);

        await page.reload();
        await pageReady(page, 'Users');
        await expect(page.getByRole('searchbox', { name: 'Search users' })).toHaveValue('Sample User 1');
        await expect(page.getByText('Showing 10 / 10 (Page 1 of 1)')).toBeVisible();
    });

    test('a search without matches says so', async ({ page }) => {
        await page.getByRole('searchbox', { name: 'Search users' }).fill('nobody-by-this-name');

        await expect(page.getByText('No users match "nobody-by-this-name"')).toBeVisible();
    });
});

test.describe('users list (other roles)', () => {
    test('a normal user has no Users menu item and the address shows "Access denied"', async ({ page, loginAs, openMenu }) => {
        await loginAs(accounts.user);
        await page.goto('/dashboard');
        await pageReady(page, 'Dashboard');
        await openMenu();

        await expect(page.getByRole('link', { name: 'Users' })).toHaveCount(0);

        await page.goto('/users');
        await pageReady(page, 'Access denied');
    });
});

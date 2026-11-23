import { accounts, expect, pageReady, test } from './fixtures';

// The edit-profile feature end to end: form → validation → PATCH /api/users/me → cache → every view updates.
// It changes real (temporary) data, so it uses its own account and runs on one project only: two projects
// editing the same account at once would disturb each other.
test.describe('editing the profile', () => {
    test.skip(({ isMobile }) => isMobile, 'runs on desktop only');

    const openEditor = async (page) => {
        await page.goto('/profile');
        await pageReady(page, 'Profile');
        await page.getByRole('button', { name: 'Edit' }).click();
        return page.getByRole('dialog', { name: 'Edit profile' });
    };

    test('saves the new details, shows them everywhere and keeps them after a reload', async ({ page, loginAs }) => {
        await loginAs(accounts.editor);
        const dialog = await openEditor(page);

        await dialog.getByLabel('Name').fill('Edited Name');
        await dialog.getByLabel('Email').fill('edited@example.com');
        await dialog.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByText('Profile updated')).toBeVisible();
        await expect(dialog).toBeHidden();
        const main = page.getByRole('main');
        await expect(main.getByText('Edited Name').first()).toBeVisible();
        await expect(main.getByText('edited@example.com')).toBeVisible();
        await expect(page.getByRole('navigation').getByText('Edited Name')).toBeVisible();

        await page.reload();
        await pageReady(page, 'Profile');
        await expect(page.getByRole('main').getByText('edited@example.com')).toBeVisible();
    });

    test('an email of another account is refused with the server\'s message', async ({ page, loginAs }) => {
        await loginAs(accounts.user);
        const dialog = await openEditor(page);

        await dialog.getByLabel('Email').fill(accounts.admin.email);
        await dialog.getByRole('button', { name: 'Save changes' }).click();

        await expect(page.getByText('A user with that email has already been registered!')).toBeVisible();
        await expect(dialog).toBeVisible();
    });

    test('invalid values are reported in the form', async ({ page, loginAs }) => {
        await loginAs(accounts.user);
        const dialog = await openEditor(page);

        await dialog.getByLabel('Name').fill('');
        await dialog.getByRole('button', { name: 'Save changes' }).click();

        await expect(dialog.getByText('Name is required!')).toBeVisible();
    });
});

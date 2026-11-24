import { accounts, expect, pageReady, test, useLanguage } from './fixtures';

// Arabic end to end: the switch, right-to-left layout, server messages in Arabic, the choice remembered
const chooseLanguage = async (page, name) => {
    await page.getByRole('button', { name: /^(Language|اللغة):/ }).click();
    await page.getByRole('menuitem', { name }).click();
};

test('switching to Arabic on the login page: texts, direction, server messages, remembered after a reload', async ({ page }) => {
    await page.goto('/login');
    await pageReady(page, 'Log into your Account');

    await chooseLanguage(page, 'العربية');
    await pageReady(page, 'تسجيل الدخول إلى حسابك');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ar');

    // A wrong password: the server's message, in Arabic
    await page.getByLabel('البريد الإلكتروني أو اسم المستخدم').fill(accounts.user.username);
    await page.getByLabel('كلمة المرور', { exact: true }).fill('wrong-password');
    await page.getByRole('button', { name: 'تسجيل الدخول' }).click();
    await expect(page.getByText('بيانات الدخول غير صحيحة!')).toBeVisible();

    await page.reload();
    await pageReady(page, 'تسجيل الدخول إلى حسابك');
    await expect(page.locator('html')).toHaveAttribute('dir', 'rtl');
});

test('logged in, in Arabic: the sidebar is on the right, and switching back to English works', async ({ page, loginAs, openMenu, isMobile }) => {
    await useLanguage(page, 'ar');
    await loginAs(accounts.admin);
    await page.goto('/users');
    await pageReady(page, 'المستخدمون');
    await expect(page.getByText('عرض ٢٠ من ٢٨ (الصفحة ١ من ٢)')).toBeVisible();

    if (!isMobile) {
        // Right to left: the sidebar is on the right side of the page, the content on its left
        const sidebar = await page.getByRole('navigation').first().boundingBox();
        const heading = await page.getByRole('heading', { level: 1 }).boundingBox();
        expect(sidebar.x).toBeGreaterThan(heading.x);
    }

    await openMenu();
    await chooseLanguage(page, 'English');
    await pageReady(page, 'Users');
    await expect(page.locator('html')).toHaveAttribute('dir', 'ltr');
});

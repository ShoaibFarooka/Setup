import { expect, fillMenu, pageReady, test } from './fixtures';

// A project with many pages: the menu scrolls between the logo and the footer, which stay in view.
// The app's own menu is short, so the test adds 40 more entries to the page (fillMenu).
const inViewport = async (page, locator) => {
    const box = await locator.boundingBox();
    const { height } = page.viewportSize();
    return Boolean(box) && box.y >= 0 && box.y + box.height <= height;
};

test('with many pages only the menu scrolls; the logo and the footer stay in view', async ({ page, loginAs, openMenu }) => {
    await loginAs();
    await page.goto('/dashboard');
    await pageReady(page, 'Dashboard');
    await openMenu();
    await fillMenu(page);

    const nav = page.getByRole('navigation');
    const themeToggle = nav.getByRole('button', { name: /^Theme:/ });
    const logOut = nav.getByRole('button', { name: 'Log out' });
    const menu = logOut.locator('..');

    // The menu is taller than its box, so it scrolls
    expect(await menu.evaluate((element) => element.scrollHeight > element.clientHeight)).toBe(true);
    expect(await inViewport(page, themeToggle)).toBe(true);
    expect(await inViewport(page, logOut)).toBe(false);

    await menu.evaluate((element) => element.scrollTo({ top: element.scrollHeight }));

    await expect(logOut).toBeInViewport();
    expect(await inViewport(page, themeToggle)).toBe(true);
    expect(await inViewport(page, nav.getByText('My App').first())).toBe(true);
});

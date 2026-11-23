import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';

export const API = 'http://localhost:5100';

// The accounts the E2E server creates in its temporary database (server/scripts/e2e-accounts.json)
export const accounts = JSON.parse(readFileSync(new URL('../../server/scripts/e2e-accounts.json', import.meta.url), 'utf8'));

export const THEMES = ['light', 'dark'];

export const test = base.extend({
    // loginAs(account): logs in through the API. The refresh cookie lands in this test's browser, and the app
    // restores the session on the next page load. Every test gets its own session: the server replaces the
    // refresh token on each use, so a saved login shared between tests would stop working.
    loginAs: async ({ page }, use) => {
        await use(async (account = accounts.user) => {
            const response = await page.request.post(`${API}/api/auth/login`, {
                data: { identifier: account.username, password: account.password },
            });
            expect(response.ok(), 'logging in through the API').toBe(true);
        });
    },

    // openMenu(): on phones the sidebar is a drawer; this opens it (and does nothing on desktop)
    openMenu: async ({ page, isMobile }, use) => {
        await use(async () => {
            if (isMobile) {
                await page.getByRole('button', { name: 'Open menu' }).click();
            }
        });
    },
});

// Waits until the page is ready to be looked at: its heading is there and the web font has loaded
export const pageReady = async (page, heading) => {
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
};

export { expect };

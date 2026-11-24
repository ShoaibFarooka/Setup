import { existsSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
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

    // openMenu(): on phones the sidebar is a drawer; this opens it (and does nothing on desktop), in any language
    openMenu: async ({ page, isMobile }, use) => {
        await use(async () => {
            if (isMobile) {
                await page.getByRole('button', { name: /^(Open menu|فتح القائمة)$/ }).click();
            }
        });
    },
});

// Opens every page of this test in a language, as if the user had chosen it before (saved choice).
// Call before the first page.goto().
export const useLanguage = (page, language) => page.addInitScript((code) => {
    localStorage.setItem('language', code);
}, language);

// Waits until the page is ready to be looked at: its heading is there and the web font has loaded
export const pageReady = async (page, heading) => {
    await expect(page.getByRole('heading', { level: 1, name: heading })).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
};

// The E2E server does not send emails: it writes each one to this folder as <recipient>.json (the newest per
// recipient). Same folder as OUTBOX_PATH in server/scripts/e2e-server.js.
const OUTBOX = join(tmpdir(), 'e2e-outbox');

// Forget the last email to this address, so readEmail() waits for a new one
export const clearEmail = (to) => rmSync(join(OUTBOX, `${to}.json`), { force: true });

// readEmail(to) -> { to, subject, text, html }: waits for the email to arrive (it is sent after the API answers)
export const readEmail = async (to) => {
    const file = join(OUTBOX, `${to}.json`);
    await expect.poll(() => existsSync(file), { message: `an email to ${to}` }).toBe(true);
    return JSON.parse(readFileSync(file, 'utf8'));
};

// A long menu for layout checks: adds 40 entries to the sidebar (copies of a menu link) on the current page
export const fillMenu = (page) => page.evaluate(() => {
    const link = document.querySelector('nav a[href="/profile"]');
    for (let i = 1; i <= 40; i++) {
        const copy = link.cloneNode(true);
        copy.removeAttribute('aria-current');
        copy.querySelector('div').textContent = `Extra page ${i}`;
        link.parentElement.insertBefore(copy, link.parentElement.lastElementChild);
    }
});

export { expect };

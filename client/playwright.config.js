import { defineConfig, devices } from '@playwright/test';

// End-to-end tests: the real app in a real browser against the real API (npm run e2e).
// Playwright starts its own API (server: npm run e2e:server, in-memory database, port 5100) and its own client
// (port 5300), so the development servers on 5000 / 5200 keep running untouched.
const CLIENT = 'http://localhost:5300';
const API = 'http://localhost:5100';

export default defineConfig({
    testDir: './e2e',
    // Failure details (traces, screenshots, image diffs); the folder is replaced on every run
    outputDir: './test-results',
    // Approved screenshots, committed. Rendering differs slightly per operating system, hence the platform.
    snapshotPathTemplate: '{testDir}/__screenshots__/{testFileName}/{arg}-{projectName}-{platform}{ext}',
    fullyParallel: true,
    forbidOnly: Boolean(process.env.CI),
    retries: process.env.CI ? 1 : 0,
    reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
    use: {
        baseURL: CLIENT,
        trace: 'retain-on-failure',
        screenshot: 'only-on-failure',
    },
    expect: {
        // A real server and browser: logging in hashes the password (bcrypt), which takes a moment on a busy machine
        timeout: 10 * 1000,
        // Runs render pixel-identically, so only a tiny allowance: a percentage would let small real changes
        // (a new button in a corner) pass unnoticed
        // (100 pixels: the theme toggle's icon sometimes differs by about 60 pixels between runs)
        toHaveScreenshot: { maxDiffPixels: 100, animations: 'disabled' },
    },
    projects: [
        { name: 'desktop', use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
        // A phone: small screen, touch, mobile browser
        { name: 'mobile', use: { ...devices['Pixel 7'] } },
    ],
    webServer: [
        {
            // Started inside server/, where its MongoDB download is cached (from another folder it would download again)
            command: 'npm run e2e:server',
            cwd: '../server',
            url: `${API}/api/health`,
            reuseExistingServer: !process.env.CI,
            timeout: 120 * 1000,
        },
        {
            // The production build, as users get it: fast and stable (the dev server compiles files on first use,
            // which makes parallel tests slow and flaky). Built into its own folder, so dist/ stays untouched.
            command: 'npx vite build --outDir dist-e2e --emptyOutDir && npx vite preview --outDir dist-e2e --port 5300 --strictPort',
            url: CLIENT,
            reuseExistingServer: !process.env.CI,
            env: { VITE_BASE_URL: API },
            timeout: 120 * 1000,
        },
    ],
});

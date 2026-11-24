import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath } from 'node:url';

// Packages whose code is split by where it is used instead of kept in one file (see manualChunks)
const SPLIT_BY_USE = new Set(['antd', '@rc-component', '@ant-design', 'rc-util', 'rc-motion', 'rc-resize-observer']);

export default defineConfig({
    plugins: [
        react(),
        svgr(),
    ],
    resolve: {
        // '@/hooks/useMe' instead of '../../../hooks/useMe' (also in tests); jsconfig.json tells the editor
        alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
    },
    server: {
        port: 5200,
    },
    build: {
        outDir: 'dist',
        emptyOutDir: true,
        rollupOptions: {
            output: {
                // One file per package, so a dependency update only changes that file in the browser cache.
                // Except Ant Design and its helper packages: one file for all of it would put every component any
                // page uses (tables, dialogs, tabs, ...) on the first page. Left to Rollup, each part goes with the
                // code that uses it, so lazy pages download their own Ant Design parts.
                manualChunks(id) {
                    if (!id.includes('node_modules')) {
                        return undefined;
                    }
                    const name = id.toString().split('node_modules/')[1].split('/')[0].toString();
                    return SPLIT_BY_USE.has(name) ? undefined : name;
                },
            },
        },
    },
    test: {
        environment: 'jsdom',
        // The test page has the dev client's address, so CORS works like in the browser
        environmentOptions: { jsdom: { url: 'http://localhost:5200' } },
        // describe / test / expect / vi without imports, like Jest on the server
        globals: true,
        setupFiles: ['./tests/setup/setup.js'],
        // The first test of a file also waits for the lazy parts it opens (the page, Ant Design's table) to load,
        // which takes longer with coverage and with every file running at once (the pre-push hook): 5s was too tight
        testTimeout: 15000,
        // Fixed server address, so tests never depend on client/.env; MSW answers requests to it
        env: { VITE_BASE_URL: 'http://api.test' },
        include: ['tests/**/*.test.{js,jsx}'],
        // CSS has no effect on what the tests check
        css: false,
        coverage: {
            include: ['src/**/*.{js,jsx}'],
            exclude: ['src/main.jsx'],
            // npm run test:coverage (and the pre-push hook) fails below these. Coverage today is ~99%: the floor
            // stops a real drop without blocking work over one untested edge case. Raise it, never lower it.
            thresholds: { statements: 90, branches: 85, functions: 90, lines: 90 },
        },
    },
});

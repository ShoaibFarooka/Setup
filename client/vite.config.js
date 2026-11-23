import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import svgr from 'vite-plugin-svgr';
import { fileURLToPath } from 'node:url';

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
                // One file per package, so a dependency update only changes that file in the browser cache
                manualChunks(id) {
                    if (id.includes('node_modules')) {
                        return id.toString().split('node_modules/')[1].split('/')[0].toString();
                    }
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
        // Fixed server address, so tests never depend on client/.env; MSW answers requests to it
        env: { VITE_BASE_URL: 'http://api.test' },
        include: ['tests/**/*.test.{js,jsx}'],
        // CSS has no effect on what the tests check
        css: false,
        coverage: {
            include: ['src/**/*.{js,jsx}'],
            exclude: ['src/main.jsx'],
        },
    },
});

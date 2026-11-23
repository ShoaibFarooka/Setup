import js from '@eslint/js';
import globals from 'globals';
import react from 'eslint-plugin-react';
import reactHooks from 'eslint-plugin-react-hooks';
import reactRefresh from 'eslint-plugin-react-refresh';
import stylistic from '@stylistic/eslint-plugin';

export default [
    { ignores: ['dist/', 'dist-e2e/', 'coverage/', 'test-results/', 'playwright-report/'] },

    // Rules that catch bugs (unused variables, unreachable code, ...)
    js.configs.recommended,

    {
        files: ['**/*.{js,jsx}'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'module',
            globals: globals.browser,
            parserOptions: { ecmaFeatures: { jsx: true } },
        },
        settings: { react: { version: 'detect' } },
        plugins: {
            react,
            'react-hooks': reactHooks,
            'react-refresh': reactRefresh,
            '@stylistic': stylistic,
        },
        rules: {
            ...react.configs.recommended.rules,
            ...react.configs['jsx-runtime'].rules,
            ...reactHooks.configs.recommended.rules,
            // React 19 no longer checks propTypes
            'react/prop-types': 'off',
            'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],

            // Arguments starting with _ may be unused
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
            'prefer-const': 'error',
            'eqeqeq': ['error', 'always'],

            // Formatting, same as the server: `npm run lint:fix` applies these
            '@stylistic/indent': ['error', 4],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/jsx-quotes': ['error', 'prefer-double'],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/arrow-parens': ['error', 'always'],
            '@stylistic/eol-last': ['error', 'always'],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            '@stylistic/linebreak-style': ['error', 'unix'],
        },
    },

    // The UI stays controllable: Ant Design is used only inside components/ui, everything else imports from there
    {
        files: ['src/**/*.{js,jsx}'],
        ignores: ['src/components/ui/**'],
        rules: {
            'no-restricted-imports': ['error', {
                paths: [{ name: 'antd', message: 'Import from @/components/ui instead (add a wrapper there if it is missing).' }],
                patterns: [
                    { group: ['antd/*', '@ant-design/*'], message: 'Import from @/components/ui instead.' },
                    { group: ['@/components/ui/*'], message: 'Import from @/components/ui (the index), not a component file.' },
                ],
            }],
        },
    },

    {
        files: ['tests/**/*.{js,jsx}', 'e2e/**/*.js', 'playwright.config.js', 'vite.config.js'],
        languageOptions: { globals: { ...globals.node, ...globals.vitest } },
    },

    // Playwright fixtures receive a function named use(), which the React hooks rule mistakes for React's use()
    {
        files: ['e2e/**/*.js'],
        rules: { 'react-hooks/rules-of-hooks': 'off' },
    },
];

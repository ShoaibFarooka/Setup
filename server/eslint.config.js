const js = require('@eslint/js');
const globals = require('globals');
const stylistic = require('@stylistic/eslint-plugin');

module.exports = [
    { ignores: ['node_modules/', 'coverage/'] },

    // Rules that catch bugs (unused variables, unreachable code, ...)
    js.configs.recommended,

    {
        files: ['**/*.js'],
        languageOptions: {
            ecmaVersion: 'latest',
            sourceType: 'commonjs',
            globals: globals.node,
        },
        plugins: { '@stylistic': stylistic },
        rules: {
            // Arguments starting with _ may be unused (e.g. `_next` in the error handler)
            'no-unused-vars': ['error', { argsIgnorePattern: '^_', caughtErrors: 'none' }],
            'prefer-const': 'error',
            'eqeqeq': ['error', 'always'],

            // Formatting: `npm run lint:fix` applies these
            '@stylistic/indent': ['error', 4],
            '@stylistic/quotes': ['error', 'single', { avoidEscape: true }],
            '@stylistic/semi': ['error', 'always'],
            '@stylistic/comma-dangle': ['error', 'always-multiline'],
            '@stylistic/arrow-parens': ['error', 'always'],
            '@stylistic/eol-last': ['error', 'always'],
            '@stylistic/no-trailing-spaces': 'error',
            '@stylistic/no-multiple-empty-lines': ['error', { max: 1, maxEOF: 0 }],
            '@stylistic/linebreak-style': ['error', 'unix'],
        },
    },

    {
        files: ['tests/**/*.js'],
        languageOptions: { globals: globals.jest },
    },
];

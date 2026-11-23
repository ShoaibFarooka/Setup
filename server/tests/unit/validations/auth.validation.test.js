const { forgotPasswordSchema, resetPasswordSchema, passwordRule } = require('../../../src/validations/auth.validation');

const firstError = async (schema, value) => {
    try {
        await schema.validate(value);
        return null;
    } catch (error) {
        return error.message;
    }
};

describe('auth.validation passwordRule (new passwords)', () => {
    test.each([
        ['', 'Password is required'],
        ['abc1', 'Password must be at least 8 characters'],
        ['abcdefgh', 'Password must contain a number'],
        ['12345678', 'Password must contain a letter'],
        [`a1${'x'.repeat(71)}`, 'Password must be at most 72 characters'],
    ])('%j -> %s', async (password, message) => {
        expect(await firstError(passwordRule, password)).toBe(message);
    });

    test('8 to 72 characters with a letter and a number are accepted', async () => {
        expect(await firstError(passwordRule, 'abcdefg1')).toBeNull();
        expect(await firstError(passwordRule, `a1${'x'.repeat(70)}`)).toBeNull();
    });
});

describe('auth.validation forgotPasswordSchema', () => {
    test('normalises the email to lowercase without spaces', async () => {
        expect(await forgotPasswordSchema.validate({ email: '  Ada@Example.COM ' })).toEqual({ email: 'ada@example.com' });
    });

    test('requires a valid email', async () => {
        expect(await firstError(forgotPasswordSchema, {})).toBe('Email is required');
        expect(await firstError(forgotPasswordSchema, { email: 'nope' })).toBe('Enter a valid email address');
    });
});

describe('auth.validation resetPasswordSchema', () => {
    test('accepts a 64-character hex token and a valid password', async () => {
        expect(await firstError(resetPasswordSchema, { token: 'aF'.repeat(32), password: 'abcdefg1' })).toBeNull();
    });

    test.each([
        [undefined, 'Reset token is required'],
        ['abc', 'Reset token is invalid'],
        ['z'.repeat(64), 'Reset token is invalid'],
    ])('token %j -> %s', async (token, message) => {
        expect(await firstError(resetPasswordSchema, { token, password: 'abcdefg1' })).toBe(message);
    });
});

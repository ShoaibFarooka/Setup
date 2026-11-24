import { forgotPasswordSchema, loginSchema, resetPasswordSchema } from '@/validations/authValidations';
import { validateForm } from '@/utils/validationUtils';
import { t } from '@/lib/i18n';

// The schemas return message keys; the English texts are what people see
const messages = async (schema, values) => Object.fromEntries(
    Object.entries(await validateForm(schema, values)).map(([field, key]) => [field, t(key)]),
);

describe('loginSchema', () => {
    test('an identifier and a password are valid', async () => {
        expect(await messages(loginSchema, { identifier: 'admin', password: 'secret' })).toEqual({});
    });

    test('both fields are required', async () => {
        expect(await messages(loginSchema, { identifier: '', password: '' })).toEqual({
            identifier: 'Email or username is required!',
            password: 'Password is required!',
        });
    });

    test('spaces only count as empty', async () => {
        expect(await messages(loginSchema, { identifier: '   ', password: '   ' })).toEqual({
            identifier: 'Email or username is required!',
            password: 'Password is required!',
        });
    });

    test('the identifier is at most 254 characters, like the server', async () => {
        expect(await messages(loginSchema, { identifier: 'a'.repeat(255), password: 'secret' })).toEqual({
            identifier: 'Email or username is too long!',
        });
    });
});

describe('forgotPasswordSchema', () => {
    test('a valid email is accepted', async () => {
        expect(await messages(forgotPasswordSchema, { email: ' ada@example.com ' })).toEqual({});
    });

    test.each([
        ['', 'Email is required!'],
        ['ada', 'Enter a valid email address!'],
        [`${'a'.repeat(250)}@x.com`, 'Email is too long!'],
    ])('%j -> %s', async (email, message) => {
        expect(await messages(forgotPasswordSchema, { email })).toEqual({ email: message });
    });
});

describe('resetPasswordSchema (mirrors the server\'s password rule)', () => {
    test('a strong password typed twice is accepted', async () => {
        expect(await messages(resetPasswordSchema, { password: 'NewPassword1', confirmPassword: 'NewPassword1' })).toEqual({});
    });

    test.each([
        ['', 'Password is required!'],
        ['abc1', 'Password must be at least 8 characters!'],
        ['abcdefgh', 'Password must contain a number!'],
        ['12345678', 'Password must contain a letter!'],
        [`a1${'x'.repeat(71)}`, 'Password must be at most 72 characters!'],
    ])('%j -> %s', async (password, message) => {
        expect((await messages(resetPasswordSchema, { password, confirmPassword: password })).password).toBe(message);
    });

    test('the repeat must be given and match', async () => {
        expect(await messages(resetPasswordSchema, { password: 'NewPassword1', confirmPassword: '' }))
            .toEqual({ confirmPassword: 'Repeat the new password!' });
        expect(await messages(resetPasswordSchema, { password: 'NewPassword1', confirmPassword: 'NewPassword2' }))
            .toEqual({ confirmPassword: 'The passwords do not match!' });
    });
});

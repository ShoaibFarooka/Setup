import { loginSchema } from '@/validations/authValidations';
import { validateForm } from '@/utils/validationUtils';

describe('loginSchema', () => {
    test('an identifier and a password are valid', async () => {
        expect(await validateForm(loginSchema, { identifier: 'admin', password: 'secret' })).toEqual({});
    });

    test('both fields are required', async () => {
        expect(await validateForm(loginSchema, { identifier: '', password: '' })).toEqual({
            identifier: 'Email or username is required!',
            password: 'Password is required!',
        });
    });

    test('spaces only count as empty', async () => {
        expect(await validateForm(loginSchema, { identifier: '   ', password: '   ' })).toEqual({
            identifier: 'Email or username is required!',
            password: 'Password is required!',
        });
    });

    test('the identifier is at most 254 characters, like the server', async () => {
        expect(await validateForm(loginSchema, { identifier: 'a'.repeat(255), password: 'secret' })).toEqual({
            identifier: 'Email or username is too long!',
        });
    });
});

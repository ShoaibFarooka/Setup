import { profileSchema } from '@/validations/userValidations';
import { validateForm } from '@/utils/validationUtils';

describe('profileSchema', () => {
    test('a name and an email are valid', async () => {
        expect(await validateForm(profileSchema, { name: 'Ada', email: 'ada@example.com' })).toEqual({});
    });

    test('both are required', async () => {
        expect(await validateForm(profileSchema, { name: '  ', email: '' })).toEqual({
            name: 'Name is required!',
            email: 'Email is required!',
        });
    });

    test('the same limits as the server', async () => {
        expect(await validateForm(profileSchema, { name: 'A', email: 'nope' })).toEqual({
            name: 'Name must be at least 2 characters!',
            email: 'Enter a valid email address!',
        });
        expect(await validateForm(profileSchema, { name: 'x'.repeat(61), email: `${'a'.repeat(250)}@b.co` })).toEqual({
            name: 'Name must be at most 60 characters!',
            email: 'Email is too long!',
        });
    });
});

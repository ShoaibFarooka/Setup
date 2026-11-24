import { profileSchema } from '@/validations/userValidations';
import { validateForm } from '@/utils/validationUtils';
import { t } from '@/lib/i18n';

// The schemas return message keys; the English texts are what people see
const messages = async (schema, values) => Object.fromEntries(
    Object.entries(await validateForm(schema, values)).map(([field, key]) => [field, t(key)]),
);

describe('profileSchema', () => {
    test('a name and an email are valid', async () => {
        expect(await messages(profileSchema, { name: 'Ada', email: 'ada@example.com' })).toEqual({});
    });

    test('both are required', async () => {
        expect(await messages(profileSchema, { name: '  ', email: '' })).toEqual({
            name: 'Name is required!',
            email: 'Email is required!',
        });
    });

    test('the same limits as the server', async () => {
        expect(await messages(profileSchema, { name: 'A', email: 'nope' })).toEqual({
            name: 'Name must be at least 2 characters!',
            email: 'Enter a valid email address!',
        });
        expect(await messages(profileSchema, { name: 'x'.repeat(61), email: `${'a'.repeat(250)}@b.co` })).toEqual({
            name: 'Name must be at most 60 characters!',
            email: 'Email is too long!',
        });
    });
});

import * as yup from 'yup';
import { validateForm } from '@/utils/validationUtils';

const schema = yup.object({
    name: yup.string().min(3, 'Name is too short!').required('Name is required!'),
    age: yup.number().min(18, 'Must be 18 or older!'),
});

describe('validateForm', () => {
    test('valid values give no errors', async () => {
        expect(await validateForm(schema, { name: 'Ann', age: 20 })).toEqual({});
    });

    test('every invalid field gets its message', async () => {
        expect(await validateForm(schema, { age: 10 })).toEqual({ name: 'Name is required!', age: 'Must be 18 or older!' });
    });

    test('only the first message per field', async () => {
        const twoRules = yup.object({ code: yup.string().min(5, 'Too short!').matches(/^\d+$/, 'Digits only!') });

        expect(await validateForm(twoRules, { code: 'ab' })).toEqual({ code: 'Too short!' });
    });

    test('async tests are awaited', async () => {
        const asyncSchema = yup.object({
            username: yup.string().test('free', 'Username is taken!', async (value) => value !== 'admin'),
        });

        expect(await validateForm(asyncSchema, { username: 'admin' })).toEqual({ username: 'Username is taken!' });
    });

    test('errors other than validation errors are thrown', async () => {
        const broken = yup.object({
            field: yup.string().test('broken', 'unused', () => {
                throw new Error('bug in a test');
            }),
        });

        await expect(validateForm(broken, { field: 'x' })).rejects.toThrow('bug in a test');
    });
});

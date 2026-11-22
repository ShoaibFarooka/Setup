const { successBody, errorBody } = require('../../../src/utils/response.util');

describe('response.util', () => {
    test('successBody wraps the data', () => {
        expect(successBody('Done', { id: '1' })).toEqual({ success: true, message: 'Done', data: { id: '1' } });
    });

    test('successBody without data has data: null', () => {
        expect(successBody('Done')).toEqual({ success: true, message: 'Done', data: null });
    });

    test('errorBody with only a message', () => {
        expect(errorBody('Failed')).toEqual({ success: false, message: 'Failed' });
    });

    test('errorBody with errors and data', () => {
        expect(errorBody('Failed', { errors: { name: 'Required' }, data: { id: '1' } })).toEqual({
            success: false,
            message: 'Failed',
            errors: { name: 'Required' },
            data: { id: '1' },
        });
    });
});

// Checks form values against a Yup schema and returns the first message per field, e.g. { password: 'Password is required!' };
// an empty object means the values are valid. Async, so schemas may use async tests.
export const validateForm = async (schema, values) => {
    try {
        await schema.validate(values, { abortEarly: false });
        return {};
    } catch (error) {
        if (error.name !== 'ValidationError') {
            throw error;
        }

        return error.inner.reduce((errors, { path, message }) => (
            errors[path] ? errors : { ...errors, [path]: message }
        ), {});
    }
};

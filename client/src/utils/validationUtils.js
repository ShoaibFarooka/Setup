// Checks form values against a Yup schema and returns the first message per field, e.g.
// { password: 'validation.passwordRequired' }; an empty object means the values are valid. Async, so schemas may
// use async tests. Messages are keys in src/locales/*.json: keep them in state and show them with t(), so a
// visible error also changes language when the user switches.
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

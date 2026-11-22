const yup = require('yup');

const loginSchema = yup.object().shape({
    // Email or username
    identifier: yup.string().trim().max(254, 'Email or username is too long').required('Email or username is required'),
    password: yup.string().trim().required('Password is required'),
});

module.exports = {
    loginSchema,
};

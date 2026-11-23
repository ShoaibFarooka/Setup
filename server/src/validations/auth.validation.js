const yup = require('yup');

const loginSchema = yup.object().shape({
    // Email or username
    identifier: yup.string().trim().max(254, 'Email or username is too long').required('Email or username is required'),
    password: yup.string().trim().required('Password is required'),
});

const forgotPasswordSchema = yup.object().shape({
    email: yup.string().trim().lowercase().max(254, 'Email is too long').email('Enter a valid email address')
        .required('Email is required'),
});

// A new password: bcrypt only uses the first 72 bytes, so longer ones are refused instead of silently cut
const passwordRule = yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters')
    .matches(/[a-zA-Z]/, 'Password must contain a letter')
    .matches(/\d/, 'Password must contain a number');

const resetPasswordSchema = yup.object().shape({
    // The token from the reset link: 32 random bytes as hex
    token: yup.string().required('Reset token is required').matches(/^[a-f\d]{64}$/i, 'Reset token is invalid'),
    password: passwordRule,
});

module.exports = {
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    passwordRule,
};

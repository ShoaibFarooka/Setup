import * as yup from 'yup';

// Mirrors the server's loginSchema for instant feedback; the server still validates every request
export const loginSchema = yup.object({
    // Email or username
    identifier: yup.string().trim().max(254, 'Email or username is too long!').required('Email or username is required!'),
    password: yup.string().trim().required('Password is required!'),
});

// Mirrors the server's forgotPasswordSchema (server/src/validations/auth.validation.js)
export const forgotPasswordSchema = yup.object({
    email: yup.string().trim().required('Email is required!').max(254, 'Email is too long!').email('Enter a valid email address!'),
});

// The password mirrors the server's passwordRule; the confirmation exists only here (the server never gets it)
export const resetPasswordSchema = yup.object({
    password: yup.string()
        .required('Password is required!')
        .min(8, 'Password must be at least 8 characters!')
        .max(72, 'Password must be at most 72 characters!')
        .matches(/[a-zA-Z]/, 'Password must contain a letter!')
        .matches(/\d/, 'Password must contain a number!'),
    // An empty value is left to `required` (oneOf would report "do not match" first)
    confirmPassword: yup.string()
        .required('Repeat the new password!')
        .test('matches', 'The passwords do not match!', (value, context) => !value || value === context.parent.password),
});

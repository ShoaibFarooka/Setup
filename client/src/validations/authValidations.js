import * as yup from 'yup';

// Mirrors the server's loginSchema for instant feedback; the server still validates every request
export const loginSchema = yup.object({
    // Email or username
    identifier: yup.string().trim().max(254, 'Email or username is too long!').required('Email or username is required!'),
    password: yup.string().trim().required('Password is required!'),
});

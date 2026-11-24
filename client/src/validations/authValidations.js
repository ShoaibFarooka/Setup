import * as yup from 'yup';

// Messages are keys in src/locales/*.json: validateForm() returns them, forms show them with t()

// Mirrors the server's loginSchema for instant feedback; the server still validates every request
export const loginSchema = yup.object({
    // Email or username
    identifier: yup.string().trim().max(254, 'validation.identifierTooLong').required('validation.identifierRequired'),
    password: yup.string().trim().required('validation.passwordRequired'),
});

// Mirrors the server's forgotPasswordSchema (server/src/validations/auth.validation.js)
export const forgotPasswordSchema = yup.object({
    email: yup.string().trim().required('validation.emailRequired').max(254, 'validation.emailTooLong').email('validation.emailInvalid'),
});

// The password mirrors the server's passwordRule; the confirmation exists only here (the server never gets it)
export const resetPasswordSchema = yup.object({
    password: yup.string()
        .required('validation.passwordRequired')
        .min(8, 'validation.passwordMin')
        .max(72, 'validation.passwordMax')
        .matches(/[a-zA-Z]/, 'validation.passwordLetter')
        .matches(/\d/, 'validation.passwordNumber'),
    // An empty value is left to `required` (oneOf would report "do not match" first)
    confirmPassword: yup.string()
        .required('validation.repeatRequired')
        .test('matches', 'validation.passwordsMismatch', (value, context) => !value || value === context.parent.password),
});

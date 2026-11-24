const yup = require('yup');

// Messages are keys in src/locales/*.json; the validation middleware sends them in the request's language

const loginSchema = yup.object().shape({
    // Email or username
    identifier: yup.string().trim().max(254, 'validation.identifierTooLong').required('validation.identifierRequired'),
    password: yup.string().trim().required('validation.passwordRequired'),
});

const forgotPasswordSchema = yup.object().shape({
    email: yup.string().trim().lowercase().max(254, 'validation.emailTooLong').email('validation.emailInvalid')
        .required('validation.emailRequired'),
});

// A new password: bcrypt only uses the first 72 bytes, so longer ones are refused instead of silently cut
const passwordRule = yup.string()
    .required('validation.passwordRequired')
    .min(8, 'validation.passwordMin')
    .max(72, 'validation.passwordMax')
    .matches(/[a-zA-Z]/, 'validation.passwordLetter')
    .matches(/\d/, 'validation.passwordNumber');

const resetPasswordSchema = yup.object().shape({
    // The token from the reset link: 32 random bytes as hex
    token: yup.string().required('validation.resetTokenRequired').matches(/^[a-f\d]{64}$/i, 'validation.resetTokenInvalid'),
    password: passwordRule,
});

module.exports = {
    loginSchema,
    forgotPasswordSchema,
    resetPasswordSchema,
    passwordRule,
};

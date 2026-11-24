import * as yup from 'yup';

// Mirrors the server's updateProfileSchema (server/src/validations/user.validation.js) for instant feedback;
// the server still validates every request. Messages are keys in src/locales/*.json.
export const profileSchema = yup.object({
    name: yup.string().trim().required('validation.nameRequired').min(2, 'validation.nameMin').max(60, 'validation.nameMax'),
    email: yup.string().trim().required('validation.emailRequired').max(254, 'validation.emailTooLong').email('validation.emailInvalid'),
});

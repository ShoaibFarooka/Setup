import * as yup from 'yup';

// Mirrors the server's updateProfileSchema (server/src/validations/user.validation.js) for instant feedback;
// the server still validates every request
export const profileSchema = yup.object({
    name: yup.string().trim().required('Name is required!').min(2, 'Name must be at least 2 characters!').max(60, 'Name must be at most 60 characters!'),
    email: yup.string().trim().required('Email is required!').max(254, 'Email is too long!').email('Enter a valid email address!'),
});

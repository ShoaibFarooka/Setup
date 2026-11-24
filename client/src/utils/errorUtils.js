import { t } from '@/lib/i18n';

// Text to show for a failed request (an ApiError): the server's message, plus the first field error if there is one,
// e.g. "Request validation failed: Email or username is required"
export const getErrorMessage = (error, fallback = t('errors.generic')) => {
    if (!error?.message) {
        return fallback;
    }

    const firstFieldError = error.errors && typeof error.errors === 'object'
        ? Object.values(error.errors).find((value) => typeof value === 'string')
        : null;

    return firstFieldError ? `${error.message}: ${firstFieldError}` : error.message;
};

import { t } from './i18n';

// Every failed request becomes an ApiError, whatever went wrong. Failures from the server follow its contract
// { success: false, message, errors?, data? }; a server that cannot be reached gets status 0.
export class ApiError extends Error {
    constructor({ status, message, errors = null, data = null, requestId = null }) {
        super(message);
        this.name = 'ApiError';
        // HTTP status, or 0 when the server could not be reached
        this.status = status;
        // Message per field, e.g. { identifier: 'Email or username is required' }
        this.errors = errors;
        // Extra facts the server sent with the failure
        this.data = data;
        // X-Request-Id of the failed request: finds every server log line of it
        this.requestId = requestId;
    }
}

export const toApiError = (error) => {
    if (error instanceof ApiError) {
        return error;
    }

    const { response } = error ?? {};
    if (!response) {
        return new ApiError({ status: 0, message: t('errors.network') });
    }

    const body = response.data && typeof response.data === 'object' ? response.data : {};
    return new ApiError({
        status: response.status,
        message: body.message || t('errors.generic'),
        errors: body.errors ?? null,
        data: body.data ?? null,
        requestId: response.headers?.['x-request-id'] ?? null,
    });
};

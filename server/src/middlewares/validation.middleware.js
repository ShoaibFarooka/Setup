const logger = require('../utils/logger.util');
const { AppError } = require('../utils/app-error.util');
const { DEFAULT_LANGUAGE, translate } = require('../utils/i18n.util');

// Validation failures are passed on as AppError (400) and answered by the error handler, like every other error

// Message keys per part of the request (src/locales/*.json)
const FAILED = { body: 'errors.requestValidationFailed', params: 'errors.paramsValidationFailed', query: 'errors.queryValidationFailed' };
const UNKNOWN = { body: 'errors.unknownFieldsBody', params: 'errors.unknownFieldsParams', query: 'errors.unknownFieldsQuery' };

// The schemas' messages are keys; each is sent in the request's language, with Yup's params ({ max }, { values })
// for its placeholders
const formatYupError = (error, t) => {
    // Anything that is not a Yup ValidationError has no `inner` array
    if (!Array.isArray(error?.inner)) {
        return { message: error?.message || t('errors.validationFailed') };
    }

    return Object.fromEntries(error.inner.map((err) => [err.path, t(err.message, err.params)]));
};

// Validates req[source] against a Yup schema and replaces it with the validated values
// (converted and trimmed, e.g. ?page=2 becomes the number 2). Fields the schema does not know are rejected.
const validate = (schema, source = 'body') => async (req, res, next) => {
    const input = req[source];
    const t = req.t ?? ((key, values) => translate(DEFAULT_LANGUAGE, key, values));

    let value;
    try {
        value = await schema.validate(input, { abortEarly: false, stripUnknown: false });
    } catch (error) {
        const errors = formatYupError(error, t);
        (req.log ?? logger).warn({ errors }, `Validation failed (${source})`);
        return next(new AppError(FAILED[source], 400, { errors }));
    }

    const unknownFields = Object.keys(input).filter((field) => !(field in schema.fields));
    if (unknownFields.length > 0) {
        return next(new AppError(UNKNOWN[source], 400, { errors: { unknownFields } }));
    }

    // Express 5 makes req.query a getter, so it has to be redefined instead of assigned
    Object.defineProperty(req, source, { value, writable: true, configurable: true, enumerable: true });
    next();
};

const validateRequest = (schema) => validate(schema, 'body');
const validateParams = (schema) => validate(schema, 'params');
const validateQuery = (schema) => validate(schema, 'query');

// Checks the file read by uploadFile (src/middlewares/upload.middleware.js, req.file): required or not,
// at most 10MB, images only. uploadFile already enforces its own size and type limits; this adds "required".
const validateFile = (options) => (req, res, next) => {
    const { required } = options;
    try {
        if (required && !req.file) {
            return next(new AppError('errors.fileRequired', 400));
        }

        if (req.file) {
            if (req.file.size > 10 * 1024 * 1024) {
                return next(new AppError('errors.fileTooLarge', 400));
            }
            if (!req.file.mimetype.startsWith('image/')) {
                return next(new AppError('errors.fileTypeNotAllowed', 400));
            }
        }
        next();
    } catch (error) {
        (req.log ?? logger).warn({ err: error }, 'File validation failed');
        next(new AppError('errors.fileValidationFailed', 400));
    }
};

module.exports = {
    validate,
    validateParams,
    validateRequest,
    validateQuery,
    validateFile,
};

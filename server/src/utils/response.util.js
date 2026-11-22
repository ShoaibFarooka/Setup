// Every response uses the same wrapper:
//   success: { success: true,  message, data }            data is null when there is nothing to return
//   failure: { success: false, message, errors?, data? }  errors: message per field (validation), data: extra facts
const successBody = (message, data = null) => ({ success: true, message, data });

const errorBody = (message, { errors, data } = {}) => ({
    success: false,
    message,
    ...(errors && { errors }),
    ...(data && { data }),
});

module.exports = {
    successBody,
    errorBody,
};

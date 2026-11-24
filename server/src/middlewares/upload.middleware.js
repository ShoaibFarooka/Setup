const multer = require('multer');
const { AppError } = require('../utils/app-error.util');

const MB = 1024 * 1024;

// Reads one file from a multipart/form-data request into memory (req.file: { buffer, mimetype, size, originalname }).
// Memory, not disk: nothing is written unless the route decides where the file goes (a cloud bucket, a folder,
// the database), and the size limit stops large files before they are read completely.
// Use before validateFile:  uploadFile('avatar', { maxSizeMb: 2, types: ['image/png', 'image/jpeg'] }), validateFile(...)
// Files that are too large or of another type are refused with a 400 (the error handler formats MulterError too).
const uploadFile = (field, { maxSizeMb = 10, types = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'] } = {}) => multer({
    storage: multer.memoryStorage(),
    limits: { fileSize: maxSizeMb * MB, files: 1 },
    fileFilter: (req, file, callback) => {
        if (types.includes(file.mimetype)) {
            return callback(null, true);
        }
        callback(new AppError('errors.fileTypeNotAllowedList', 400, { values: { types: types.join(', ') } }));
    },
}).single(field);

module.exports = { uploadFile };

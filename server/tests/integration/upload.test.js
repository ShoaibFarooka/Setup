const express = require('express');
const request = require('supertest');
const { uploadFile } = require('../../src/middlewares/upload.middleware');
const { validateFile } = require('../../src/middlewares/validation.middleware');
const errorHandler = require('../../src/middlewares/error-handler.middleware');

// A small app with one upload route, the way a real route would use the middleware
const makeApp = (options, { required = true } = {}) => {
    const app = express();
    app.post('/upload', uploadFile('file', options), validateFile({ required }), (req, res) => {
        res.json({ name: req.file?.originalname ?? null, size: req.file?.size ?? null, type: req.file?.mimetype ?? null });
    });
    app.use(errorHandler);
    return app;
};

const png = Buffer.from('89504e470d0a1a0a', 'hex');

describe('uploadFile + validateFile', () => {
    test('an allowed file reaches the route in memory', async () => {
        const res = await request(makeApp()).post('/upload').attach('file', png, { filename: 'logo.png', contentType: 'image/png' });

        expect(res.status).toBe(200);
        expect(res.body).toEqual({ name: 'logo.png', size: png.length, type: 'image/png' });
    });

    test('a file of another type -> 400 naming the allowed types', async () => {
        const res = await request(makeApp({ types: ['image/png'] })).post('/upload')
            .attach('file', Buffer.from('hello'), { filename: 'note.txt', contentType: 'text/plain' });

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ success: false, message: 'File type not allowed (allowed: image/png)' });
    });

    test('a file over the size limit -> 400', async () => {
        const big = Buffer.alloc(1.5 * 1024 * 1024);
        const res = await request(makeApp({ maxSizeMb: 1 })).post('/upload').attach('file', big, { filename: 'big.png', contentType: 'image/png' });

        expect(res.status).toBe(400);
        expect(res.body.success).toBe(false);
    });

    test('a required file that is missing -> 400', async () => {
        const res = await request(makeApp()).post('/upload').field('note', 'no file');

        expect(res.status).toBe(400);
        expect(res.body).toEqual({ success: false, message: 'File upload is mandatory' });
    });

    test('an optional file may be left out', async () => {
        const res = await request(makeApp({}, { required: false })).post('/upload').field('note', 'no file');

        expect(res.status).toBe(200);
        expect(res.body.name).toBeNull();
    });
});

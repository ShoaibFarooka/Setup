jest.mock('nodemailer', () => ({ createTransport: jest.fn(() => ({ sendMail: jest.fn() })) }));

const nodemailer = require('nodemailer');
const config = require('../../../src/configs/app.config');

describe('email.config', () => {
    test('creates the transporter from the email settings in app config', () => {
        config.email = { ...config.email, host: 'smtp.example.com', port: 587, secure: false, user: 'noreply@example.com', password: 'secret' };

        const transporter = require('../../../src/configs/email.config');

        expect(nodemailer.createTransport).toHaveBeenCalledWith({
            host: 'smtp.example.com',
            port: 587,
            secure: false,
            auth: { user: 'noreply@example.com', pass: 'secret' },
        });
        expect(transporter).toHaveProperty('sendMail');
    });
});

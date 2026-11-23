jest.mock('../../../src/configs/email.config', () => ({ sendMail: jest.fn() }));

const config = require('../../../src/configs/app.config');
const transporter = require('../../../src/configs/email.config');
const logger = require('../../../src/utils/logger.util');
const { AppError } = require('../../../src/utils/app-error.util');
const { sendEmail, sendTemplateEmail } = require('../../../src/services/email.service');

describe('email.service sendEmail', () => {
    beforeEach(() => {
        config.email = { ...config.email, enabled: true, from: 'noreply@example.com' };
    });

    afterEach(() => jest.resetAllMocks());

    test('email not enabled -> 500 and nothing is sent', async () => {
        config.email.enabled = false;

        await expect(sendEmail('to@example.com', 'Hello', 'Text')).rejects.toThrow(AppError);
        expect(transporter.sendMail).not.toHaveBeenCalled();
        expect(logger.error).toHaveBeenCalled();
    });

    test('sends only the fields that were given, from the configured sender', async () => {
        transporter.sendMail.mockResolvedValue({ messageId: '1' });

        await sendEmail('to@example.com', 'Hello', 'Plain text');

        expect(transporter.sendMail).toHaveBeenCalledWith({
            from: 'noreply@example.com',
            to: 'to@example.com',
            subject: 'Hello',
            text: 'Plain text',
        });
        expect(logger.info).toHaveBeenCalledWith({ messageId: '1' }, 'Email sent');
    });

    test('passes html, cc and bcc when given', async () => {
        transporter.sendMail.mockResolvedValue({ messageId: '1' });

        await sendEmail('to@example.com', 'Hello', undefined, '<b>Hi</b>', 'cc@example.com', 'bcc@example.com');

        expect(transporter.sendMail).toHaveBeenCalledWith(expect.objectContaining({
            html: '<b>Hi</b>',
            cc: 'cc@example.com',
            bcc: 'bcc@example.com',
        }));
        expect(transporter.sendMail.mock.calls[0][0]).not.toHaveProperty('text');
    });

    test('sendTemplateEmail sends the HTML (in the email layout) and the plain-text version of a template', async () => {
        transporter.sendMail.mockResolvedValue({ messageId: '1' });

        await sendTemplateEmail({
            to: 'ada@example.com',
            subject: 'Reset your password',
            template: 'reset-password',
            data: { name: 'Ada', resetUrl: 'http://localhost:5200/reset-password?token=abc', expiresInMinutes: 30 },
            bcc: 'audit@example.com',
        });

        const mail = transporter.sendMail.mock.calls[0][0];
        expect(mail).toMatchObject({ from: 'noreply@example.com', to: 'ada@example.com', subject: 'Reset your password', bcc: 'audit@example.com' });
        expect(mail.html).toContain('<title>Reset your password</title>');
        expect(mail.html).toContain(config.appName);
        expect(mail.html).toContain('Hi Ada,');
        expect(mail.text).toContain('Hi Ada,');
        expect(mail.text).not.toContain('<');
    });

    test('sendTemplateEmail with an unknown template throws before anything is sent', async () => {
        await expect(sendTemplateEmail({ to: 'a@example.com', subject: 'x', template: 'nope' })).rejects.toThrow(/ENOENT/);
        expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    test('a failed send -> 500 AppError and the cause is logged', async () => {
        transporter.sendMail.mockRejectedValue(new Error('SMTP down'));

        await expect(sendEmail('to@example.com', 'Hello', 'Text'))
            .rejects.toMatchObject({ message: 'Unable to send email!', statusCode: 500 });
        expect(logger.error).toHaveBeenCalledWith({ err: expect.any(Error) }, 'Error sending email');
    });
});

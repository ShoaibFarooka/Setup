const config = require('../configs/app.config');
const transporter = require('../configs/email.config');
const logger = require('../utils/logger.util');
const { AppError } = require('../utils/app-error.util');
const { renderTemplate } = require('../utils/template.util');

const sendEmail = async (to, subject, text, html, cc, bcc) => {
    if (!config.email.enabled) {
        logger.error('Tried to send an email, but email is not enabled (EMAIL_ENABLED=false)');
        throw new AppError('Email is not configured!', 500);
    }

    const mailOptions = {
        from: config.email.from,
        to,
        subject,
        ...(text && { text }),
        ...(html && { html }),
        ...(cc && { cc }),
        ...(bcc && { bcc }),
    };

    try {
        const info = await transporter.sendMail(mailOptions);
        logger.info({ messageId: info.messageId }, 'Email sent');
    } catch (error) {
        logger.error({ err: error }, 'Error sending email');
        throw new AppError('Unable to send email!', 500);
    }
};

// Renders src/templates/emails/<template>.hbs inside layouts/email.hbs (HTML) and <template>.text.hbs (the plain
// text version, for email programs that do not show HTML), then sends both. Every template also gets
// `appName` and `subject`.
// sendTemplateEmail({ to, subject: 'Reset your password', template: 'reset-password', data: { name, resetUrl } })
const sendTemplateEmail = async ({ to, subject, template, data = {}, cc, bcc }) => {
    const values = { appName: config.appName, subject, ...data };
    const html = renderTemplate(`emails/${template}`, values, { layout: 'layouts/email' });
    const text = renderTemplate(`emails/${template}.text`, values);
    await sendEmail(to, subject, text, html, cc, bcc);
};

module.exports = { sendEmail, sendTemplateEmail };

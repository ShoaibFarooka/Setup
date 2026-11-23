const config = require('../configs/app.config');
const transporter = require('../configs/email.config');
const logger = require('../utils/logger.util');
const { AppError } = require('../utils/app-error.util');
const { renderTemplate, LOGO_PATH, LOGO_CID } = require('../utils/template.util');

// attachments: nodemailer attachments, e.g. [{ filename: 'invoice.pdf', content: buffer }]
const sendEmail = async (to, subject, text, html, cc, bcc, attachments) => {
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
        ...(attachments?.length && { attachments }),
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
// `appName`, `subject` and `logoSrc`. The logo travels inside the email as an inline attachment (src="cid:logo"):
// it shows without a public image address, also in development.
// sendTemplateEmail({ to, subject: 'Reset your password', template: 'reset-password', data: { name, resetUrl } })
const sendTemplateEmail = async ({ to, subject, template, data = {}, cc, bcc, attachments = [] }) => {
    const values = { appName: config.appName, subject, logoSrc: `cid:${LOGO_CID}`, ...data };
    const html = renderTemplate(`emails/${template}`, values, { layout: 'layouts/email' });
    const text = renderTemplate(`emails/${template}.text`, values);
    const logo = { filename: 'logo.png', path: LOGO_PATH, cid: LOGO_CID };
    await sendEmail(to, subject, text, html, cc, bcc, [logo, ...attachments]);
};

module.exports = { sendEmail, sendTemplateEmail };

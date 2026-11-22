const config = require('../configs/app.config');
const transporter = require('../configs/email.config');
const logger = require('../utils/logger.util');
const { AppError } = require('../utils/app-error.util');

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

module.exports = { sendEmail };

const nodemailer = require('nodemailer');
const config = require('./app.config');

const { host, port, secure, user, password } = config.email;

const transporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass: password },
});

module.exports = transporter;

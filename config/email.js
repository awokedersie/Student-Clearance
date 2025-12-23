const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'amanneby004@gmail.com',
        pass: process.env.EMAIL_PASS || 'duwhutearrqpgpby'
    }
});

module.exports = transporter;

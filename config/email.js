const nodemailer = require('nodemailer');

console.log('📬 Using Gmail SMTP for Email Delivery');
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: (process.env.EMAIL_USER || '').trim(),
        pass: (process.env.EMAIL_PASS || '').trim()
    }
});

module.exports = transporter;

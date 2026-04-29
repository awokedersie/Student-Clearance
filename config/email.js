const nodemailer = require('nodemailer');

console.log('📬 Configuring SMTP for Email Delivery');

// Render and other cloud providers sometimes block outbound SMTP ports (465/587)
// We add strict timeouts so the application doesn't hang indefinitely.
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // true for 465, false for other ports
    auth: {
        user: (process.env.EMAIL_USER || '').trim(),
        pass: (process.env.EMAIL_PASS || '').trim()
    },
    // Fail quickly if the network blocks SMTP (e.g., Render free tier)
    connectionTimeout: 5000, 
    greetingTimeout: 5000,
    socketTimeout: 5000
});

module.exports = transporter;


const nodemailer = require('nodemailer');

// 📧 Create SMTP Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Use SSL/TLS for Port 465
    pool: true,   // Use connection pooling
    maxConnections: 5,
    maxMessages: 100,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    tls: {
        rejectUnauthorized: false // Helps prevent issues with self-signed certificates in some environments
    }
});

// 🔍 Verify Connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error:', error.message);
    } else {
        console.log('✅ SMTP Server is ready to take our messages');
    }
});

module.exports = transporter;

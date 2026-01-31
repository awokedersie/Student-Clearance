const nodemailer = require('nodemailer');

// 📧 Create SMTP Transporter (Optimized for Gmail)
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    logger: true, // Log SMTP traffic to Render console
    debug: true   // Include debug output
});

// 🔍 Verify Connection configuration
transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP Connection Error:', error);
    } else {
        console.log('✅ SMTP Server Connection Verified');
    }
});

module.exports = transporter;

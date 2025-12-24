const nodemailer = require('nodemailer');

// Log email configuration status on startup
console.log('📧 Email Configuration Check:');
console.log(`   EMAIL_USER: ${process.env.EMAIL_USER ? '✅ Set (' + process.env.EMAIL_USER + ')' : '❌ NOT SET'}`);
console.log(`   EMAIL_PASS: ${process.env.EMAIL_PASS ? '✅ Set (***hidden***)' : '❌ NOT SET'}`);

if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('⚠️  WARNING: Email credentials not configured! Forgot password feature will not work.');
}

const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS
    },
    // Add timeout and debug options
    connectionTimeout: 10000, // 10 seconds
    greetingTimeout: 10000,
    socketTimeout: 10000,
    debug: process.env.NODE_ENV !== 'production', // Enable debug in development
    logger: process.env.NODE_ENV !== 'production' // Enable logger in development
});

// Verify SMTP connection on startup (only in production to catch issues early)
if (process.env.NODE_ENV === 'production' && process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    transporter.verify((error, success) => {
        if (error) {
            console.error('❌ SMTP Connection Error:', error.message);
            console.error('   Please check your EMAIL_USER and EMAIL_PASS environment variables');
        } else {
            console.log('✅ SMTP Server is ready to send emails');
        }
    });
}

module.exports = transporter;

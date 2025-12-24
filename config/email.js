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
    }
});

// Verify SMTP connection asynchronously (don't block startup)
if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    // Use setTimeout to not block the module loading
    setTimeout(() => {
        transporter.verify((error, success) => {
            if (error) {
                console.error('❌ SMTP Connection Error:', error.message);
            } else {
                console.log('✅ SMTP Server is ready to send emails');
            }
        });
    }, 2000); // Wait 2 seconds after startup
}

module.exports = transporter;

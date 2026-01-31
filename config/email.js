const nodemailer = require('nodemailer');

// 📧 Create SMTP Transporter
const transporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 465,
    secure: true, // Port 465 uses SSL/TLS
    auth: {
        user: (process.env.EMAIL_USER || '').trim(),
        pass: (process.env.EMAIL_PASS || '').trim()
    },
    // Aggressive timeouts for cloud networks
    connectionTimeout: 60000, // 1 minute
    greetingTimeout: 60000,
    socketTimeout: 60000,
    logger: true,
    debug: true
});

// 🔍 Startup Verification with expanded logging
console.log('📬 Initializing Email System...');
console.log(`📬 EMAIL_USER detected: ${process.env.EMAIL_USER ? 'YES (Length: ' + process.env.EMAIL_USER.trim().length + ')' : 'NO'}`);
console.log(`📬 EMAIL_PASS detected: ${process.env.EMAIL_PASS ? 'YES (Length: ' + process.env.EMAIL_PASS.trim().length + ')' : 'NO'}`);

transporter.verify((error, success) => {
    if (error) {
        console.error('❌ SMTP INITIALIZATION FAILED:', error.message);
    } else {
        console.log('✅ SMTP CONNECTION ESTABLISHED SUCCESSFULLY');
    }
});

module.exports = transporter;

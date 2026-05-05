const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let transporter;

if (process.env.RESEND_API_KEY) {
    console.log('📬 Using Resend HTTP API for Email Delivery');
    const resend = new Resend(process.env.RESEND_API_KEY);
    
    transporter = {
        sendMail: async (mailOptions) => {
            try {
                const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';
                const { data, error } = await resend.emails.send({
                    from: from,
                    to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
                    subject: mailOptions.subject,
                    html: mailOptions.html || undefined,
                    text: mailOptions.text || undefined,
                });

                if (error) {
                    throw new Error(error.message || JSON.stringify(error));
                }

                console.log('✅ Email sent via Resend. ID:', data?.id);
                return { messageId: data?.id };
            } catch (err) {
                console.error('❌ Resend error:', err.message);
                throw err;
            }
        }
    };
} else if (process.env.EMAIL_USER && process.env.EMAIL_PASS) {
    console.log('📬 Using Nodemailer (SMTP) for Email Delivery');
    const smtpTransporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS
        }
    });

    transporter = {
        sendMail: (mailOptions) => smtpTransporter.sendMail(mailOptions)
    };
} else {
    console.warn('⚠️ No email configuration found (RESEND_API_KEY or EMAIL_USER/PASS missing)');
    transporter = {
        sendMail: async () => {
            console.warn('📧 Email sending skipped: No configuration');
            return { messageId: 'skipped' };
        }
    };
}

module.exports = transporter;

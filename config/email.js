const nodemailer = require('nodemailer');
const { Resend } = require('resend');

let transporter;

if (process.env.RESEND_API_KEY) {
    console.log('📬 Using Resend API for Production Email');
    const resend = new Resend(process.env.RESEND_API_KEY);

    // Create a compatible wrapper for Resend so we don't have to change other files
    transporter = {
        sendMail: async (options) => {
            try {
                const { data, error } = await resend.emails.send({
                    from: 'DBU Clearance <onboarding@resend.dev>', // Free tier default
                    to: options.to,
                    subject: options.subject,
                    html: options.html,
                    text: options.text
                });
                if (error) throw error;
                return { messageId: data.id };
            } catch (err) {
                console.error('❌ Resend API Error:', err);
                throw err;
            }
        },
        verify: (callback) => callback(null, true)
    };
} else {
    console.log('📬 Using Gmail SMTP for Local Development');
    transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: (process.env.EMAIL_USER || '').trim(),
            pass: (process.env.EMAIL_PASS || '').trim()
        }
    });
}

module.exports = transporter;

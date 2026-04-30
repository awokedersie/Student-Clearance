const { Resend } = require('resend');

console.log('📬 Using Resend HTTP API for Email Delivery');

const resend = new Resend(process.env.RESEND_API_KEY);

/**
 * Drop-in replacement for nodemailer transporter.
 * Accepts the same mailOptions shape: { from, to, subject, html, text }
 * Returns a result object compatible with nodemailer's sendMail response.
 */
const transporter = {
    sendMail: async (mailOptions) => {
        try {
            if (!process.env.RESEND_API_KEY) {
                throw new Error('RESEND_API_KEY environment variable is not set');
            }

            // Resend requires a verified sender domain.
            // For development / unverified domains, fall back to the Resend shared sender.
            const from = process.env.RESEND_FROM_EMAIL || 'onboarding@resend.dev';

            const { data, error } = await resend.emails.send({
                from:    from,
                to:      Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
                subject: mailOptions.subject,
                html:    mailOptions.html  || undefined,
                text:    mailOptions.text  || undefined,
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

module.exports = transporter;

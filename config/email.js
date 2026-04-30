const { Resend } = require('resend');

// Use Resend API (HTTPS-based) which works on Render free tier.
// Gmail SMTP (port 587/465) is blocked by Render's firewall on free plans.
const resend = new Resend(process.env.RESEND_API_KEY);

console.log('📬 Email delivery via Resend API (HTTPS)');

/**
 * Drop-in replacement for nodemailer transporter.sendMail()
 * Accepts the same mailOptions shape: { from, to, subject, html, text }
 */
const transporter = {
    sendMail: async (mailOptions) => {
        if (!process.env.RESEND_API_KEY) {
            throw new Error('RESEND_API_KEY environment variable is not set');
        }

        const { data, error } = await resend.emails.send({
            from: mailOptions.from || `DBU Clearance System <onboarding@resend.dev>`,
            to: Array.isArray(mailOptions.to) ? mailOptions.to : [mailOptions.to],
            subject: mailOptions.subject,
            html: mailOptions.html,
            text: mailOptions.text,
        });

        if (error) {
            throw new Error(error.message || 'Resend API error');
        }

        return { messageId: data?.id };
    }
};

module.exports = transporter;

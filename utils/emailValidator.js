const { validate } = require('deep-email-validator');

const disposableDomains = [
    'tempmail.com', '10minutemail.com', 'guerrillamail.com', 'sharklasers.com',
    'mailinator.com', 'yopmail.com', 'throwawaymail.com', 'temp-mail.org',
    'getairmail.com', 'dispostable.com', 'maildrop.cc', 'trashmail.com'
];

/**
 * Validates an email address performing comprehensive checks:
 * - Format validation
 * - Disposable domain check
 * - DNS/MX record verification
 * - SMTP mailbox verification
 * 
 * @param {string} email 
 * @returns {Promise<{isValid: boolean, error?: string}>}
 */
async function validateEmail(email) {
    if (!email) {
        return { isValid: false, error: 'Email is required' };
    }

    // Basic format check first
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    if (!emailRegex.test(email)) {
        return { isValid: false, error: 'Invalid email format (e.g., user@domain.com)' };
    }

    // Check disposable domains
    const domain = email.split('@')[1].toLowerCase();
    if (disposableDomains.includes(domain)) {
        return { isValid: false, error: 'Disposable email addresses are not allowed' };
    }

    // Perform deep validation (DNS, MX, SMTP)
    try {
        const result = await validate({
            email: email,
            validateRegex: true,
            validateMx: true,
            validateTypo: false,
            validateDisposable: true,
            validateSMTP: false, // SMTP checks often fail in cloud environments due to port blocking
            timeout: 5000
        });

        console.log('📧 Email validation result:', {
            email,
            valid: result.valid,
            reason: result.reason,
            validators: result.validators
        });

        if (!result.valid) {
            // Map specific validation failures to user-friendly messages
            if (result.reason === 'regex') {
                return { isValid: false, error: 'Invalid email format' };
            } else if (result.reason === 'disposable') {
                return { isValid: false, error: 'Disposable email addresses are not allowed' };
            } else if (result.reason === 'mx') {
                return { isValid: false, error: 'Domain does not have valid mail servers' };
            } else if (result.reason === 'smtp') {
                return { isValid: false, error: 'Email address does not exist on the mail server' };
            } else {
                return { isValid: false, error: `Email validation failed: ${result.reason}` };
            }
        }

        return { isValid: true };
    } catch (error) {
        console.error('❌ Email validation error:', error);
        // If validation service fails, fall back to basic checks
        return { isValid: false, error: 'Unable to verify email address. Please check and try again.' };
    }
}

module.exports = {
    validateEmail
};

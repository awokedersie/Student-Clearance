// Strong password validation function
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("• At least 8 characters long");
    if (password.length > 16) errors.push("• Maximum 16 characters allowed");
    if (!/[A-Z]/.test(password)) errors.push("• At least one uppercase letter (A-Z)");
    if (!/[a-z]/.test(password)) errors.push("• At least one lowercase letter (a-z)");
    if (!/[0-9]/.test(password)) errors.push("• At least one number (0-9)");
    if (!/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) errors.push("• At least one special character (!@#$%^&*()_-+=)");
    if (/\s/.test(password)) errors.push("• No spaces allowed");

    const commonPasswords = ['password', '12345678', 'qwerty123', 'admin123', 'welcome1'];
    if (commonPasswords.includes(password.toLowerCase())) {
        errors.push("• Password is too common, choose a stronger one");
    }
    return errors;
};

module.exports = {
    validatePassword
};

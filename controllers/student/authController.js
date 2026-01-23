const bcrypt = require('bcryptjs');
const transporter = require('../../config/email');
const responseHandler = require('../../utils/responseHandler');

// Function to send verification code email
async function sendVerificationCode(studentEmail, studentName, verificationCode) {
    try {
        // Check if email credentials are configured
        if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
            console.error('❌ Email credentials not configured! EMAIL_USER or EMAIL_PASS missing in environment variables');
            return false;
        }

        console.log(`📧 Attempting to send email to: ${studentEmail}`);
        console.log(`📧 Using email account: ${process.env.EMAIL_USER}`);

        const mailOptions = {
            from: `"DBU Clearance System" <${process.env.EMAIL_USER}>`,
            to: studentEmail,
            subject: 'Password Reset Verification Code',
            html: `
                <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                    <h2 style='color: #2c3e50;'>Password Reset Request</h2>
                    <p>Dear <strong>${studentName}</strong>,</p>
                    <p>You have requested to reset your password for the DBU Clearance System.</p>
                    
                    <div style='background: #f8f9fa; padding: 20px; border-radius: 8px; border: 2px dashed #2c3e50; text-align: center; margin: 20px 0;'>
                        <h3 style='margin: 0; color: #2c3e50;'>Your Verification Code:</h3>
                        <div style='font-size: 32px; font-weight: bold; color: #e74c3c; letter-spacing: 5px; margin: 15px 0;'>
                            ${verificationCode}
                        </div>
                        <p style='color: #7f8c8d; font-size: 14px; margin: 0;'>
                            This code will expire in 10 minutes
                        </p>
                    </div>
                    
                    <p style='color: #e74c3c; font-weight: bold;'>
                        ⚠️ If you didn't request this reset, please ignore this email.
                    </p>

                    <p>You can login here: <a href='https://dbu-clearance-system.onrender.com/login'>DBU Clearance Login</a></p>
                    
                    <hr style='border: none; border-top: 1px solid #ddd;'>
                    <p style='color: #7f8c8d; font-size: 12px;'>
                        This is an automated message. Please do not reply to this email.
                    </p>
                </div>
            `,
            text: `Password Reset Verification Code: ${verificationCode}. This code will expire in 10 minutes. If you didn't request this reset, please ignore this email.`
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Verification code email sent successfully:', info.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed with error:', error.message);
        console.error('❌ Full error details:', error);
        return false;
    }
}

// Strong password validation function
const validatePassword = (password) => {
    const errors = [];
    if (password.length < 8) errors.push("• At least 8 characters long");
    if (password.length > 16) errors.push("• Maximum 16 characters allowed");
    if (!/[A-Z]/.test(password)) errors.push("• At least one uppercase letter (A-Z)");
    if (!/[a-z]/.test(password)) errors.push("• At least one lowercase letter (a-z)");
    if (!/[0-9]/.test(password)) errors.push("• At least one number (0-9)");
    if (!/[!@#$%^&*()\-_=+{};:,<.>]/.test(password)) errors.push("• At least one special character");
    if (/\s/.test(password)) errors.push("• No spaces allowed");
    return errors;
};

exports.login = async (req, res) => {
    try {
        const { username, password } = req.body;
        const db = req.db;

        console.log('🔐 Login attempt for username:', username);

        // Check in student table
        const [students] = await db.execute(
            'SELECT * FROM student WHERE username = ?',
            [username]
        );

        if (students.length > 0) {
            const user = students[0];

            const validPassword = await bcrypt.compare(password, user.password);

            if (validPassword) {
                // Create session
                req.session.user = {
                    username: user.username,
                    student_id: user.student_id,
                    full_name: `${user.name} ${user.last_name}`,
                    profile_picture: user.profile_picture,
                    role: 'student',
                    name: user.name,
                    lastName: user.last_name,
                    email: user.email,
                    department: user.department
                };

                console.log('🎉 Student login successful for:', user.full_name);

                return responseHandler.success(res, { user: req.session.user }, 'Login successful');
            }
        }

        console.log('❌ Login failed - invalid credentials for username:', username);
        return responseHandler.unauthorized(res, 'Invalid username or password');

    } catch (error) {
        return responseHandler.error(res, 'Login failed due to server error', 500, error);
    }
};

exports.getChangePasswordData = (req, res) => {
    if (!req.session.user) {
        return res.status(401).json({ success: false, message: 'Not logged in' });
    }
    res.json({
        success: true,
        user: req.session.user
    });
};

exports.changePassword = async (req, res) => {
    try {
        const { currentPassword, newPassword, confirmPassword } = req.body;
        const user = req.session.user;
        const db = req.db;

        if (!user) {
            return res.status(401).json({ success: false, message: 'Session expired. Please login again.' });
        }

        console.log(`🔐 Password change attempt for ${user.role}: ${user.username}`);

        // Validation
        if (!currentPassword || !newPassword || !confirmPassword) {
            return res.status(400).json({ success: false, message: 'All fields are required!' });
        }

        if (newPassword !== confirmPassword) {
            return res.status(400).json({ success: false, message: 'New passwords do not match!' });
        }

        const passwordErrors = validatePassword(newPassword);
        if (passwordErrors.length > 0) {
            return res.status(400).json({
                success: false,
                message: "Password requirements not met: " + passwordErrors.join(". ")
            });
        }

        let userRecord;
        const table = user.role === 'student' ? 'student' : 'admin';

        const [records] = await db.execute(
            `SELECT * FROM ${table} WHERE username = ?`,
            [user.username]
        );
        userRecord = records[0];

        if (!userRecord) {
            return res.status(404).json({ success: false, message: 'User record not found!' });
        }

        // Verify current password
        const validCurrentPassword = await bcrypt.compare(currentPassword, userRecord.password);
        if (!validCurrentPassword) {
            return res.status(401).json({ success: false, message: 'Current password is incorrect!' });
        }

        // Hash new password and update
        const hashedNewPassword = await bcrypt.hash(newPassword, 10);
        await db.execute(
            `UPDATE ${table} SET password = ? WHERE username = ?`,
            [hashedNewPassword, user.username]
        );

        console.log(`✅ Password changed successfully for ${user.role}: ${user.username}`);

        res.json({
            success: true,
            message: 'Password changed successfully!'
        });

    } catch (error) {
        console.error('💥 Change password error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to change password: ' + error.message
        });
    }
};

exports.getForgotPasswordData = (req, res) => {
    res.json({
        success: true,
        user: req.session.user
    });
};

exports.handleForgotPassword = async (req, res) => {
    try {
        const { name, email } = req.body;
        const db = req.db;

        console.log('🔐 Forgot password attempt for:', { name, email });

        // Find student by name and email
        const [students] = await db.execute(
            'SELECT id, name, email FROM student WHERE name = ? AND email = ?',
            [name, email]
        );

        if (students.length > 0) {
            const user = students[0];

            // Generate 6-digit verification code
            const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

            // Store code in session with expiration time (10 minutes)
            req.session.verification_code = verificationCode;
            req.session.verification_expiry = Date.now() + 600000; // 10 minutes
            req.session.reset_student_id = user.id;
            req.session.reset_email = email;

            console.log('🔑 Generated verification code:', verificationCode);

            // Send verification code via email
            const emailSent = await sendVerificationCode(email, user.name, verificationCode);

            if (emailSent) {
                console.log('✅ Verification code sent successfully');
                return res.json({
                    success: true,
                    message: 'Verification code sent to your email'
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: 'Failed to send verification code. Please try again.'
                });
            }
        } else {
            return res.status(404).json({
                success: false,
                message: 'No account found with that Name and Email.'
            });
        }
    } catch (error) {
        console.error('💥 Forgot password error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again.'
        });
    }
};

exports.getVerifyCodeData = (req, res) => {
    res.json({
        success: !!req.session.verification_code,
        message: req.session.verification_code ? 'Waiting for code' : 'No active verification'
    });
};

exports.handleVerifyCode = async (req, res) => {
    try {
        const { verification_code } = req.body;

        // Check if verification code exists and hasn't expired
        if (!req.session.verification_code || !req.session.verification_expiry) {
            return res.redirect('/forgot-password');
        }

        // Check if code has expired
        if (Date.now() > req.session.verification_expiry) {
            req.session.verification_code = null;
            req.session.verification_expiry = null;
            return res.status(400).json({
                success: false,
                message: 'Verification code has expired. Please request a new one.'
            });
        }

        // Check if code matches
        if (verification_code !== req.session.verification_code) {
            return res.status(400).json({
                success: false,
                message: 'Invalid verification code. Please try again.'
            });
        }

        // Code is valid
        req.session.verified_for_reset = true;
        return res.json({
            success: true,
            message: 'Code verified successfully'
        });

    } catch (error) {
        console.error('💥 Verify code error:', error);
        return res.status(500).json({
            success: false,
            message: 'An error occurred. Please try again.'
        });
    }
};

exports.getResetPasswordData = (req, res) => {
    res.json({
        success: !!req.session.verified_for_reset
    });
};

exports.handleResetPassword = async (req, res) => {
    try {
        const { new_password, confirm_password } = req.body;
        const db = req.db;

        // Check if user is verified for reset
        if (!req.session.verified_for_reset || !req.session.reset_student_id) {
            return res.redirect('/forgot-password');
        }

        // Validate passwords
        if (new_password !== confirm_password) {
            return res.status(400).json({
                success: false,
                message: 'Passwords do not match.'
            });
        }

        // Strong password validation
        if (new_password.length < 8) {
            return res.status(400).json({
                success: false,
                message: 'Password must be at least 8 characters long.'
            });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(new_password, 10);

        // Update password in database
        await db.execute(
            'UPDATE student SET password = ? WHERE id = ?',
            [hashedPassword, req.session.reset_student_id]
        );

        console.log('✅ Password reset successfully for student ID:', req.session.reset_student_id);

        // Clear reset session data
        req.session.verification_code = null;
        req.session.verification_expiry = null;
        req.session.reset_student_id = null;
        req.session.reset_email = null;
        req.session.verified_for_reset = null;

        return res.json({
            success: true,
            message: 'Password reset successful!'
        });

    } catch (error) {
        console.error('💥 Reset password error:', error);
        return res.status(500).json({
            success: false,
            message: 'Failed to reset password. Please try again.'
        });
    }
};

exports.getResetSuccessData = (req, res) => {
    res.json({
        success: true,
        message: 'Password reset was successful'
    });
};

exports.logout = (req, res) => {
    console.log('👋 User logging out:', req.session.user?.username);
    req.session.destroy((err) => {
        if (err) {
            console.error('💥 Logout error:', err);
            return res.status(500).json({ success: false, message: 'Logout failed' });
        }
        res.json({ success: true, message: 'Logged out successfully' });
    });
};

exports.getCurrentUser = (req, res) => {
    res.json({
        success: true,
        user: req.session.user || null
    });
};

exports.checkSession = (req, res) => {
    res.json({
        session: req.session.user || 'No user logged in',
        sessionId: req.sessionID
    });
};

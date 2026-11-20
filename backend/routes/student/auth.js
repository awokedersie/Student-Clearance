const express = require('express');
const router = express.Router();
const authController = require('../../controllers/student/authController');

// Show student login page - Handled by React

// Handle student login
router.post('/login', authController.login);

// Show change password page (Data endpoint)
router.get('/change-password-data', authController.getChangePasswordData);

// Pass-through for SPA refresh
router.get('/change-password', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/change-password-data');
    }
    next();
});

// Handle password change
router.post('/change-password', authController.changePassword);

// Forgot Password Page (Data endpoint)
router.get('/forgot-password-data', authController.getForgotPasswordData);

// Pass-through for SPA refresh
router.get('/forgot-password', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/forgot-password-data');
    }
    next();
});

// Handle Forgot Password Submission
router.post('/forgot-password', authController.handleForgotPassword);

// Verify Code Page (Data endpoint)
router.get('/verify-code-data', authController.getVerifyCodeData);

// Pass-through for SPA refresh
router.get('/verify-code', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/verify-code-data');
    }
    next();
});

// Handle Verify Code Submission
router.post('/verify-code', authController.handleVerifyCode);

// Reset Password Page (Data endpoint)
router.get('/reset-password-data', authController.getResetPasswordData);

// Pass-through for SPA refresh
router.get('/reset-password', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/reset-password-data');
    }
    next();
});

// Handle Reset Password Submission
router.post('/reset-password', authController.handleResetPassword);

// Reset Success Page (Data endpoint)
router.get('/reset-success-data', authController.getResetSuccessData);

// Pass-through for SPA refresh
router.get('/reset-success', (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/reset-success-data');
    }
    next();
});

// Logout
router.get('/logout', authController.logout);

// Public "Current User" endpoint for layout syncing
router.get('/current-user', authController.getCurrentUser);

// Check session endpoint (for debugging)
router.get('/check-session', authController.checkSession);

module.exports = router;
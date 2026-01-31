const express = require('express');
const router = express.Router();
const studentController = require('../../controllers/student/studentController');
const { requireStudent } = require('../../middleware/authMiddleware');

// Dashboard Routes
router.get('/dashboard/data', requireStudent, studentController.getDashboardData);

router.get('/dashboard', requireStudent, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/dashboard/data');
    }
    next();
});

// Profile Routes
router.get('/profile/data', requireStudent, studentController.getProfileData);

router.get('/profile', requireStudent, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/profile/data');
    }
    next();
});

router.post('/profile', requireStudent, studentController.upload.single('profile_photo'), studentController.updateProfile);

router.post('/profile/upload-photo', requireStudent, studentController.upload.single('file'), studentController.uploadProfilePicture);
router.post('/profile/remove-photo', requireStudent, studentController.removeProfilePicture);

// Clearance Status Routes
// Alias to support frontend calls
router.get('/clearance-status/data', requireStudent, studentController.getClearanceStatusData);
router.get('/my-status/data', requireStudent, studentController.getClearanceStatusData);

router.get('/my-status', requireStudent, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/student/my-status/data');
    }
    next();
});

// Change Password Routes
router.get('/change-password/data', requireStudent, studentController.getChangePasswordData);

router.post('/change-password', requireStudent, studentController.changePassword);

// Clearance Request Routes
router.get('/clearance-request/data', requireStudent, studentController.getClearanceRequestData);
router.post('/clearance-request', requireStudent, studentController.submitClearanceRequest);

// Notification Routes
router.get('/notifications/unread-count', requireStudent, studentController.getUnreadNotificationCount);
router.get('/notifications/data', requireStudent, studentController.getNotificationsData);
router.get('/download-certificate', requireStudent, studentController.downloadCertificate);

module.exports = router;

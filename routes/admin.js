const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const studentController = require('../controllers/studentController');
const { requireAdmin, requireSystemAdmin, requireLibraryAdmin, requireRegistrarAdmin } = require('../middleware/authMiddleware');

// Authenticated Routes
router.post('/login', adminController.login);
router.get('/logout', adminController.logout);

router.get('/dashboard', adminController.getDashboard);

router.get('/system/dashboard/data', requireSystemAdmin, adminController.getSystemDashboardData);

router.get('/system/dashboard', requireSystemAdmin, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/admin/system/dashboard/data');
    }
    next();
});

router.get('/clearance-settings/data', requireSystemAdmin, adminController.getClearanceSettingsData);
router.post('/clearance-settings', requireSystemAdmin, adminController.updateClearanceSettings);
router.post('/clearance-settings/action/:action', requireSystemAdmin, adminController.handleClearanceAction);

// Manage Admins
router.get('/system/manage-admins/data', requireSystemAdmin, adminController.getManageAdminsData);
router.post('/system/manage-admins/add', requireSystemAdmin, adminController.addAdmin);
router.post('/system/manage-admins/update/:id', requireSystemAdmin, adminController.updateAdmin);
router.get('/system/manage-admins/delete/:id', requireSystemAdmin, adminController.deleteAdmin);

// Manage Students
router.get('/system/manage-students/data', requireSystemAdmin, adminController.getManageStudentsData);
router.post('/system/manage-students/add', requireSystemAdmin, studentController.upload.single('profile_picture'), adminController.addStudent);
router.post('/system/manage-students/update', requireSystemAdmin, studentController.upload.single('profile_picture'), adminController.updateStudent);
router.get('/system/manage-students/delete/:studentId', requireSystemAdmin, adminController.deleteStudent);
router.get('/system/manage-students/toggle-status/:studentId', requireSystemAdmin, adminController.toggleStudentStatus);
router.post('/system/manage-students/bulk-actions', requireSystemAdmin, adminController.bulkStudentActions);

// Audit Logs (Accessible by System Admin & Registrar)
router.get('/system/audit-logs/data', requireRegistrarAdmin, adminController.getAuditLogs);


module.exports = router;

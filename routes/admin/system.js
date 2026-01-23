const express = require('express');
const router = express.Router();
const systemController = require('../../controllers/admin/systemController');
const studentController = require('../../controllers/student/studentController');
const { requireAdmin, requireSystemAdmin, requireLibraryAdmin, requireRegistrarAdmin } = require('../../middleware/authMiddleware');

// Authenticated Routes
router.post('/login', systemController.login);
router.get('/logout', systemController.logout);

router.get('/dashboard', systemController.getDashboard);

router.get('/system/dashboard/data', requireSystemAdmin, systemController.getSystemDashboardData);

router.get('/system/dashboard', requireSystemAdmin, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/admin/system/dashboard/data');
    }
    next();
});

router.get('/clearance-settings/data', requireSystemAdmin, systemController.getClearanceSettingsData);
router.post('/clearance-settings', requireSystemAdmin, systemController.updateClearanceSettings);
router.post('/clearance-settings/action/:action', requireSystemAdmin, systemController.handleClearanceAction);

// Manage Admins
router.get('/system/manage-admins/data', requireSystemAdmin, systemController.getManageAdminsData);
router.post('/system/manage-admins/add', requireSystemAdmin, systemController.addAdmin);
router.post('/system/manage-admins/update/:id', requireSystemAdmin, systemController.updateAdmin);
router.get('/system/manage-admins/delete/:id', requireSystemAdmin, systemController.deleteAdmin);

// Manage Students
router.get('/system/manage-students/data', requireSystemAdmin, systemController.getManageStudentsData);
router.post('/system/manage-students/add', requireSystemAdmin, studentController.upload.single('profile_picture'), systemController.addStudent);
router.post('/system/manage-students/update', requireSystemAdmin, studentController.upload.single('profile_picture'), systemController.updateStudent);
router.get('/system/manage-students/delete/:studentId', requireSystemAdmin, systemController.deleteStudent);
router.get('/system/manage-students/toggle-status/:studentId', requireSystemAdmin, systemController.toggleStudentStatus);
router.post('/system/manage-students/bulk-actions', requireSystemAdmin, systemController.bulkStudentActions);

// Audit Logs (Accessible by System Admin & Registrar)
router.get('/system/audit-logs/data', requireRegistrarAdmin, systemController.getAuditLogs);


module.exports = router;

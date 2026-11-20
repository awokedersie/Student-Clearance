const express = require('express');
const router = express.Router();
const departmentController = require('../../controllers/admin/departmentController');

// Middleware to check if user is department admin
const requireDepartmentAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'department_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Department Admin' });
        }
        res.redirect('/admin/login');
    }
};

router.get('/departments/department/data', requireDepartmentAdmin, departmentController.getDashboardData);

// SPA redirect
router.get('/departments/department', requireDepartmentAdmin, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/admin/departments/department/data');
    }
    next();
});

router.post('/departments/department', requireDepartmentAdmin, departmentController.handleAction);

module.exports = router;
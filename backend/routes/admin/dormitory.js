const express = require('express');
const router = express.Router();
const dormitoryController = require('../../controllers/admin/dormitoryController');

// Middleware to check if user is dormitory admin
const requireDormitoryAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'dormitory_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Dormitory Admin' });
        }
        res.redirect('/admin/login');
    }
};

router.get('/departments/dormitory/data', requireDormitoryAdmin, dormitoryController.getDashboardData);

// SPA redirect
router.get('/departments/dormitory', requireDormitoryAdmin, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/admin/departments/dormitory/data');
    }
    next();
});

router.post('/departments/dormitory', requireDormitoryAdmin, dormitoryController.handleAction);


module.exports = router;
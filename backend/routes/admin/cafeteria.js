const express = require('express');
const router = express.Router();
const cafeteriaController = require('../../controllers/admin/cafeteriaController');

// Middleware to check if user is cafeteria admin
const requireCafeteriaAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'cafeteria_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Cafeteria Admin' });
        }
        res.redirect('/admin/login');
    }
};

router.get('/departments/cafeteria/data', requireCafeteriaAdmin, cafeteriaController.getDashboardData);

// SPA redirect
router.get('/departments/cafeteria', requireCafeteriaAdmin, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/admin/departments/cafeteria/data');
    }
    next();
});

router.post('/departments/cafeteria', requireCafeteriaAdmin, cafeteriaController.handleAction);

module.exports = router;
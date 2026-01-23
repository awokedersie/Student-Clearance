const express = require('express');
const router = express.Router();
const protectorController = require('../../controllers/admin/protectorController');

// Middleware to check if user is personal protector
const requireProtectorAdmin = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'personal_protector') {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Personal Protector' });
        }
        res.redirect('/admin/login');
    }
};

router.get('/protector/dashboard/data', requireProtectorAdmin, protectorController.getDashboardData);

// SPA redirect
router.get('/protector/dashboard', requireProtectorAdmin, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/admin/protector/dashboard/data');
    }
    next();
});

module.exports = router;
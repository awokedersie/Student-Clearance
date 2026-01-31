const express = require('express');
const router = express.Router();
const registrarController = require('../../controllers/admin/registrarController');

// Middleware to check if user is registrar admin
const requireRegistrarAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'registrar_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Registrar Admin' });
        }
        res.redirect('/admin/login');
    }
};

router.get('/registrar/dashboard/data', requireRegistrarAdmin, registrarController.getDashboardData);

// SPA redirect
router.get('/registrar/dashboard', requireRegistrarAdmin, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/admin/registrar/dashboard/data');
    }
    next();
});

router.post('/registrar/dashboard', requireRegistrarAdmin, registrarController.handleAction);

module.exports = router;
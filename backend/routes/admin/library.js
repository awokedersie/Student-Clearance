const express = require('express');
const router = express.Router();
const libraryController = require('../../controllers/admin/libraryController');

// Middleware to check if user is library admin
const requireLibraryAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'library_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Library Admin' });
        }
        res.redirect('/admin/login');
    }
};

router.get('/departments/library/data', requireLibraryAdmin, libraryController.getDashboardData);

// SPA redirect
router.get('/departments/library', requireLibraryAdmin, (req, res, next) => {
    if (req.xhr || req.headers.accept?.includes('application/json')) {
        return res.redirect('/admin/departments/library/data');
    }
    next();
});

router.post('/departments/library', requireLibraryAdmin, libraryController.handleAction);

module.exports = router;

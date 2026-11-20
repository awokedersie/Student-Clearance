const requireStudent = (req, res, next) => {
    if (req.session.user && req.session.user.role === 'student') {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Authentication required' });
        }
        res.redirect('/login');
    }
};

const requireAdmin = (req, res, next) => {
    if (!req.session.user || req.session.user.role === 'student') {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as admin' });
        }
        return res.redirect('/admin/login');
    }
    next();
};

const requireSystemAdmin = (req, res, next) => {
    if (!req.session.user || (req.session.user.role !== 'system_admin' && req.session.user.role !== 'super_admin')) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - System Admin access required' });
        }
        return res.redirect('/admin/login');
    }
    next();
};

const requireLibraryAdmin = (req, res, next) => {
    if (!req.session.user || (req.session.user.role !== 'library_admin' && req.session.user.role !== 'system_admin' && req.session.user.role !== 'super_admin')) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Library Admin access required' });
        }
        return res.redirect('/admin/login');
    }
    next();
};

const requireRegistrarAdmin = (req, res, next) => {
    if (!req.session.user || (req.session.user.role !== 'registrar_admin' && req.session.user.role !== 'system_admin' && req.session.user.role !== 'super_admin')) {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Registrar/System Admin access required' });
        }
        return res.redirect('/admin/login');
    }
    next();
};

module.exports = {
    requireStudent,
    requireAdmin,
    requireSystemAdmin,
    requireLibraryAdmin,
    requireRegistrarAdmin
};

const express = require('express');
const router = express.Router();

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

// Personal Protector Dashboard - View Final Clearance Records
// Personal Protector Dashboard - Data Route (Renamed to avoid SPA route collision)
router.get('/protector/dashboard/data', requireProtectorAdmin, async (req, res) => {
    try {
        console.log('🏁 Starting protector dashboard render');
        const db = req.db;
        // Get current academic year from settings
        const [settingsRows = []] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        // Get search parameter
        const search = req.query.search || '';

        console.log('📊 Fetching final clearance records...');

        let query = `
            SELECT fc.*, CONCAT(fc.name, ' ', fc.last_name) as student_name,
                   fc.date_sent as updated_at
            FROM final_clearance fc
            WHERE fc.status = 'approved' AND fc.academic_year = ?
        `;

        let queryParams = [currentAcademicYear];

        // Apply search filter
        if (search) {
            query += " AND (fc.student_id LIKE ? OR fc.name LIKE ? OR fc.last_name LIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        query += " ORDER BY fc.date_sent DESC";

        console.log('🔍 Executing query...');
        const [clearanceRecords] = await db.execute(query, queryParams);
        console.log(`📋 Found ${clearanceRecords.length} approved records`);

        // Calculate stats
        const stats = {
            total: clearanceRecords.length,
            approved: clearanceRecords.length,
            pending: 0,
            rejected: 0
        };

        res.json({
            success: true,
            user: req.session.user,
            all_requests: clearanceRecords,
            stats: stats,
            search: search
        });

        console.log('✅ Protector dashboard rendered successfully');

    } catch (error) {
        console.error('❌ Error loading protector dashboard:', error);
        res.status(500).render('error', {
            message: 'Error loading protector dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

module.exports = router;
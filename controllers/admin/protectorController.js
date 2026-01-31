exports.getDashboardData = async (req, res) => {
    try {
        console.log('🏁 Starting protector dashboard render');
        const db = req.db;
        // Get current academic year from settings
        const [settingsRows = []] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        // Get search parameter
        const logger = require('../../utils/logger');
        const search = req.query.search || '';

        console.log('📊 Fetching final clearance records...');

        let query = `
            SELECT student_id, name, last_name, 
                   CONCAT(name, ' ', last_name) as student_name,
                   requested_at as date_sent,
                   requested_at as updated_at,
                   status
            FROM clearance_requests
            WHERE target_department = 'registrar' AND status = 'approved' AND academic_year = ?
        `;

        let queryParams = [currentAcademicYear];

        // Apply search filter
        if (search) {
            query += " AND (student_id ILIKE ? OR name ILIKE ? OR last_name ILIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        query += " ORDER BY requested_at DESC";

        const [clearanceRecords] = await db.execute(query, queryParams);

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

    } catch (error) {
        console.error('❌ Error loading protector dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading protector dashboard: ' + error.message
        });
    }
};

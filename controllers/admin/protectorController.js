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
        const search = req.query.search || '';

        console.log('📊 Fetching final clearance records...');

        let query = `
            SELECT cr.student_id, cr.name, cr.last_name, 
                   CONCAT(cr.name, ' ', cr.last_name) as student_name,
                   cr.requested_at as date_sent,
                   cr.requested_at as updated_at,
                   cr.status,
                   s.exit_verified,
                   s.exit_time
            FROM clearance_requests cr
            JOIN student s ON cr.student_id = s.student_id
            WHERE cr.target_department = 'registrar' AND cr.status = 'approved' AND cr.academic_year = ?
        `;

        let queryParams = [currentAcademicYear];

        // Apply search filter
        if (search) {
            query += " AND (cr.student_id ILIKE ? OR cr.name ILIKE ? OR cr.last_name ILIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        query += " ORDER BY cr.requested_at DESC";

        const [clearanceRecords] = await db.execute(query, queryParams);

        // Calculate stats
        const stats = {
            total: clearanceRecords.length,
            approved: clearanceRecords.filter(r => r.exit_verified).length, // using approved for 'Exited'
            pending: clearanceRecords.filter(r => !r.exit_verified).length, // pending for 'Not Exited'
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

exports.verifyExit = async (req, res) => {
    try {
        const db = req.db;
        const { student_id } = req.body;
        const adminId = req.session.user?.id; // Protector admin ID

        if (!student_id) {
            return res.status(400).json({ success: false, message: 'Student ID is required' });
        }

        if (!adminId) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Invalid Session' });
        }

        console.log(`🛡️ Verifying exit for student: ${student_id} by admin: ${adminId}`);

        // Update student table
        await db.execute(
            `UPDATE student 
             SET exit_verified = TRUE, 
                 exit_time = NOW(), 
                 verified_by = ? 
             WHERE student_id = ?`,
            [adminId, student_id]
        );

        // Also log to audit logs
        await db.execute(
            `INSERT INTO audit_logs (admin_id, admin_name, admin_role, action, target_student_id, details, ip_address)
             VALUES (?, ?, ?, 'VERIFY_EXIT', ?, 'Student exit verified', ?)`,
            [
                adminId,
                `${req.session.user.name} ${req.session.user.lastName}`,
                req.session.user.role,
                student_id,
                req.ip || req.connection.remoteAddress
            ]
        );

        res.json({
            success: true,
            message: 'Student exit verified successfully'
        });

    } catch (error) {
        console.error('❌ Error verifying exit:', error);
        res.status(500).json({
            success: false,
            message: 'Error verifying exit: ' + error.message
        });
    }
};

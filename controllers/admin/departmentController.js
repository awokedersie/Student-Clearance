const logger = require('../../utils/logger');

exports.getDashboardData = async (req, res) => {
    try {
        console.log('🏁 Starting department dashboard render');
        const db = req.db;
        // Get current academic year from settings
        const [settingsRows = []] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const adminDepartment = req.session.user.department;

        // Get search and filter parameters
        const search = req.query.search || '';
        const status_filter = req.query.status || 'all';

        console.log('📊 Fetching statistics...');
        const [statsRows] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN dc.status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN dc.status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN dc.status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM clearance_requests dc
            LEFT JOIN (
                SELECT student_id FROM clearance_requests WHERE status = 'approved' AND academic_year = ? AND target_department = 'dormitory' GROUP BY student_id
            ) dorm ON dc.student_id = dorm.student_id
            WHERE dc.academic_year = ? AND dc.student_department = ? AND dc.target_department = 'department'
            AND (dc.status != 'pending' OR dorm.student_id IS NOT NULL)
        `, [currentAcademicYear, currentAcademicYear, adminDepartment]);

        const stats = statsRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
        // Clean nulls
        stats.total = stats.total || 0;
        stats.pending = stats.pending || 0;
        stats.approved = stats.approved || 0;
        stats.rejected = stats.rejected || 0;

        console.log('📈 Stats fetched:', stats);

        // Build main query for requests
        let mainQuery = `
            SELECT 
                dc.*, 
                CONCAT(dc.name, ' ', dc.last_name) as student_name,
                dc.student_department as department,
                dc.requested_at as updated_at,
                (SELECT status FROM clearance_requests WHERE student_id = dc.student_id AND academic_year = ? AND target_department = 'library' ORDER BY id DESC LIMIT 1) as library_status,
                (SELECT status FROM clearance_requests WHERE student_id = dc.student_id AND academic_year = ? AND target_department = 'cafeteria' ORDER BY id DESC LIMIT 1) as cafeteria_status,
                (SELECT status FROM clearance_requests WHERE student_id = dc.student_id AND academic_year = ? AND target_department = 'dormitory' ORDER BY id DESC LIMIT 1) as dormitory_status,
                (SELECT status FROM clearance_requests WHERE student_id = dc.student_id AND academic_year = ? AND target_department = 'registrar' ORDER BY id DESC LIMIT 1) as registrar_status,
                (CASE 
                    WHEN dc.status = 'pending' AND 
                         (SELECT status FROM clearance_requests WHERE student_id = dc.student_id AND academic_year = ? AND target_department = 'library' ORDER BY id DESC LIMIT 1) = 'approved' AND
                         (SELECT status FROM clearance_requests WHERE student_id = dc.student_id AND academic_year = ? AND target_department = 'cafeteria' ORDER BY id DESC LIMIT 1) = 'approved' AND
                         (SELECT status FROM clearance_requests WHERE student_id = dc.student_id AND academic_year = ? AND target_department = 'dormitory' ORDER BY id DESC LIMIT 1) = 'approved'
                    THEN 2 
                    WHEN dc.status = 'pending' THEN 1 
                    ELSE 0 
                END) as priority_order
            FROM clearance_requests dc 
            LEFT JOIN (
                SELECT student_id 
                FROM clearance_requests 
                WHERE status = 'approved' AND academic_year = ? AND target_department = 'library'
                GROUP BY student_id
            ) lc ON dc.student_id = lc.student_id
            LEFT JOIN (
                SELECT student_id 
                FROM clearance_requests 
                WHERE status = 'approved' AND academic_year = ? AND target_department = 'cafeteria'
                GROUP BY student_id
            ) cc ON dc.student_id = cc.student_id
            LEFT JOIN (
                SELECT student_id 
                FROM clearance_requests 
                WHERE status = 'approved' AND academic_year = ? AND target_department = 'dormitory'
                GROUP BY student_id
            ) dmc ON dc.student_id = dmc.student_id
            WHERE dc.academic_year = ? AND dc.target_department = 'department'
            AND dc.student_department = ?
            AND (dc.status != 'pending' OR (lc.student_id IS NOT NULL AND cc.student_id IS NOT NULL AND dmc.student_id IS NOT NULL))
        `;

        let queryParams = [
            currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear, // SELECT subqueries
            currentAcademicYear, currentAcademicYear, currentAcademicYear, // CASE subqueries
            currentAcademicYear, currentAcademicYear, currentAcademicYear, // JOIN subqueries
            currentAcademicYear, adminDepartment // WHERE clause
        ];

        if (search) {
            mainQuery += " AND (dc.name ILIKE ? OR dc.student_id ILIKE ? OR dc.last_name ILIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (status_filter !== 'all') {
            mainQuery += " AND dc.status = ?";
            queryParams.push(status_filter);
        }

        // ORDER BY to prioritize pending requests with dormitory approved
        mainQuery += " ORDER BY priority_order DESC, dc.status = 'pending' DESC, dc.requested_at DESC";

        const [allRequests] = await db.execute(mainQuery, queryParams);

        // Process each request
        const processedRequests = allRequests.map((request) => {
            const library_status = request.library_status || 'pending';
            const cafeteria_status = request.cafeteria_status || 'pending';
            const dormitory_status = request.dormitory_status || 'pending';
            const registrar_status = request.registrar_status || 'pending';

            // Locked if already approved OR Registrar is already approved
            let locked_by_dept = null;
            if (registrar_status === 'approved') locked_by_dept = 'Registrar';

            const is_locked = (locked_by_dept !== null);

            // All previous stages must be approved
            const can_approve = (library_status === 'approved' && cafeteria_status === 'approved' && dormitory_status === 'approved') && !is_locked;
            const show_approve = (request.status !== 'approved') && !is_locked;
            const show_reject = (request.status !== 'rejected') && !is_locked;

            return {
                ...request,
                is_locked,
                locked_by_dept,
                can_approve: (can_approve && request.status !== 'approved'),
                can_reject: (!is_locked && request.status !== 'rejected'),
                show_approve,
                show_reject
            };
        });

        res.json({
            success: true,
            user: req.session.user,
            stats: stats,
            all_requests: processedRequests,
            search: search,
            status: status_filter,
            adminDepartment: adminDepartment
        });

    } catch (error) {
        console.error('❌ Error loading department dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading department dashboard: ' + error.message
        });
    }
};

exports.handleAction = async (req, res) => {
    try {
        console.log('🔄 Processing department action...');
        const db = req.db;
        const { action_type, request_id, reject_reason, bulk_action, selected_requests, bulk_reject_reason } = req.body;

        let requestIds = [];
        if (bulk_action) {
            requestIds = Array.isArray(selected_requests) ? selected_requests : [selected_requests];
        } else {
            requestIds = [request_id];
        }

        if (!requestIds || requestIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No requests selected' });
        }

        const status = (action_type === 'approve' || bulk_action === 'approve') ? 'approved' : 'rejected';
        const reason = bulk_action ? bulk_reject_reason : reject_reason;

        let processedCount = 0;
        for (const id of requestIds) {
            // Check if student is locked by Registrar or already approved by department
            const [clearanceRows] = await db.execute("SELECT student_id, academic_year, name, last_name, status FROM clearance_requests WHERE id = ? AND target_department = 'department'", [id]);
            if (clearanceRows.length === 0) continue;

            const { student_id, academic_year, name, last_name } = clearanceRows[0];
            const studentName = `${name} ${last_name}`;

            if (true) { // Logic to check locks
                const [lockedBy] = await db.execute(`
                    SELECT COUNT(*) as registrar_approved FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = 'registrar' AND status = 'approved'
                `, [student_id, academic_year]);

                if (lockedBy[0].registrar_approved > 0) {
                    console.log(`🚫 Action blocked: Student ${student_id} is locked by Registrar approval.`);
                    continue; // Skip locked student
                }
            }

            await db.execute(
                "UPDATE clearance_requests SET status = ?, reject_reason = ?, approved_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END, approved_by = ?, requested_at = NOW() WHERE id = ?",
                [status, reason || null, status, req.session.user.full_name, id]
            );

            // Audit Log
            const actionLabel = status === 'approved' ? 'APPROVE_STUDENT' : 'REJECT_STUDENT';
            const logDetails = status === 'approved'
                ? `Department head clearance granted for: ${studentName}`
                : `Department head clearance rejected for: ${studentName}. Reason: ${reason || 'No reason specified'}`;

            await logger.log(req, actionLabel, student_id, logDetails, studentName);

            processedCount++;
        }

        if (processedCount === 0 && requestIds.length > 0) {
            return res.json({ success: false, message: 'Action Restricted: Selected student(s) are already approved by the Registrar.' });
        }

        res.json({
            success: true,
            message: `${processedCount} request(s) ${status} successfully`
        });

    } catch (error) {
        console.error('❌ Error processing department action:', error);
        res.status(500).json({ success: false, message: 'Error processing request: ' + error.message });
    }
};

const logger = require('../../utils/logger');

exports.getDashboardData = async (req, res) => {
    try {
        console.log('🏁 Starting cafeteria dashboard render');
        const db = req.db;
        // Get current academic year from settings
        const [settingsRows = []] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        // Get search and filter parameters
        const search = req.query.search || '';
        const status_filter = req.query.status || 'all';

        console.log('📊 Fetching statistics...');
        const [statsRows] = await db.execute(`
            SELECT 
                COUNT(*) as total,
                SUM(CASE WHEN cc.status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN cc.status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN cc.status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM clearance_requests cc
            LEFT JOIN (
                SELECT student_id FROM clearance_requests WHERE status = 'approved' AND academic_year = ? AND target_department = 'library' GROUP BY student_id
            ) lc ON cc.student_id = lc.student_id
            WHERE cc.academic_year = ? AND cc.target_department = 'cafeteria'
            AND (cc.status != 'pending' OR lc.student_id IS NOT NULL)
        `, [currentAcademicYear, currentAcademicYear]);

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
                cc.*, 
                CONCAT(cc.name, ' ', cc.last_name) as student_name,
                cc.student_department as department,
                cc.requested_at as updated_at,
                (SELECT status FROM clearance_requests WHERE student_id = cc.student_id AND academic_year = ? AND target_department = 'library' ORDER BY id DESC LIMIT 1) as library_status,
                (SELECT status FROM clearance_requests WHERE student_id = cc.student_id AND academic_year = ? AND target_department = 'dormitory' ORDER BY id DESC LIMIT 1) as dormitory_status,
                (SELECT status FROM clearance_requests WHERE student_id = cc.student_id AND academic_year = ? AND target_department = 'department' ORDER BY id DESC LIMIT 1) as department_status,
                (SELECT status FROM clearance_requests WHERE student_id = cc.student_id AND academic_year = ? AND target_department = 'registrar' ORDER BY id DESC LIMIT 1) as registrar_status,
                (CASE 
                    WHEN cc.status = 'pending' AND 
                         (SELECT status FROM clearance_requests WHERE student_id = cc.student_id AND academic_year = ? AND target_department = 'library' ORDER BY id DESC LIMIT 1) = 'approved'
                    THEN 2 
                    WHEN cc.status = 'pending' THEN 1 
                    ELSE 0 
                END) as priority_order
            FROM clearance_requests cc 
            LEFT JOIN (
                SELECT student_id 
                FROM clearance_requests 
                WHERE status = 'approved' AND academic_year = ? AND target_department = 'library'
                GROUP BY student_id
            ) lc ON cc.student_id = lc.student_id
            WHERE cc.academic_year = ? AND cc.target_department = 'cafeteria'
            AND (cc.status != 'pending' OR lc.student_id IS NOT NULL)
        `;

        let queryParams = [
            currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear, // SELECT subqueries
            currentAcademicYear, // CASE subquery
            currentAcademicYear, // JOIN subquery
            currentAcademicYear // WHERE clause
        ];

        if (search) {
            mainQuery += " AND (cc.name ILIKE ? OR cc.student_id ILIKE ? OR cc.last_name ILIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (status_filter !== 'all') {
            mainQuery += " AND cc.status = ?";
            queryParams.push(status_filter);
        }

        mainQuery += " ORDER BY priority_order DESC, cc.status = 'pending' DESC, cc.requested_at DESC";

        const [allRequests] = await db.execute(mainQuery, queryParams);

        // Process each request to add lock status
        const processedRequests = allRequests.map((request) => {
            const dormitory_status = request.dormitory_status || 'pending';
            const department_status = request.department_status || 'pending';
            const registrar_status = request.registrar_status || 'pending';

            // Cafeteria is locked if already approved OR ANY subsequent stage is approved
            let locked_by_dept = null;
            if (registrar_status === 'approved') locked_by_dept = 'Registrar';
            else if (department_status === 'approved') locked_by_dept = 'Department';
            else if (dormitory_status === 'approved') locked_by_dept = 'Dormitory';

            const is_locked = (
                locked_by_dept !== null
            );

            return {
                ...request,
                is_locked,
                locked_by_dept,
                can_approve: (request.library_status === 'approved' && !is_locked && request.status !== 'approved'),
                can_reject: (!is_locked && request.status !== 'rejected'),
                show_approve: (request.status !== 'approved' && !is_locked),
                show_reject: (request.status !== 'rejected' && !is_locked)
            };
        });

        res.json({
            success: true,
            user: req.session.user,
            stats: stats,
            all_requests: processedRequests,
            search: search,
            status: status_filter
        });

    } catch (error) {
        console.error('❌ Error loading cafeteria dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading cafeteria dashboard: ' + error.message
        });
    }
};

exports.handleAction = async (req, res) => {
    try {
        console.log('🔄 Processing cafeteria action...');
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
            // Check if student is locked by subsequent stages or already approved by cafeteria
            const [clearanceRows] = await db.execute("SELECT student_id, academic_year, name, last_name, status FROM clearance_requests WHERE id = ? AND target_department = 'cafeteria'", [id]);
            if (clearanceRows.length === 0) continue;

            const { student_id, academic_year, name, last_name } = clearanceRows[0];
            const studentName = `${name} ${last_name}`;

            if (true) { // Logic to check locks
                const [lockedBy] = await db.execute(`
                    SELECT 
                        (SELECT COUNT(*) FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = 'dormitory' AND status = 'approved') as dormitory_approved,
                        (SELECT COUNT(*) FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = 'department' AND status = 'approved') as department_approved,
                        (SELECT COUNT(*) FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = 'registrar' AND status = 'approved') as registrar_approved
                `, [student_id, academic_year, student_id, academic_year, student_id, academic_year]);

                const locks = lockedBy[0];
                if (locks.dormitory_approved > 0 || locks.department_approved > 0 || locks.registrar_approved > 0) {
                    console.log(`🚫 Action blocked: Student ${student_id} is locked by subsequent approvals.`);
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
                ? `Cafeteria clearance granted for: ${studentName}`
                : `Cafeteria clearance rejected for: ${studentName}. Reason: ${reason || 'No reason specified'}`;

            await logger.log(req, actionLabel, student_id, logDetails, studentName);

            processedCount++;
        }

        if (processedCount === 0 && requestIds.length > 0) {
            return res.json({ success: false, message: 'Action Restricted: Selected student(s) are already approved by subsequent departments.' });
        }

        res.json({
            success: true,
            message: `${processedCount} request(s) ${status} successfully`
        });

    } catch (error) {
        console.error('❌ Error processing cafeteria action:', error);
        res.status(500).json({ success: false, message: 'Error processing request: ' + error.message });
    }
};

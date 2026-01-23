const logger = require('../../utils/logger');

exports.getDashboardData = async (req, res) => {
    try {
        console.log('🏁 Starting library dashboard render');
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
                SUM(CASE WHEN lc.status = 'pending' THEN 1 ELSE 0 END) as pending,
                SUM(CASE WHEN lc.status = 'approved' THEN 1 ELSE 0 END) as approved,
                SUM(CASE WHEN lc.status = 'rejected' THEN 1 ELSE 0 END) as rejected
            FROM clearance_requests lc
            WHERE lc.academic_year = ? AND lc.target_department = 'library'
        `, [currentAcademicYear]);

        const stats = statsRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
        stats.total = stats.total || 0;
        stats.pending = stats.pending || 0;
        stats.approved = stats.approved || 0;
        stats.rejected = stats.rejected || 0;

        // Build main query for requests
        let mainQuery = `
            SELECT 
                lc.*, 
                lc.student_department as department,
                CONCAT(lc.name, ' ', lc.last_name) as student_name,
                lc.requested_at as updated_at,
                (SELECT status FROM clearance_requests WHERE student_id = lc.student_id AND academic_year = ? AND target_department = 'cafeteria' ORDER BY id DESC LIMIT 1) as cafeteria_status,
                (SELECT status FROM clearance_requests WHERE student_id = lc.student_id AND academic_year = ? AND target_department = 'dormitory' ORDER BY id DESC LIMIT 1) as dormitory_status,
                (SELECT status FROM clearance_requests WHERE student_id = lc.student_id AND academic_year = ? AND target_department = 'department' ORDER BY id DESC LIMIT 1) as department_status,
                (SELECT status FROM clearance_requests WHERE student_id = lc.student_id AND academic_year = ? AND target_department = 'registrar' ORDER BY id DESC LIMIT 1) as registrar_status
            FROM clearance_requests lc 
            WHERE lc.academic_year = ? AND lc.target_department = 'library'
        `;

        let queryParams = [currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear];

        if (search) {
            mainQuery += " AND (lc.name ILIKE ? OR lc.student_id ILIKE ? OR lc.last_name ILIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (status_filter !== 'all') {
            mainQuery += " AND lc.status = ?";
            queryParams.push(status_filter);
        }

        mainQuery += " ORDER BY lc.status = 'pending' DESC, lc.requested_at DESC";

        const [allRequests] = await db.execute(mainQuery, queryParams);

        // Process each request
        const processedRequests = allRequests.map((request) => {
            const cafeteria_status = request.cafeteria_status || 'pending';
            const dormitory_status = request.dormitory_status || 'pending';
            const department_status = request.department_status || 'pending';
            const registrar_status = request.registrar_status || 'pending';

            // Library is locked if already approved OR ANY subsequent stage is approved
            let locked_by_dept = null;
            if (registrar_status === 'approved') locked_by_dept = 'Registrar';
            else if (department_status === 'approved') locked_by_dept = 'Department';
            else if (dormitory_status === 'approved') locked_by_dept = 'Dormitory';
            else if (cafeteria_status === 'approved') locked_by_dept = 'Cafeteria';

            const is_locked = (
                locked_by_dept !== null
            );

            return {
                ...request,
                is_locked,
                locked_by_dept,
                can_approve: (!is_locked && request.status !== 'approved'),
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
        console.error('❌ Error loading library dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading library dashboard: ' + error.message
        });
    }
};

exports.handleAction = async (req, res) => {
    try {
        console.log('🔄 Processing library action...');
        const db = req.db;

        const [settingsRows] = await db.execute("SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1");
        const currentAcademicYear = settingsRows[0]?.academic_year;

        const { action_type, request_id, reject_reason, bulk_action, selected_requests, bulk_reject_reason } = req.body;

        let requestIds = [];
        if (bulk_action) {
            requestIds = Array.isArray(selected_requests) ? selected_requests : [selected_requests];
        } else {
            requestIds = [request_id];
        }

        if (requestIds.length === 0) {
            return res.status(400).json({ success: false, message: 'No requests selected' });
        }

        const status = (action_type === 'approve' || req.body.approve || bulk_action === 'approve') ? 'approved' : 'rejected';
        const reason = bulk_action ? bulk_reject_reason : reject_reason;

        let processedCount = 0;
        for (const id of requestIds) {
            // Check if student is locked by subsequent stages or already approved by library
            const [clearanceRows] = await db.execute("SELECT student_id, academic_year, name, last_name, status FROM clearance_requests WHERE id = ? AND target_department = 'library'", [id]);
            if (clearanceRows.length === 0) continue;

            const { student_id, academic_year, name, last_name } = clearanceRows[0];
            const studentName = `${name} ${last_name}`;

            if (true) { // Logic to check locks
                const [lockedBy] = await db.execute(`
                    SELECT 
                        (SELECT COUNT(*) FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = 'cafeteria' AND status = 'approved') as cafeteria_approved,
                        (SELECT COUNT(*) FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = 'dormitory' AND status = 'approved') as dormitory_approved,
                        (SELECT COUNT(*) FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = 'department' AND status = 'approved') as department_approved,
                        (SELECT COUNT(*) FROM clearance_requests WHERE student_id = ? AND academic_year = ? AND target_department = 'registrar' AND status = 'approved') as registrar_approved
                `, [student_id, academic_year, student_id, academic_year, student_id, academic_year, student_id, academic_year]);

                const locks = lockedBy[0];
                if (locks.cafeteria_approved > 0 || locks.dormitory_approved > 0 || locks.department_approved > 0 || locks.registrar_approved > 0) {
                    console.log(`🚫 Action blocked: Student ${student_id} is locked by subsequent approvals.`);
                    continue; // Skip locked student
                }
            }

            await db.execute(
                "UPDATE clearance_requests SET status = ?, reject_reason = ?, approved_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END, rejected_at = CASE WHEN ? = 'rejected' THEN CURRENT_TIMESTAMP ELSE rejected_at END, approved_by = ? WHERE id = ?",
                [status, reason || null, status, status, req.session.user.full_name, id]
            );

            // Audit Log
            const actionLabel = status === 'approved' ? 'APPROVE_STUDENT' : 'REJECT_STUDENT';
            const logDetails = status === 'approved'
                ? `Library clearance granted for: ${studentName}`
                : `Library clearance rejected for: ${studentName}. Reason: ${reason || 'No reason specified'}`;

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
        console.error('❌ Error processing library action:', error);
        res.status(500).json({ success: false, message: 'Error processing request: ' + error.message });
    }
};

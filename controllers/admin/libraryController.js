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

            // CORRECTED: Library is locked ONLY if Cafeteria has acted (not pending)
            let locked_by_dept = null;
            let is_locked = false;

            if (cafeteria_status !== 'pending') {
                is_locked = true;
                locked_by_dept = 'Cafeteria';
            }

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

        const isApproving = (action_type === 'approve' || req.body.approve || bulk_action === 'approve');
        const status = isApproving ? 'approved' : 'rejected';
        const reason = bulk_action ? bulk_reject_reason : reject_reason;

        if (!isApproving && (!reason || reason.trim().length < 10)) {
            return res.status(400).json({ success: false, message: 'Rejection reason must be at least 10 characters long.' });
        }

        let processedCount = 0;
        for (const id of requestIds) {
            // Check if student is locked by subsequent stages or already approved by library
            const [clearanceRows] = await db.execute("SELECT student_id, academic_year, name, last_name, status FROM clearance_requests WHERE id = ? AND target_department = 'library'", [id]);
            if (clearanceRows.length === 0) continue;

            const { student_id, academic_year, name, last_name, status: currentStatus } = clearanceRows[0];
            const studentName = `${name} ${last_name}`;

            // Skip if already in target status
            if (currentStatus === status) {
                console.log(`⏭️ Student ${student_id} already ${status}`);
                continue;
            }

            // CORRECTED: Only check if NEXT department (Cafeteria) has acted, and only block APPROVALS
            if (isApproving) {
                const [nextDeptStatus] = await db.execute(`
                    SELECT status FROM clearance_requests 
                    WHERE student_id = ? AND academic_year = ? AND target_department = 'cafeteria'
                    ORDER BY id DESC LIMIT 1
                `, [student_id, academic_year]);

                const cafeteriaStatus = nextDeptStatus[0]?.status || 'pending';
                const cafeteriaActed = cafeteriaStatus !== 'pending';

                if (cafeteriaActed) {
                    console.log(`🚫 Approval blocked: Student ${student_id} - Cafeteria has already ${cafeteriaStatus}. Library can no longer change decision.`);
                    continue; // Skip locked student for approval only
                }
            }

            // Rejections are always allowed regardless of locks
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

        if (processedCount === 0 && requestIds.length > 0 && isApproving) {
            return res.json({ success: false, message: 'Action Restricted: Cafeteria has already processed these student(s). Library decisions are locked once next department acts.' });
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
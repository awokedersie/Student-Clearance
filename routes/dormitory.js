const express = require('express');
const router = express.Router();

// Middleware to check if user is dormitory admin
const requireDormitoryAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'dormitory_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Dormitory Admin' });
        }
        res.redirect('/admin/login');
    }
};

// Check if department has approved this student (locks dormitory)
const isLockedForDormitory = async (student_id, academic_year, db) => {
    try {
        const [rows] = await db.execute(
            "SELECT status FROM department_clearance WHERE student_id = ? AND academic_year = ? AND status = 'approved'",
            [student_id, academic_year]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error checking lock status:', error);
        return false;
    }
};

// Dormitory Admin Dashboard (Renamed to avoid SPA route collision)
router.get('/departments/dormitory/data', requireDormitoryAdmin, async (req, res) => {
    try {
        console.log('🏁 Starting dormitory dashboard render');
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
                SUM(dc.status = 'pending') as pending,
                SUM(dc.status = 'approved') as approved,
                SUM(dc.status = 'rejected') as rejected
            FROM dormitory_clearance dc
            LEFT JOIN (
                SELECT student_id FROM cafeteria_clearance WHERE status = 'approved' AND academic_year = ? GROUP BY student_id
            ) cc ON dc.student_id = cc.student_id
            WHERE dc.academic_year = ?
            AND (dc.status != 'pending' OR cc.student_id IS NOT NULL)
        `, [currentAcademicYear, currentAcademicYear]);

        const stats = statsRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
        // Clean nulls
        stats.total = stats.total || 0;
        stats.pending = stats.pending || 0;
        stats.approved = stats.approved || 0;
        stats.rejected = stats.rejected || 0;

        console.log('📈 Stats fetched:', stats);

        // Build main query for requests - ONLY STUDENTS APPROVED BY LIBRARY & CAFETERIA AND CURRENT ACADEMIC YEAR
        let mainQuery = `
            SELECT 
                dc.*, 
                CONCAT(dc.name, ' ', dc.last_name) as student_name,
                dc.requested_at as updated_at,
                (SELECT status FROM library_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) as library_status,
                (SELECT status FROM cafeteria_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) as cafeteria_status,
                (SELECT status FROM department_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) as department_status,
                (CASE 
                    WHEN dc.status = 'pending' AND 
                         (SELECT status FROM library_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) = 'approved' AND
                         (SELECT status FROM cafeteria_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) = 'approved'
                    THEN 1 
                    WHEN dc.status = 'pending' THEN 0 
                    ELSE 2 
                END) as priority_order
            FROM dormitory_clearance dc 
            LEFT JOIN (
                SELECT student_id 
                FROM library_clearance 
                WHERE status = 'approved' AND academic_year = ?
                GROUP BY student_id
            ) lc ON dc.student_id = lc.student_id
            LEFT JOIN (
                SELECT student_id 
                FROM cafeteria_clearance 
                WHERE status = 'approved' AND academic_year = ?
                GROUP BY student_id
            ) cc ON dc.student_id = cc.student_id
            WHERE dc.academic_year = ?
            AND (dc.status != 'pending' OR cc.student_id IS NOT NULL)
        `;

        let queryParams = [currentAcademicYear, currentAcademicYear, currentAcademicYear];

        if (search) {
            mainQuery += " AND (dc.name LIKE ? OR dc.student_id LIKE ? OR dc.last_name LIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (status_filter !== 'all') {
            mainQuery += " AND dc.status = ?";
            queryParams.push(status_filter);
        }

        // ORDER BY to prioritize pending requests with library and cafeteria approved
        mainQuery += " ORDER BY priority_order DESC, dc.status = 'pending' DESC, dc.requested_at DESC";

        console.log('🔍 Executing main query...');
        const [allRequests] = await db.execute(mainQuery, queryParams);
        console.log(`📋 Found ${allRequests.length} requests`);

        // Process each request to add lock status
        const processedRequests = await Promise.all(
            allRequests.map(async (request) => {
                const is_locked = await isLockedForDormitory(request.student_id, currentAcademicYear, db);
                return {
                    ...request,
                    is_locked,
                    library_status: request.library_status || 'not_requested',
                    cafeteria_status: request.cafeteria_status || 'not_requested',
                    department_status: request.department_status || 'not_requested'
                };
            })
        );

        console.log('🎨 Rendering template...');

        // Get messages from session
        const success_message = req.session.success_message;
        const error_message = req.session.error_message;

        // Clear messages immediately
        delete req.session.success_message;
        delete req.session.error_message;

        res.json({
            success: true,
            user: req.session.user,
            stats: stats,
            all_requests: processedRequests,
            search: search,
            status: status_filter
        });

        console.log('✅ Dormitory dashboard rendered successfully');

    } catch (error) {
        console.error('❌ Error loading dormitory dashboard:', error);
        res.status(500).render('error', {
            message: 'Error loading dormitory dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Handle Approve/Reject actions (Single and Bulk)
router.post('/departments/dormitory', requireDormitoryAdmin, async (req, res) => {
    try {
        console.log('🔄 Processing dormitory action...');
        const db = req.db;
        // Get current academic year from settings
        const [settingsRows = []] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;
        const { action_type, request_id, reject_reason, bulk_action, selected_requests, bulk_reject_reason } = req.body;

        console.log('📦 Request body:', req.body);

        // Handle bulk actions
        if (bulk_action) {
            console.log('🔄 Processing bulk action:', bulk_action);

            // Handle both array and single value for selected_requests
            let requestIds = [];
            if (Array.isArray(selected_requests)) {
                requestIds = selected_requests;
            } else if (selected_requests) {
                requestIds = [selected_requests];
            }

            console.log('📋 Selected requests:', requestIds);

            if (requestIds.length === 0) {
                return res.status(400).json({ success: false, message: "Please select at least one request!" });
            }

            let processed_count = 0;
            let locked_count = 0;
            let clearance_failed_count = 0;

            if (bulk_action === 'approve') {
                // Process each request individually to check locks and clearance status
                for (const requestId of requestIds) {
                    try {
                        // Get student_id for this request
                        const [studentRows] = await db.execute(
                            "SELECT student_id FROM dormitory_clearance WHERE id = ?",
                            [requestId]
                        );

                        if (studentRows.length > 0) {
                            const student_id = studentRows[0].student_id;

                            // Check if locked (department has approved)
                            if (!await isLockedForDormitory(student_id, currentAcademicYear, db)) {
                                // Check if student is approved by library and cafeteria
                                const [clearanceRows] = await db.execute(`
                                    SELECT 
                                        (SELECT status FROM library_clearance WHERE student_id = ? ORDER BY id DESC LIMIT 1) as library_status,
                                        (SELECT status FROM cafeteria_clearance WHERE student_id = ? ORDER BY id DESC LIMIT 1) as cafeteria_status
                                `, [student_id, student_id]);

                                const clearance_data = clearanceRows[0] || {};
                                const library_status = clearance_data.library_status || 'not_requested';
                                const cafeteria_status = clearance_data.cafeteria_status || 'not_requested';

                                if (library_status === 'approved' && cafeteria_status === 'approved') {
                                    // Both clearances are approved, proceed with dormitory approval
                                    await db.execute(
                                        "UPDATE dormitory_clearance SET status='approved', reject_reason=NULL WHERE id=?",
                                        [requestId]
                                    );
                                    processed_count++;
                                } else {
                                    clearance_failed_count++;
                                }
                            } else {
                                locked_count++;
                            }
                        }
                    } catch (error) {
                        console.error(`Error processing request ${requestId}:`, error);
                        clearance_failed_count++;
                    }
                }

                if (processed_count > 0) {
                    let message = `${processed_count} request(s) approved successfully!`;
                    const additional_messages = [];
                    if (locked_count > 0) additional_messages.push(`${locked_count} request(s) locked (approved by department)`);
                    if (clearance_failed_count > 0) additional_messages.push(`${clearance_failed_count} request(s) need library & cafeteria approval`);

                    if (additional_messages.length > 0) {
                        message += " - " + additional_messages.join(", ");
                    }
                    req.session.success_message = message;
                } else {
                    if (locked_count > 0) {
                        req.session.error_message = "Selected requests are locked and cannot be modified (approved by department).";
                    } else if (clearance_failed_count > 0) {
                        req.session.error_message = "No requests could be approved. All selected requests require both Library and Cafeteria clearance first.";
                    }
                }
            }
            else if (bulk_action === 'reject') {
                const rejectReason = bulk_reject_reason?.trim() || '';

                // Validate that reject reason is not empty for bulk reject
                if (rejectReason.length > 0) {
                    // Process each request individually to check locks
                    for (const requestId of requestIds) {
                        try {
                            // Get student_id for this request
                            const [studentRows] = await db.execute(
                                "SELECT student_id FROM dormitory_clearance WHERE id = ?",
                                [requestId]
                            );

                            if (studentRows.length > 0) {
                                const student_id = studentRows[0].student_id;

                                // Check if locked (department has approved)
                                if (!await isLockedForDormitory(student_id, currentAcademicYear, db)) {
                                    await db.execute(
                                        "UPDATE dormitory_clearance SET status='rejected', reject_reason=? WHERE id=?",
                                        [rejectReason, requestId]
                                    );
                                    processed_count++;
                                } else {
                                    locked_count++;
                                }
                            }
                        } catch (error) {
                            console.error(`Error processing request ${requestId}:`, error);
                        }
                    }

                    if (processed_count > 0) {
                        let message = `${processed_count} request(s) rejected successfully!`;
                        if (locked_count > 0) message += ` ${locked_count} request(s) could not be processed (approved by department).`;
                        req.session.success_message = message;
                    } else if (locked_count > 0) {
                        req.session.error_message = "Selected requests are locked and cannot be modified (approved by department).";
                    }
                } else {
                    req.session.error_message = "Reject reason is required for bulk rejection!";
                }
            }
        }
        // Single Actions
        else if (action_type && request_id) {
            if (action_type === 'approve') {
                // Get student_id for this request
                const [studentRows] = await db.execute(
                    "SELECT student_id FROM dormitory_clearance WHERE id = ?",
                    [request_id]
                );

                if (studentRows.length > 0) {
                    const student_id = studentRows[0].student_id;

                    // Check if locked (department has approved)
                    if (await isLockedForDormitory(student_id, currentAcademicYear, db)) {
                        req.session.error_message = "Cannot modify: Department has already approved this student!";
                    } else {
                        // Check if student is approved by library and cafeteria
                        const [clearanceRows] = await db.execute(`
                            SELECT 
                                (SELECT status FROM library_clearance WHERE student_id = ? ORDER BY id DESC LIMIT 1) as library_status,
                                (SELECT status FROM cafeteria_clearance WHERE student_id = ? ORDER BY id DESC LIMIT 1) as cafeteria_status
                        `, [student_id, student_id]);

                        const clearance_data = clearanceRows[0] || {};
                        const library_status = clearance_data.library_status || 'not_requested';
                        const cafeteria_status = clearance_data.cafeteria_status || 'not_requested';

                        if (library_status === 'approved' && cafeteria_status === 'approved') {
                            // Both clearances are approved, proceed with dormitory approval
                            await db.execute(
                                "UPDATE dormitory_clearance SET status='approved', reject_reason=NULL WHERE id=?",
                                [request_id]
                            );
                            req.session.success_message = "Student approved successfully!";
                        } else {
                            req.session.error_message = "Cannot approve: Student must be cleared by both Library and Cafeteria first.";
                        }
                    }
                }
            } else if (action_type === 'reject') {
                const rejectReason = reject_reason?.trim() || '';

                // Get student_id for this request
                const [studentRows] = await db.execute(
                    "SELECT student_id FROM dormitory_clearance WHERE id = ?",
                    [request_id]
                );

                if (studentRows.length > 0) {
                    const student_id = studentRows[0].student_id;

                    // Check if locked (department has approved)
                    if (await isLockedForDormitory(student_id, currentAcademicYear, db)) {
                        req.session.error_message = "Cannot modify: Department has already approved this student!";
                    } else {
                        // Validate that reject reason is not empty
                        if (rejectReason.length > 0) {
                            await db.execute(
                                "UPDATE dormitory_clearance SET status='rejected', reject_reason=? WHERE id=?",
                                [rejectReason, request_id]
                            );
                            req.session.success_message = "Request rejected successfully!";
                        } else {
                            req.session.error_message = "Reject reason is required!";
                        }
                    }
                }
            }
        }

        const success = !!req.session.success_message;
        const message = req.session.success_message || req.session.error_message || 'Action completed';

        res.json({
            success: success,
            message: message
        });

        // Clear messages
        delete req.session.success_message;
        delete req.session.error_message;
    } catch (error) {
        console.error('❌ Error processing dormitory action:', error);
        res.status(500).json({ success: false, message: 'Error processing request' });
    }
});

module.exports = router;
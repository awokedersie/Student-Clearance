const express = require('express');
const router = express.Router();

// Middleware to check if user is department admin
const requireDepartmentAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'department_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Department Admin' });
        }
        res.redirect('/admin/login');
    }
};

// Department Admin Dashboard (Renamed to avoid SPA route collision)
router.get('/departments/department/data', requireDepartmentAdmin, async (req, res) => {
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
                SUM(dc.status = 'pending') as pending,
                SUM(dc.status = 'approved') as approved,
                SUM(dc.status = 'rejected') as rejected
            FROM department_clearance dc
            LEFT JOIN (
                SELECT student_id FROM dormitory_clearance WHERE status = 'approved' AND academic_year = ? GROUP BY student_id
            ) dorm ON dc.student_id = dorm.student_id
            WHERE dc.academic_year = ? AND dc.department = ?
            AND (dc.status != 'pending' OR dorm.student_id IS NOT NULL)
        `, [currentAcademicYear, currentAcademicYear, adminDepartment]);

        const stats = statsRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
        // Clean nulls
        stats.total = stats.total || 0;
        stats.pending = stats.pending || 0;
        stats.approved = stats.approved || 0;
        stats.rejected = stats.rejected || 0;

        console.log('📈 Stats fetched:', stats);

        // Build main query for requests - ONLY STUDENTS APPROVED BY DORMITORY AND CURRENT ACADEMIC YEAR AND SAME DEPARTMENT
        let mainQuery = `
            SELECT 
                dc.*, 
                CONCAT(dc.name, ' ', dc.last_name) as student_name,
                dc.requested_at as updated_at,
                (SELECT status FROM library_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) as library_status,
                (SELECT status FROM cafeteria_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) as cafeteria_status,
                (SELECT status FROM dormitory_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) as dormitory_status,
                (SELECT status FROM academicstaff_clearance WHERE student_id = dc.student_id ORDER BY id DESC LIMIT 1) as academic_status,
                (CASE 
                    WHEN dc.status = 'pending' AND 
                         (SELECT status FROM dormitory_clearance WHERE student_id = dc.student_id AND academic_year = ? ORDER BY id DESC LIMIT 1) = 'approved'
                    THEN 1 
                    WHEN dc.status = 'pending' THEN 0 
                    ELSE 2 
                END) as priority_order
            FROM department_clearance dc 
            LEFT JOIN (
                SELECT student_id 
                FROM dormitory_clearance 
                WHERE status = 'approved' AND academic_year = ?
                GROUP BY student_id
            ) dorm ON dc.student_id = dorm.student_id
            WHERE dc.academic_year = ? AND dc.department = ?
            AND (dc.status != 'pending' OR dorm.student_id IS NOT NULL)
        `;

        let queryParams = [currentAcademicYear, currentAcademicYear, currentAcademicYear, adminDepartment];

        if (search) {
            mainQuery += " AND (dc.name LIKE ? OR dc.student_id LIKE ? OR dc.last_name LIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        if (status_filter !== 'all') {
            mainQuery += " AND dc.status = ?";
            queryParams.push(status_filter);
        }

        // ORDER BY to prioritize pending requests with dormitory approved
        mainQuery += " ORDER BY priority_order DESC, dc.status = 'pending' DESC, dc.requested_at DESC";

        console.log('🔍 Executing main query...');
        const [allRequests] = await db.execute(mainQuery, queryParams);
        console.log(`📋 Found ${allRequests.length} requests`);

        // Process each request to add lock status and action availability
        const processedRequests = allRequests.map((request) => {
            const academic_status = request.academic_status || 'pending';
            const dormitory_status = request.dormitory_status || 'not_requested';

            // Check if request is locked (final clearance granted)
            const is_locked = (academic_status === 'approved');

            // Only check dormitory status for approval (since dormitory already checks library and cafeteria)
            const can_approve = (dormitory_status === 'approved') && !is_locked;
            const show_approve = (request.status !== 'approved') && !is_locked;
            const show_reject = (request.status !== 'rejected') && !is_locked;

            return {
                ...request,
                is_locked,
                can_approve,
                show_approve,
                show_reject
            };
        });

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
            status: status_filter,
            adminDepartment: adminDepartment,
            success_message,
            error_message
        });

        console.log('✅ Department dashboard rendered successfully');

    } catch (error) {
        console.error('❌ Error loading department dashboard:', error);
        res.status(500).render('error', {
            message: 'Error loading department dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Handle Approve/Reject actions (Single and Bulk)
router.post('/departments/department', requireDepartmentAdmin, async (req, res) => {
    try {
        console.log('🔄 Processing department action...');
        const db = req.db;
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
                req.session.error_message = "Please select at least one request!";
            } else {
                let processed_count = 0;
                let failed_count = 0;
                let finalized_count = 0;

                if (bulk_action === 'approve') {
                    // Bulk Approve - Only approve requests that have dormitory approval AND are not finalized
                    for (const requestId of requestIds) {
                        try {
                            // Check if student is already approved by academic staff (final clearance)
                            const [finalRows] = await db.execute(`
                            SELECT status FROM academicstaff_clearance 
                            WHERE student_id = (
                                SELECT student_id FROM department_clearance WHERE id = ?
                            ) 
                            ORDER BY id DESC 
                            LIMIT 1
                        `, [requestId]);

                            const final_status = finalRows[0]?.status || 'pending';

                            if (final_status === 'approved') {
                                finalized_count++;
                                continue; // Skip this request
                            }

                            // Check dormitory status for each request
                            const [studentRows] = await db.execute(`
                            SELECT dc.student_id 
                            FROM department_clearance dc 
                            WHERE dc.id = ?
                        `, [requestId]);

                            if (studentRows.length > 0) {
                                const student_id = studentRows[0].student_id;

                                // ONLY check dormitory status
                                const [clearanceRows] = await db.execute(`
                                SELECT status FROM dormitory_clearance 
                                WHERE student_id = ? 
                                ORDER BY id DESC 
                                LIMIT 1
                            `, [student_id]);

                                const dormitory_status = clearanceRows[0]?.status || 'not_requested';

                                if (dormitory_status === 'approved') {
                                    // Dormitory has approved, proceed with department approval
                                    await db.execute(
                                        "UPDATE department_clearance SET status='approved', reject_reason=NULL WHERE id=?",
                                        [requestId]
                                    );
                                    processed_count++;
                                } else {
                                    failed_count++;
                                }
                            } else {
                                failed_count++;
                            }
                        } catch (error) {
                            console.error(`Error processing request ${requestId}:`, error);
                            failed_count++;
                        }
                    }

                    if (processed_count > 0) {
                        let message = `${processed_count} request(s) approved successfully!`;
                        if (failed_count > 0 || finalized_count > 0) {
                            message += ` ${failed_count} request(s) failed (Dormitory clearance required).`;
                            if (finalized_count > 0) {
                                message += ` ${finalized_count} request(s) skipped (Already finalized by Academic Staff).`;
                            }
                        }
                        req.session.success_message = message;
                    } else if (finalized_count > 0) {
                        req.session.error_message = `No requests could be approved. ${finalized_count} request(s) are already finalized by Academic Staff.`;
                    } else {
                        req.session.error_message = "No requests could be approved. All selected requests require Dormitory clearance first.";
                    }
                }
                else if (bulk_action === 'reject') {
                    const rejectReason = bulk_reject_reason?.trim() || '';

                    // Validate that reject reason is not empty for bulk reject
                    if (rejectReason.length > 0) {
                        for (const requestId of requestIds) {
                            try {
                                // Check if student is already approved by academic staff (final clearance)
                                const [finalRows] = await db.execute(`
                                SELECT status FROM academicstaff_clearance 
                                WHERE student_id = (
                                    SELECT student_id FROM department_clearance WHERE id = ?
                                ) 
                                ORDER BY id DESC 
                                LIMIT 1
                            `, [requestId]);

                                const final_status = finalRows[0]?.status || 'pending';

                                if (final_status === 'approved') {
                                    finalized_count++;
                                    continue; // Skip this request
                                }

                                await db.execute(
                                    "UPDATE department_clearance SET status='rejected', reject_reason=? WHERE id=?",
                                    [rejectReason, requestId]
                                );
                                processed_count++;
                            } catch (error) {
                                console.error(`Error processing request ${requestId}:`, error);
                                failed_count++;
                            }
                        }

                        if (processed_count > 0) {
                            let message = `${processed_count} request(s) rejected successfully!`;
                            if (failed_count > 0) {
                                message += ` ${failed_count} request(s) failed (Already finalized by Academic Staff).`;
                            }
                            req.session.success_message = message;
                        } else {
                            req.session.error_message = "No requests could be rejected. All selected requests are already finalized by Academic Staff.";
                        }
                    } else {
                        req.session.error_message = "Reject reason is required for bulk rejection!";
                    }
                }
            }
        }
        // Single Actions
        else if (action_type && request_id) {
            if (action_type === 'approve') {
                // Check if student is already approved by academic staff (final clearance)
                const [finalRows] = await db.execute(`
                    SELECT status FROM academicstaff_clearance 
                    WHERE student_id = (
                        SELECT student_id FROM department_clearance WHERE id = ?
                    ) 
                    ORDER BY id DESC 
                    LIMIT 1
                `, [request_id]);

                const final_status = finalRows[0]?.status || 'pending';

                // Prevent modification if final clearance is granted
                if (final_status === 'approved') {
                    req.session.error_message = "Cannot modify: Student has already been granted final clearance by Registrar.";
                } else {
                    // Check if student is approved by dormitory (which implies library and cafeteria are also approved)
                    const [studentRows] = await db.execute(`
                        SELECT dc.student_id 
                        FROM department_clearance dc 
                        WHERE dc.id = ?
                    `, [request_id]);

                    if (studentRows.length > 0) {
                        const student_id = studentRows[0].student_id;

                        // ONLY check dormitory status (since dormitory already checks library and cafeteria)
                        const [clearanceRows] = await db.execute(`
                            SELECT status FROM dormitory_clearance 
                            WHERE student_id = ? 
                            ORDER BY id DESC 
                            LIMIT 1
                        `, [student_id]);

                        const dormitory_status = clearanceRows[0]?.status || 'not_requested';

                        if (dormitory_status === 'approved') {
                            // Dormitory has approved (which means library and cafeteria are also approved), proceed with department approval
                            await db.execute(
                                "UPDATE department_clearance SET status='approved', reject_reason=NULL WHERE id=?",
                                [request_id]
                            );
                            req.session.success_message = "Student approved successfully!";
                        } else {
                            req.session.error_message = "Cannot approve: Student must be cleared by Dormitory first.";
                        }
                    }
                }
            } else if (action_type === 'reject') {
                const rejectReason = reject_reason?.trim() || '';

                // Check if student is already approved by academic staff (final clearance)
                const [finalRows] = await db.execute(`
                    SELECT status FROM academicstaff_clearance 
                    WHERE student_id = (
                        SELECT student_id FROM department_clearance WHERE id = ?
                    ) 
                    ORDER BY id DESC 
                    LIMIT 1
                `, [request_id]);

                const final_status = finalRows[0]?.status || 'pending';

                // Prevent modification if final clearance is granted
                if (final_status === 'approved') {
                    req.session.error_message = "Cannot modify: Student has already been granted final clearance by Registrar.";
                } else {
                    // Validate that reject reason is not empty
                    if (rejectReason.length > 0) {
                        await db.execute(
                            "UPDATE department_clearance SET status='rejected', reject_reason=? WHERE id=?",
                            [rejectReason, request_id]
                        );
                        req.session.success_message = "Request rejected successfully!";
                    } else {
                        req.session.error_message = "Reject reason is required!";
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
        console.error('❌ Error processing department action:', error);
        res.status(500).json({ success: false, message: 'Error processing request' });
    }
});

module.exports = router;
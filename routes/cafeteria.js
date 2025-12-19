const express = require('express');
const router = express.Router();

// Middleware to check if user is cafeteria admin
const requireCafeteriaAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'cafeteria_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Cafeteria Admin' });
        }
        res.redirect('/admin/login');
    }
};

// Check if dormitory has approved this student (locks cafeteria)
const isLockedForCafeteria = async (student_id, academic_year, db) => {
    try {
        const [rows] = await db.execute(
            "SELECT status FROM dormitory_clearance WHERE student_id = ? AND academic_year = ? AND status = 'approved'",
            [student_id, academic_year]
        );
        return rows.length > 0;
    } catch (error) {
        console.error('Error checking lock status:', error);
        return false;
    }
};

// Cafeteria Admin Dashboard - FIXED FILTERS
// Cafeteria Admin Dashboard - (Renamed to avoid SPA route collision)
router.get('/departments/cafeteria/data', requireCafeteriaAdmin, async (req, res) => {
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
                SUM(cc.status = 'pending') as pending,
                SUM(cc.status = 'approved') as approved,
                SUM(cc.status = 'rejected') as rejected
            FROM cafeteria_clearance cc
            LEFT JOIN (
                SELECT student_id FROM library_clearance WHERE status = 'approved' AND academic_year = ? GROUP BY student_id
            ) lc ON cc.student_id = lc.student_id
            WHERE cc.academic_year = ?
            AND (cc.status != 'pending' OR lc.student_id IS NOT NULL)
        `, [currentAcademicYear, currentAcademicYear]);

        const stats = statsRows[0] || { total: 0, pending: 0, approved: 0, rejected: 0 };
        // Clean nulls
        stats.total = stats.total || 0;
        stats.pending = stats.pending || 0;
        stats.approved = stats.approved || 0;
        stats.rejected = stats.rejected || 0;

        console.log('📈 Stats fetched:', stats);

        // Build main query for requests - FIXED: Proper parameter handling
        let mainQuery = `
            SELECT 
                cc.*, 
                CONCAT(cc.name, ' ', cc.last_name) as student_name,
                cc.requested_at as updated_at,
                (SELECT status FROM library_clearance WHERE student_id = cc.student_id AND academic_year = ? ORDER BY id DESC LIMIT 1) as library_status,
                (SELECT status FROM dormitory_clearance WHERE student_id = cc.student_id AND academic_year = ? ORDER BY id DESC LIMIT 1) as dormitory_status,
                (CASE 
                    WHEN cc.status = 'pending' AND 
                         (SELECT status FROM library_clearance WHERE student_id = cc.student_id AND academic_year = ? ORDER BY id DESC LIMIT 1) = 'approved'
                    THEN 1 
                    WHEN cc.status = 'pending' THEN 0 
                    ELSE 2 
                END) as priority_order
            FROM cafeteria_clearance cc 
            LEFT JOIN (
                SELECT student_id 
                FROM library_clearance 
                WHERE status = 'approved' AND academic_year = ?
                GROUP BY student_id
            ) lc ON cc.student_id = lc.student_id
            WHERE cc.academic_year = ?
            AND (cc.status != 'pending' OR lc.student_id IS NOT NULL)
        `;

        let queryParams = [currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear];

        // FIXED: Proper search functionality
        if (search) {
            mainQuery += " AND (cc.name LIKE ? OR cc.student_id LIKE ? OR cc.last_name LIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm);
        }

        // FIXED: Proper status filter
        if (status_filter !== 'all') {
            mainQuery += " AND cc.status = ?";
            queryParams.push(status_filter);
        }

        // ORDER BY to prioritize pending requests with library approved
        mainQuery += " ORDER BY priority_order DESC, cc.status = 'pending' DESC, cc.requested_at DESC";

        console.log('🔍 Executing main query...');
        console.log('Query:', mainQuery);
        console.log('Params:', queryParams);

        const [allRequests] = await db.execute(mainQuery, queryParams);
        console.log(`📋 Found ${allRequests.length} requests`);

        // Process each request to add lock status
        const processedRequests = await Promise.all(
            allRequests.map(async (request) => {
                const is_locked = await isLockedForCafeteria(request.student_id, currentAcademicYear, db);
                return {
                    ...request,
                    is_locked,
                    can_approve: (request.library_status === 'approved' && !is_locked),
                    show_approve: (request.status !== 'approved' && !is_locked),
                    show_reject: (request.status !== 'rejected' && !is_locked)
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

        console.log('✅ Cafeteria dashboard rendered successfully');

    } catch (error) {
        console.error('❌ Error loading cafeteria dashboard:', error);
        res.status(500).render('error', {
            message: 'Error loading cafeteria dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Handle Approve/Reject actions (Single and Bulk) - FIXED BULK ACTIONS
router.post('/departments/cafeteria', requireCafeteriaAdmin, async (req, res) => {
    try {
        console.log('🔄 Processing cafeteria action...');
        const db = req.db;
        const currentYear = new Date().getFullYear();
        const nextYear = currentYear + 1;
        const currentAcademicYear = `${currentYear}-${nextYear}`;
        const { action_type, request_id, reject_reason, bulk_action, selected_requests, bulk_reject_reason } = req.body;

        console.log('📦 Request body:', req.body);

        // FIXED: Handle bulk actions properly
        if (bulk_action) {
            console.log('🔄 Processing bulk action:', bulk_action);

            // FIXED: Handle both array and single value for selected_requests
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
            let library_failed_count = 0;
            let error_count = 0;

            if (bulk_action === 'approve') {
                // Process each request individually to check locks and library status
                for (const requestId of requestIds) {
                    try {
                        // Get student_id for this request
                        const [studentRows] = await db.execute(
                            "SELECT student_id FROM cafeteria_clearance WHERE id = ? AND academic_year = ?",
                            [requestId, currentAcademicYear]
                        );

                        if (studentRows.length > 0) {
                            const student_id = studentRows[0].student_id;

                            // Check if locked (dormitory has approved)
                            if (!await isLockedForCafeteria(student_id, currentAcademicYear, db)) {
                                // Check if student is approved by library
                                const [libraryRows] = await db.execute(`
                                    SELECT status FROM library_clearance 
                                    WHERE student_id = ? AND academic_year = ?
                                    ORDER BY id DESC 
                                    LIMIT 1
                                `, [student_id, currentAcademicYear]);

                                const library_status = libraryRows[0]?.status || 'not_requested';

                                if (library_status === 'approved') {
                                    // Library has approved, proceed with cafeteria approval
                                    await db.execute(
                                        "UPDATE cafeteria_clearance SET status='approved', reject_reason=NULL WHERE id=? AND academic_year = ?",
                                        [requestId, currentAcademicYear]
                                    );
                                    processed_count++;
                                } else {
                                    library_failed_count++;
                                }
                            } else {
                                locked_count++;
                            }
                        } else {
                            error_count++;
                        }
                    } catch (error) {
                        console.error(`Error processing request ${requestId}:`, error);
                        error_count++;
                    }
                }

                if (processed_count > 0) {
                    let message = `${processed_count} request(s) approved successfully for ${currentAcademicYear}!`;
                    const additional_messages = [];
                    if (locked_count > 0) additional_messages.push(`${locked_count} request(s) locked (approved by dormitory)`);
                    if (library_failed_count > 0) additional_messages.push(`${library_failed_count} request(s) need library approval`);
                    if (error_count > 0) additional_messages.push(`${error_count} request(s) had errors`);

                    if (additional_messages.length > 0) {
                        message += " - " + additional_messages.join(", ");
                    }
                    req.session.success_message = message;
                } else {
                    if (locked_count > 0) {
                        req.session.error_message = "Selected requests are locked and cannot be modified (approved by dormitory).";
                    } else if (library_failed_count > 0) {
                        req.session.error_message = `No requests could be approved. All selected requests require Library clearance first for ${currentAcademicYear}.`;
                    } else {
                        req.session.error_message = `No requests could be processed. Please check if requests exist for ${currentAcademicYear}.`;
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
                                "SELECT student_id FROM cafeteria_clearance WHERE id = ? AND academic_year = ?",
                                [requestId, currentAcademicYear]
                            );

                            if (studentRows.length > 0) {
                                const student_id = studentRows[0].student_id;

                                // Check if locked (dormitory has approved)
                                if (!await isLockedForCafeteria(student_id, currentAcademicYear, db)) {
                                    await db.execute(
                                        "UPDATE cafeteria_clearance SET status='rejected', reject_reason=? WHERE id=? AND academic_year = ?",
                                        [rejectReason, requestId, currentAcademicYear]
                                    );
                                    processed_count++;
                                } else {
                                    locked_count++;
                                }
                            } else {
                                error_count++;
                            }
                        } catch (error) {
                            console.error(`Error processing request ${requestId}:`, error);
                            error_count++;
                        }
                    }

                    if (processed_count > 0) {
                        let message = `${processed_count} request(s) rejected successfully for ${currentAcademicYear}!`;
                        if (locked_count > 0) message += ` ${locked_count} request(s) could not be processed (approved by dormitory).`;
                        if (error_count > 0) message += ` ${error_count} request(s) had errors.`;
                        req.session.success_message = message;
                    } else if (locked_count > 0) {
                        req.session.error_message = "Selected requests are locked and cannot be modified (approved by dormitory).";
                    } else {
                        req.session.error_message = `No requests could be processed. Please check if requests exist for ${currentAcademicYear}.`;
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
                    "SELECT student_id FROM cafeteria_clearance WHERE id = ? AND academic_year = ?",
                    [request_id, currentAcademicYear]
                );

                if (studentRows.length > 0) {
                    const student_id = studentRows[0].student_id;

                    // Check if locked (dormitory has approved)
                    if (await isLockedForCafeteria(student_id, currentAcademicYear, db)) {
                        req.session.error_message = `Cannot modify: Dormitory has already approved this student for ${currentAcademicYear}!`;
                    } else {
                        // Check if student is approved by library
                        const [libraryRows] = await db.execute(`
                            SELECT status FROM library_clearance 
                            WHERE student_id = ? AND academic_year = ?
                            ORDER BY id DESC 
                            LIMIT 1
                        `, [student_id, currentAcademicYear]);

                        const library_status = libraryRows[0]?.status || 'not_requested';

                        if (library_status === 'approved') {
                            // Library has approved, proceed with cafeteria approval
                            await db.execute(
                                "UPDATE cafeteria_clearance SET status='approved', reject_reason=NULL WHERE id=? AND academic_year = ?",
                                [request_id, currentAcademicYear]
                            );
                            req.session.success_message = `Student approved successfully for ${currentAcademicYear}!`;
                        } else {
                            req.session.error_message = `Cannot approve: Student must be cleared by Library first for ${currentAcademicYear}.`;
                        }
                    }
                } else {
                    req.session.error_message = `Request not found for ${currentAcademicYear}!`;
                }
            } else if (action_type === 'reject') {
                const rejectReason = reject_reason?.trim() || '';

                // Get student_id for this request
                const [studentRows] = await db.execute(
                    "SELECT student_id FROM cafeteria_clearance WHERE id = ? AND academic_year = ?",
                    [request_id, currentAcademicYear]
                );

                if (studentRows.length > 0) {
                    const student_id = studentRows[0].student_id;

                    // Check if locked (dormitory has approved)
                    if (await isLockedForCafeteria(student_id, currentAcademicYear, db)) {
                        req.session.error_message = `Cannot modify: Dormitory has already approved this student for ${currentAcademicYear}!`;
                    } else {
                        // Validate that reject reason is not empty
                        if (rejectReason.length > 0) {
                            await db.execute(
                                "UPDATE cafeteria_clearance SET status='rejected', reject_reason=? WHERE id=? AND academic_year = ?",
                                [rejectReason, request_id, currentAcademicYear]
                            );
                            req.session.success_message = `Request rejected successfully for ${currentAcademicYear}!`;
                        } else {
                            req.session.error_message = "Reject reason is required!";
                        }
                    }
                } else {
                    req.session.error_message = `Request not found for ${currentAcademicYear}!`;
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
        console.error('❌ Error processing cafeteria action:', error);
        res.status(500).json({ success: false, message: 'Error processing request: ' + error.message });
    }
});

module.exports = router;
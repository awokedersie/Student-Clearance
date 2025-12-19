const express = require('express');
const router = express.Router();
const nodemailer = require('nodemailer');

// Middleware to check if user is registrar admin
const requireRegistrarAdmin = (req, res, next) => {
    if (req.session.user && (req.session.user.role === 'registrar_admin' || req.session.user.role === 'system_admin' || req.session.user.role === 'super_admin')) {
        next();
    } else {
        if (req.xhr || req.headers.accept?.includes('application/json')) {
            return res.status(401).json({ success: false, message: 'Unauthorized - Please login as Registrar Admin' });
        }
        res.redirect('/admin/login');
    }
};

// Configure email transporter
const emailTransporter = nodemailer.createTransport({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: process.env.EMAIL_USER || 'amanneby004@gmail.com',
        pass: process.env.EMAIL_PASS || 'duwhutearrqpgpby'
    }
});

// Function to send email notification to student
async function sendClearanceDecisionEmail(studentEmail, studentName, decision, reason = '') {
    try {
        let mailOptions;

        if (decision === 'approved') {
            mailOptions = {
                from: `"DBU Clearance System" <${process.env.EMAIL_USER || 'amanneby004@gmail.com'}>`,
                to: studentEmail,
                subject: 'Final Clearance Approved - DBU Clearance System',
                html: `
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <h2 style='color: #2c3e50;'>🎉 Final Clearance Approved!</h2>
                        <p>Dear <strong>${studentName}</strong>,</p>
                        <p>We are pleased to inform you that your final clearance has been <strong>APPROVED</strong> by the Registrar Office.</p>
                        
                        <div style='background: #d4edda; padding: 20px; border-radius: 8px; border: 2px solid #c3e6cb; margin: 20px 0;'>
                            <h3 style='margin: 0; color: #155724;'>✅ Clearance Status: Approved</h3>
                            <p style='margin: 10px 0 0 0; color: #155724;'>
                                Your clearance process is now complete. You have successfully cleared all requirements.
                            </p>
                        </div>
                        
                        <p><strong>Important Notes:</strong></p>
                        <ul>
                            <li>You can download your clearance certificate from the student portal</li>
                            <li><a href='https://dbu.free.nf/clearance-management/index.php'>Click here to access your certificate</a></li>
                            <li>You have completed all clearance requirements</li>
                            <li>This completes your clearance process at DBU</li>
                        </ul>
                        
                        <p>If you have any questions, please contact the Registrar Office.</p>
                        
                        <hr style='border: none; border-top: 1px solid #ddd;'>
                        <p style='color: #7f8c8d; font-size: 12px;'>
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                `,
                text: `Final Clearance Approved: Dear ${studentName}, your final clearance has been APPROVED. Your student status has been updated to inactive. This completes your clearance process at DBU.`
            };
        } else {
            mailOptions = {
                from: `"DBU Clearance System" <${process.env.EMAIL_USER || 'amanneby004@gmail.com'}>`,
                to: studentEmail,
                subject: 'Final Clearance Rejected - DBU Clearance System',
                html: `
                    <div style='font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;'>
                        <h2 style='color: #2c3e50;'>⚠️ Final Clearance Requires Attention</h2>
                        <p>Dear <strong>${studentName}</strong>,</p>
                        <p>Your final clearance request has been <strong>REJECTED</strong> by the Registrar Office.</p>
                        
                        <div style='background: #f8d7da; padding: 20px; border-radius: 8px; border: 2px solid #f5c6cb; margin: 20px 0;'>
                            <h3 style='margin: 0; color: #721c24;'>❌ Clearance Status: Rejected</h3>
                            <p style='margin: 10px 0 0 0; color: #721c24;'>
                                <strong>Reason:</strong> ${reason}
                            </p>
                        </div>
                        
                        <p><strong>Next Steps:</strong></p>
                        <ul>
                            <li>Please address the issue mentioned above</li>
                            <li>Your student status remains <strong>active</strong></li>
                            <li>You may reapply for clearance after resolving the issue</li>
                            <li>Contact the relevant department for assistance</li>
                        </ul>
                        
                        <p>If you need clarification, please visit the Registrar Office.</p>
                        
                        <hr style='border: none; border-top: 1px solid #ddd;'>
                        <p style='color: #7f8c8d; font-size: 12px;'>
                            This is an automated message. Please do not reply to this email.
                        </p>
                    </div>
                `,
                text: `Final Clearance Rejected: Dear ${studentName}, your final clearance has been REJECTED. Reason: ${reason}. Please address the issue and reapply. Your student status remains active.`
            };
        }

        const result = await emailTransporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return false;
    }
}

// Registrar Admin Dashboard
// Registrar Admin Dashboard (Renamed to avoid SPA route collision)
router.get('/registrar/dashboard/data', requireRegistrarAdmin, async (req, res) => {
    try {
        console.log('🏁 Starting registrar dashboard render');
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
        // Get comprehensive statistics for dashboard
        const [statsRows] = await db.execute(`
            SELECT 
                (SELECT COUNT(*) FROM academicstaff_clearance ac 
                 INNER JOIN department_clearance dc ON ac.student_id = dc.student_id AND dc.status = 'approved'
                 WHERE ac.academic_year = ?) as total,
                (SELECT COUNT(*) FROM final_clearance WHERE status = 'approved' AND academic_year = ?) as approved,
                (SELECT COUNT(*) FROM academicstaff_clearance ac 
                 INNER JOIN department_clearance dc ON ac.student_id = dc.student_id AND dc.status = 'approved'
                 LEFT JOIN final_clearance fc ON ac.student_id = fc.student_id 
                 WHERE fc.status IS NULL AND ac.academic_year = ?) as pending,
                (SELECT COUNT(*) FROM final_clearance WHERE status = 'rejected' AND academic_year = ?) as rejected
        `, [currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear]);

        const stats = statsRows[0] || { total: 0, approved: 0, pending: 0, rejected: 0 };
        // Ensure values are numbers
        stats.total = stats.total || 0;
        stats.approved = stats.approved || 0;
        stats.pending = stats.pending || 0;
        stats.rejected = stats.rejected || 0;

        console.log('📈 Stats fetched:', stats);

        // Build query for students based on filters - ONLY DEPARTMENT APPROVED STUDENTS AND CURRENT ACADEMIC YEAR
        let query = `
            SELECT ac.*,
                   CONCAT(ac.name, ' ', ac.last_name) as student_name,
                   ac.requested_at as updated_at,
                   (SELECT status FROM library_clearance WHERE student_id = ac.student_id ORDER BY id DESC LIMIT 1) as library_status,
                   (SELECT status FROM cafeteria_clearance WHERE student_id = ac.student_id ORDER BY id DESC LIMIT 1) as cafeteria_status,
                   (SELECT status FROM dormitory_clearance WHERE student_id = ac.student_id ORDER BY id DESC LIMIT 1) as dormitory_status,
                   (SELECT status FROM department_clearance WHERE student_id = ac.student_id ORDER BY id DESC LIMIT 1) as department_status,
                   fc.status as final_status,
                   fc.reject_reason as final_reject_reason,
                   ac.reject_reason as academic_reject_reason
            FROM academicstaff_clearance ac 
            INNER JOIN department_clearance dc ON ac.student_id = dc.student_id AND dc.status = 'approved'
            LEFT JOIN final_clearance fc ON ac.student_id = fc.student_id
            WHERE ac.academic_year = ?
        `;

        let queryParams = [currentAcademicYear];

        // Apply search filter
        if (search) {
            query += " AND (ac.name LIKE ? OR ac.last_name LIKE ? OR ac.student_id LIKE ? OR ac.department LIKE ?)";
            const searchTerm = `%${search}%`;
            queryParams.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        // Apply status filter
        if (status_filter === 'pending') {
            query += " AND fc.status IS NULL AND ac.status = 'pending'";
        } else if (status_filter === 'approved') {
            query += " AND fc.status = 'approved'";
        } else if (status_filter === 'rejected') {
            query += " AND fc.status = 'rejected'";
        }

        query += " ORDER BY " +
            "(CASE " +
            "    WHEN fc.status IS NULL AND " +
            "         (SELECT status FROM department_clearance WHERE student_id = ac.student_id ORDER BY id DESC LIMIT 1) = 'approved' " +
            "    THEN 1 " +
            "    ELSE 2 " +
            "END) ASC, " +
            "ac.student_id ASC";

        console.log('🔍 Executing main query...');
        const [students] = await db.execute(query, queryParams);
        console.log(`📋 Found ${students.length} students`);

        // Get approved final clearances for history - CURRENT ACADEMIC YEAR ONLY
        const [historyRows] = await db.execute(`
            SELECT fc.*, ac.department, ac.reject_reason as academic_reject_reason 
            FROM final_clearance fc 
            LEFT JOIN academicstaff_clearance ac ON fc.student_id = ac.student_id 
            WHERE fc.academic_year = ?
            ORDER BY fc.date_sent DESC 
            LIMIT 50
        `, [currentAcademicYear]);

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
            all_requests: students, // Changed from 'students' to 'all_requests'
            history: historyRows,
            search: search,
            status: status_filter
        });

        console.log('✅ Registrar dashboard rendered successfully');

    } catch (error) {
        console.error('❌ Error loading registrar dashboard:', error);
        res.status(500).render('error', {
            message: 'Error loading registrar dashboard',
            error: process.env.NODE_ENV === 'development' ? error : {}
        });
    }
});

// Handle Single and Bulk Actions
router.post('/registrar/dashboard', requireRegistrarAdmin, async (req, res) => {
    try {
        console.log('🔄 Processing registrar action...');
        const db = req.db;
        const {
            approve,
            reject,
            student_id,
            reject_reason,
            bulk_action,
            selected_students,
            bulk_reject_reason
        } = req.body;

        console.log('📦 Request body:', req.body);

        // Get current academic year from settings
        const [settingsRows] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        // Handle single approval
        if (approve && student_id) {
            await handleSingleApproval(db, student_id, req, currentAcademicYear);
        }
        // Handle single rejection
        else if (reject && student_id) {
            await handleSingleRejection(db, student_id, reject_reason, req, currentAcademicYear);
        }
        // Handle bulk actions
        else if (bulk_action) {
            await handleBulkAction(db, bulk_action, selected_students, bulk_reject_reason, req, currentAcademicYear);
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
        console.error('❌ Error processing registrar action:', error);
        res.status(500).json({ success: false, message: 'Error processing request' });
    }
});

// Single Approval Handler
async function handleSingleApproval(db, studentId, req, academicYear) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get student details from academicstaff_clearance table
        const [studentRows] = await connection.execute(
            "SELECT * FROM academicstaff_clearance WHERE student_id = ?",
            [studentId]
        );

        if (studentRows.length === 0) {
            throw new Error("Student clearance record not found");
        }

        const studentData = studentRows[0];

        // 2. Get student email from student table
        const [emailRows] = await connection.execute(
            "SELECT email FROM student WHERE student_id = ?",
            [studentId]
        );
        const studentEmail = emailRows.length > 0 ? emailRows[0].email : '';

        // 3. ONLY check department status
        const [approvalRows] = await connection.execute(
            "SELECT status FROM department_clearance WHERE student_id = ? ORDER BY id DESC LIMIT 1",
            [studentId]
        );

        const departmentStatus = approvalRows.length > 0 ? approvalRows[0].status : 'not_requested';

        // Check if department is approved
        if (departmentStatus === 'approved') {
            // Department has approved, proceed with final approval

            // 4. Check if final clearance record exists
            const [finalRows] = await connection.execute(
                "SELECT id FROM final_clearance WHERE student_id = ?",
                [studentId]
            );

            if (finalRows.length > 0) {
                // Update existing record
                await connection.execute(
                    `UPDATE final_clearance 
                     SET status = 'approved',
                         message = 'Final clearance approved by Registrar',
                         reject_reason = NULL,
                         academic_year = ?,
                         date_sent = NOW()
                     WHERE student_id = ?`,
                    [academicYear, studentId]
                );
            } else {
                // Insert new record
                await connection.execute(
                    `INSERT INTO final_clearance (
                        student_id, name, last_name, department, year, 
                        academic_year, message, status, date_sent
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        studentData.student_id,
                        studentData.name,
                        studentData.last_name,
                        studentData.department,
                        new Date().getFullYear(),
                        academicYear,
                        'Final clearance approved by Registrar',
                        'approved'
                    ]
                );
            }

            // 5. Update academic clearance status and clear reject reason
            await connection.execute(
                `UPDATE academicstaff_clearance 
                 SET status = 'approved', reject_reason = NULL 
                 WHERE student_id = ?`,
                [studentId]
            );

            // 6. UPDATE STUDENT STATUS FROM ACTIVE TO INACTIVE
            await connection.execute(
                "UPDATE student SET status = 'inactive' WHERE student_id = ?",
                [studentId]
            );

            // 7. Send approval email notification
            const studentName = `${studentData.name} ${studentData.last_name}`;
            let emailSent = false;
            if (studentEmail) {
                emailSent = await sendClearanceDecisionEmail(studentEmail, studentName, 'approved');
            }

            await connection.commit();

            const emailStatus = emailSent ? " and email notification sent" : " but email notification failed";
            req.session.success_message = `Final clearance approved for ${studentData.name} ${studentData.last_name} (ID: ${studentId}). Student status updated to inactive${emailStatus}.`;
        } else {
            throw new Error("Cannot approve: Student must be cleared by Department first.");
        }
    } catch (error) {
        await connection.rollback();
        req.session.error_message = error.message;
    } finally {
        connection.release();
    }
}

// Single Rejection Handler
async function handleSingleRejection(db, studentId, rejectReason, req, academicYear) {
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        // 1. Get student details from academicstaff_clearance table
        const [studentRows] = await connection.execute(
            "SELECT * FROM academicstaff_clearance WHERE student_id = ?",
            [studentId]
        );

        if (studentRows.length === 0) {
            throw new Error("Student clearance record not found");
        }

        const studentData = studentRows[0];

        // 2. Get student email from student table
        const [emailRows] = await connection.execute(
            "SELECT email FROM student WHERE student_id = ?",
            [studentId]
        );
        const studentEmail = emailRows.length > 0 ? emailRows[0].email : '';

        // 3. Check if final clearance record exists
        const [finalRows] = await connection.execute(
            "SELECT id FROM final_clearance WHERE student_id = ?",
            [studentId]
        );

        if (finalRows.length > 0) {
            // Update existing record
            await connection.execute(
                `UPDATE final_clearance 
                 SET status = 'rejected',
                     message = 'Final clearance rejected by Registrar',
                     reject_reason = ?,
                     academic_year = ?,
                     date_sent = NOW()
                 WHERE student_id = ?`,
                [rejectReason, academicYear, studentId]
            );
        } else {
            // Insert new record
            await connection.execute(
                `INSERT INTO final_clearance (
                    student_id, name, last_name, department, year, 
                    academic_year, message, status, reject_reason, date_sent
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                [
                    studentData.student_id,
                    studentData.name,
                    studentData.last_name,
                    studentData.department,
                    new Date().getFullYear(),
                    academicYear,
                    'Final clearance rejected by Registrar',
                    'rejected',
                    rejectReason
                ]
            );
        }

        // 4. Update academic clearance status AND store reject reason
        await connection.execute(
            `UPDATE academicstaff_clearance 
             SET status = 'rejected', reject_reason = ? 
             WHERE student_id = ?`,
            [rejectReason, studentId]
        );

        // 5. UPDATE STUDENT STATUS TO ACTIVE IF REJECTING
        await connection.execute(
            "UPDATE student SET status = 'active' WHERE student_id = ?",
            [studentId]
        );

        // 6. Send rejection email notification
        const studentName = `${studentData.name} ${studentData.last_name}`;
        let emailSent = false;
        if (studentEmail) {
            emailSent = await sendClearanceDecisionEmail(studentEmail, studentName, 'rejected', rejectReason);
        }

        await connection.commit();

        const emailStatus = emailSent ? " and email notification sent" : " but email notification failed";
        req.session.success_message = `Final clearance rejected for ${studentData.name} ${studentData.last_name} (ID: ${studentId})${emailStatus}`;
    } catch (error) {
        await connection.rollback();
        req.session.error_message = error.message;
    } finally {
        connection.release();
    }
}

// Bulk Action Handler
async function handleBulkAction(db, bulkAction, selectedStudents, bulkRejectReason, req, academicYear) {
    let selectedStudentsArray = [];

    // Handle both array and single value for selected_students
    if (Array.isArray(selectedStudents)) {
        selectedStudentsArray = selectedStudents;
    } else if (selectedStudents) {
        selectedStudentsArray = [selectedStudents];
    }

    console.log('📋 Selected students:', selectedStudentsArray);

    if (selectedStudentsArray.length === 0) {
        req.session.error_message = "Please select at least one student!";
        return;
    }

    if (bulkAction === 'approve') {
        await handleBulkApproval(db, selectedStudentsArray, req, academicYear);
    } else if (bulkAction === 'reject') {
        await handleBulkRejection(db, selectedStudentsArray, bulkRejectReason, req, academicYear);
    }
}

// Bulk Approval Handler
async function handleBulkApproval(db, studentIds, req, academicYear) {
    let successCount = 0;
    let failedCount = 0;
    let emailSuccessCount = 0;
    let emailFailedCount = 0;
    const failedReasons = [];

    for (const studentId of studentIds) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Get student details
            const [studentRows] = await connection.execute(
                "SELECT * FROM academicstaff_clearance WHERE student_id = ?",
                [studentId]
            );

            if (studentRows.length === 0) {
                throw new Error("Student clearance record not found");
            }

            const studentData = studentRows[0];

            // 2. Get student email
            const [emailRows] = await connection.execute(
                "SELECT email FROM student WHERE student_id = ?",
                [studentId]
            );
            const studentEmail = emailRows.length > 0 ? emailRows[0].email : '';

            // 3. ONLY check department status
            const [approvalRows] = await connection.execute(
                "SELECT status FROM department_clearance WHERE student_id = ? ORDER BY id DESC LIMIT 1",
                [studentId]
            );

            const departmentStatus = approvalRows.length > 0 ? approvalRows[0].status : 'not_requested';

            // Check if department is approved
            if (departmentStatus === 'approved') {
                // Department has approved, proceed with final approval

                // 4. Check if final clearance record exists
                const [finalRows] = await connection.execute(
                    "SELECT id FROM final_clearance WHERE student_id = ?",
                    [studentId]
                );

                if (finalRows.length > 0) {
                    // Update existing record
                    await connection.execute(
                        `UPDATE final_clearance 
                         SET status = 'approved',
                             message = 'Final clearance approved by Registrar',
                             reject_reason = NULL,
                             academic_year = ?,
                             date_sent = NOW()
                         WHERE student_id = ?`,
                        [academicYear, studentId]
                    );
                } else {
                    // Insert new record
                    await connection.execute(
                        `INSERT INTO final_clearance (
                            student_id, name, last_name, department, year, 
                            academic_year, message, status, date_sent
                        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                        [
                            studentData.student_id,
                            studentData.name,
                            studentData.last_name,
                            studentData.department,
                            new Date().getFullYear(),
                            academicYear,
                            'Final clearance approved by Registrar',
                            'approved'
                        ]
                    );
                }

                // 5. Update academic clearance status
                await connection.execute(
                    `UPDATE academicstaff_clearance 
                     SET status = 'approved', reject_reason = NULL 
                     WHERE student_id = ?`,
                    [studentId]
                );

                // 6. Update student status to inactive
                await connection.execute(
                    "UPDATE student SET status = 'inactive' WHERE student_id = ?",
                    [studentId]
                );

                // 7. Send approval email notification
                const studentName = `${studentData.name} ${studentData.last_name}`;
                if (studentEmail) {
                    if (await sendClearanceDecisionEmail(studentEmail, studentName, 'approved')) {
                        emailSuccessCount++;
                    } else {
                        emailFailedCount++;
                    }
                }

                await connection.commit();
                successCount++;
            } else {
                throw new Error("Department clearance required");
            }
        } catch (error) {
            await connection.rollback();
            failedCount++;
            failedReasons.push(`Student ${studentId}: ${error.message}`);
        } finally {
            connection.release();
        }
    }

    if (successCount > 0) {
        let emailStatus = "";
        if (emailSuccessCount > 0) {
            emailStatus += `, ${emailSuccessCount} email(s) sent`;
        }
        if (emailFailedCount > 0) {
            emailStatus += `, ${emailFailedCount} email(s) failed`;
        }

        req.session.success_message = `${successCount} student(s) approved successfully${emailStatus}!`;
        if (failedCount > 0) {
            req.session.success_message += ` ${failedCount} student(s) failed (missing department approval).`;
            if (failedReasons.length > 0) {
                req.session.success_message += " Issues: " + failedReasons.slice(0, 3).join('; ');
                if (failedReasons.length > 3) {
                    req.session.success_message += " and " + (failedReasons.length - 3) + " more";
                }
            }
        }
    } else {
        req.session.error_message = "No students could be approved. All selected students require Department clearance first.";
    }
}

// Bulk Rejection Handler
async function handleBulkRejection(db, studentIds, bulkRejectReason, req, academicYear) {
    // Validate that reject reason is not empty for bulk reject
    if (!bulkRejectReason || bulkRejectReason.trim().length === 0) {
        req.session.error_message = "Reject reason is required for bulk rejection!";
        return;
    }

    let successCount = 0;
    let failedCount = 0;
    let emailSuccessCount = 0;
    let emailFailedCount = 0;

    for (const studentId of studentIds) {
        const connection = await db.getConnection();

        try {
            await connection.beginTransaction();

            // 1. Get student details
            const [studentRows] = await connection.execute(
                "SELECT * FROM academicstaff_clearance WHERE student_id = ?",
                [studentId]
            );

            if (studentRows.length === 0) {
                throw new Error("Student clearance record not found");
            }

            const studentData = studentRows[0];

            // 2. Get student email
            const [emailRows] = await connection.execute(
                "SELECT email FROM student WHERE student_id = ?",
                [studentId]
            );
            const studentEmail = emailRows.length > 0 ? emailRows[0].email : '';

            // 3. Check if final clearance record exists
            const [finalRows] = await connection.execute(
                "SELECT id FROM final_clearance WHERE student_id = ?",
                [studentId]
            );

            if (finalRows.length > 0) {
                // Update existing record
                await connection.execute(
                    `UPDATE final_clearance 
                     SET status = 'rejected',
                         message = 'Final clearance rejected by Registrar',
                         reject_reason = ?,
                         academic_year = ?,
                         date_sent = NOW()
                     WHERE student_id = ?`,
                    [bulkRejectReason, academicYear, studentId]
                );
            } else {
                // Insert new record
                await connection.execute(
                    `INSERT INTO final_clearance (
                        student_id, name, last_name, department, year, 
                        academic_year, message, status, reject_reason, date_sent
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())`,
                    [
                        studentData.student_id,
                        studentData.name,
                        studentData.last_name,
                        studentData.department,
                        new Date().getFullYear(),
                        academicYear,
                        'Final clearance rejected by Registrar',
                        'rejected',
                        bulkRejectReason
                    ]
                );
            }

            // 4. Update academic clearance status
            await connection.execute(
                `UPDATE academicstaff_clearance 
                 SET status = 'rejected', reject_reason = ? 
                 WHERE student_id = ?`,
                [bulkRejectReason, studentId]
            );

            // 5. Update student status to active
            await connection.execute(
                "UPDATE student SET status = 'active' WHERE student_id = ?",
                [studentId]
            );

            // 6. Send rejection email notification
            const studentName = `${studentData.name} ${studentData.last_name}`;
            if (studentEmail) {
                if (await sendClearanceDecisionEmail(studentEmail, studentName, 'rejected', bulkRejectReason)) {
                    emailSuccessCount++;
                } else {
                    emailFailedCount++;
                }
            }

            await connection.commit();
            successCount++;
        } catch (error) {
            await connection.rollback();
            failedCount++;
        } finally {
            connection.release();
        }
    }

    if (successCount > 0) {
        let emailStatus = "";
        if (emailSuccessCount > 0) {
            emailStatus += `, ${emailSuccessCount} email(s) sent`;
        }
        if (emailFailedCount > 0) {
            emailStatus += `, ${emailFailedCount} email(s) failed`;
        }

        req.session.success_message = `${successCount} student(s) rejected successfully${emailStatus}!`;
        if (failedCount > 0) {
            req.session.success_message += ` ${failedCount} student(s) failed to process.`;
        }
    }
}

module.exports = router;
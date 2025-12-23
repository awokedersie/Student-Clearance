const nodemailer = require('nodemailer');
const transporter = require('../config/email');
const logger = require('../utils/logger');

// Configure email transporter (using config/email.js now)
// const emailTransporter = ... (Removed redundant config)

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

        const result = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent successfully:', result.messageId);
        return true;
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return false;
    }
}

exports.getDashboardData = async (req, res) => {
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
                   (SELECT status FROM library_clearance WHERE student_id = ac.student_id AND academic_year = ? ORDER BY id DESC LIMIT 1) as library_status,
                   (SELECT status FROM cafeteria_clearance WHERE student_id = ac.student_id AND academic_year = ? ORDER BY id DESC LIMIT 1) as cafeteria_status,
                   (SELECT status FROM dormitory_clearance WHERE student_id = ac.student_id AND academic_year = ? ORDER BY id DESC LIMIT 1) as dormitory_status,
                   (SELECT status FROM department_clearance WHERE student_id = ac.student_id AND academic_year = ? ORDER BY id DESC LIMIT 1) as department_status,
                   fc.status as final_status,
                   fc.reject_reason as final_reject_reason,
                   ac.reject_reason as academic_reject_reason
            FROM academicstaff_clearance ac 
            INNER JOIN department_clearance dc ON ac.student_id = dc.student_id AND dc.status = 'approved'
            LEFT JOIN final_clearance fc ON ac.student_id = fc.student_id
            WHERE ac.academic_year = ?
        `;

        let queryParams = [
            currentAcademicYear, currentAcademicYear, currentAcademicYear, currentAcademicYear, // SELECT subqueries
            currentAcademicYear // WHERE clause
        ];

        // Apply search filter
        if (search) {
            query += " AND (ac.name ILIKE ? OR ac.last_name ILIKE ? OR ac.student_id ILIKE ? OR ac.department ILIKE ?)";
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
            "         (SELECT status FROM department_clearance WHERE student_id = ac.student_id AND academic_year = '" + currentAcademicYear + "' ORDER BY id DESC LIMIT 1) = 'approved' " +
            "    THEN 1 " +
            "    ELSE 2 " +
            "END) ASC, " +
            "ac.student_id ASC";

        const [allStudents] = await db.execute(query, queryParams);

        // Map lock status
        const students = allStudents.map(s => {
            const isFinalized = s.final_status === 'approved'; // We could define a lock later, but for now allow Registrar to toggle
            return {
                ...s,
                is_locked: false, // Registrar can toggle statuses to fix mistakes
                locked_by_dept: null,
                can_approve: s.status !== 'approved' && s.department_status === 'approved',
                can_reject: s.status !== 'rejected'
            };
        });

        // Get approved final clearances for history - CURRENT ACADEMIC YEAR ONLY
        const [historyRows] = await db.execute(`
            SELECT fc.*, ac.department, ac.reject_reason as academic_reject_reason 
            FROM final_clearance fc 
            LEFT JOIN academicstaff_clearance ac ON fc.student_id = ac.student_id 
            WHERE fc.academic_year = ?
            ORDER BY fc.date_sent DESC 
            LIMIT 50
        `, [currentAcademicYear]);

        res.json({
            success: true,
            user: req.session.user,
            stats: stats,
            all_requests: students,
            history: historyRows,
            search: search,
            status: status_filter
        });

    } catch (error) {
        console.error('❌ Error loading registrar dashboard:', error);
        res.status(500).json({
            success: false,
            message: 'Error loading registrar dashboard: ' + error.message
        });
    }
};

exports.handleAction = async (req, res) => {
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

        // Get current academic year from settings
        const [settingsRows] = await db.execute(
            "SELECT academic_year FROM clearance_settings ORDER BY id DESC LIMIT 1"
        );
        const currentAcademicYear = settingsRows[0]?.academic_year || `${new Date().getFullYear()}-${new Date().getFullYear() + 1}`;

        let processedCount = 0;
        let studentsToProcess = [];

        if (bulk_action) {
            if (Array.isArray(selected_students)) {
                studentsToProcess = selected_students;
            } else if (selected_students) {
                studentsToProcess = [selected_students];
            }
        } else if (student_id) {
            studentsToProcess = [student_id];
        }

        if (studentsToProcess.length === 0) {
            return res.status(400).json({ success: false, message: 'No students selected' });
        }

        // Determine if this is an approval or rejection
        // Handle both Boolean and string 'true'/'false' from frontend
        const isApprove = bulk_action ? (bulk_action === 'approve') : (approve === 'true' || approve === true || !!approve);
        const finalStatus = isApprove ? 'approved' : 'rejected';
        const finalRejectReason = bulk_action ? bulk_reject_reason : reject_reason;

        console.log(`📝 Processing ${studentsToProcess.length} students. Action: ${finalStatus}`);

        for (const sid of studentsToProcess) {
            // Get student details for email and final_clearance record
            const [students] = await db.execute("SELECT * FROM student WHERE student_id = ?", [sid]);
            if (students.length === 0) {
                console.warn(`⚠️ Student not found: ${sid}`);
                continue;
            }
            const student = students[0];



            // 1. Update academicstaff_clearance status
            await db.execute(
                "UPDATE academicstaff_clearance SET status = ?, reject_reason = ?, approved_at = CASE WHEN ? = 'approved' THEN CURRENT_TIMESTAMP ELSE approved_at END, approved_by = ? WHERE student_id = ? AND academic_year = ?",
                [finalStatus, isApprove ? null : finalRejectReason, finalStatus, req.session.user.full_name || 'Registrar', sid, currentAcademicYear]
            );

            // Audit Log
            const actionLabel = finalStatus === 'approved' ? 'APPROVE_STUDENT' : 'REJECT_STUDENT';
            const logDetails = finalStatus === 'approved'
                ? 'Final registrar seal provided. Digital certificate generated.'
                : `Final registrar seal rejected. Reason: ${finalRejectReason || 'No reason specified'}`;

            await logger.log(req, actionLabel, sid, logDetails, `${student.name} ${student.last_name}`);

            // 2. Create/Update final_clearance record (Notification)
            const [existing] = await db.execute(
                "SELECT id FROM final_clearance WHERE student_id = ? AND academic_year = ?",
                [sid, currentAcademicYear]
            );

            if (existing.length > 0) {
                await db.execute(
                    "UPDATE final_clearance SET status = ?, reject_reason = ?, date_sent = NOW(), is_read = FALSE, year = ? WHERE id = ?",
                    [finalStatus, isApprove ? null : finalRejectReason, student.year, existing[0].id]
                );
            } else {
                const defaultMsg = isApprove ? 'Your final clearance has been approved. You can now download your certificate.' : `Your final clearance has been rejected. Reason: ${finalRejectReason || 'Please contact office'}`;
                await db.execute(
                    "INSERT INTO final_clearance (student_id, name, last_name, status, reject_reason, academic_year, is_read, message, year) VALUES (?, ?, ?, ?, ?, ?, FALSE, ?, ?)",
                    [sid, student.name, student.last_name, finalStatus, isApprove ? null : finalRejectReason, currentAcademicYear, defaultMsg, student.year]
                );
            }

            // 3. Update student status in the main student table
            // Approved means they are cleared and no longer 'active' students for the current session
            const studentStatus = isApprove ? 'inactive' : 'active';
            await db.execute("UPDATE student SET status = ? WHERE student_id = ?", [studentStatus, sid]);

            // 4. Send Email Notification
            const emailSent = await sendClearanceDecisionEmail(student.email, student.name, finalStatus, finalRejectReason);
            if (emailSent) {
                await db.execute("UPDATE final_clearance SET email_sent = TRUE WHERE student_id = ? AND academic_year = ?", [sid, currentAcademicYear]);
            }

            processedCount++;
        }

        res.json({
            success: true,
            message: `${processedCount} student(s) ${finalStatus} successfully.`
        });

    } catch (error) {
        console.error('❌ Error processing registrar action:', error);
        res.status(500).json({ success: false, message: 'Error processing request: ' + error.message });
    }
};
